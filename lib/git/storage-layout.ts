import path from "path"
import fs from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import { createHash } from "crypto"

const execAsync = promisify(exec)

/**
 * Repository storage layout manager
 *
 * Implements an efficient storage layout for Git repositories:
 * - Uses sharded storage to prevent filesystem limitations
 * - Supports bare repositories for efficient server-side storage
 * - Implements object sharing between forks for storage efficiency
 * - Handles repository paths and access patterns
 */
export class RepositoryStorageLayout {
  private basePath: string
  private tempPath: string

  constructor(basePath: string = process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories") {
    this.basePath = basePath
    this.tempPath = process.env.GIT_TEMP_PATH || "/var/git/temp"
  }

  /**
   * Get repository path using sharded storage layout
   *
   * Uses a sharded directory structure to prevent filesystem limitations:
   * /base/path/aa/bb/owner/repository.git
   *
   * Where aa/bb are the first two character pairs of the repository hash
   */
  async getRepositoryPath(owner: string, name: string): Promise<string> {
    // Create a hash of the repository name for sharding
    const hash = createHash("sha1").update(`${owner}/${name}`).digest("hex")

    // Use first two character pairs for sharding
    const shard1 = hash.substring(0, 2)
    const shard2 = hash.substring(2, 4)

    // Construct the full path
    return path.join(this.basePath, shard1, shard2, owner, `${name}.git`)
  }

  /**
   * Initialize a new bare repository
   */
  async initRepository(owner: string, name: string, description?: string): Promise<string> {
    const repoPath = await this.getRepositoryPath(owner, name)

    // Ensure directory exists
    await fs.mkdir(path.dirname(repoPath), { recursive: true })

    // Initialize bare repository
    await execAsync(`git init --bare "${repoPath}"`)

    // Set description if provided
    if (description) {
      await fs.writeFile(path.join(repoPath, "description"), description)
    }

    // Set default configuration
    await execAsync(`git -C "${repoPath}" config core.sharedRepository group`)
    await execAsync(`git -C "${repoPath}" config receive.fsckObjects true`)
    await execAsync(`git -C "${repoPath}" config receive.denyNonFastForwards true`)

    return repoPath
  }

  /**
   * Fork a repository with object sharing
   *
   * Uses Git's alternates mechanism to share objects between repositories,
   * significantly reducing disk space usage for forks
   */
  async forkRepository(
    sourceOwner: string,
    sourceName: string,
    targetOwner: string,
    targetName: string,
  ): Promise<string> {
    const sourcePath = await this.getRepositoryPath(sourceOwner, sourceName)
    const targetPath = await this.getRepositoryPath(targetOwner, targetName)

    // Create target directory
    await fs.mkdir(path.dirname(targetPath), { recursive: true })

    // Clone as bare repository with shared objects
    await execAsync(`git clone --bare --shared "${sourcePath}" "${targetPath}"`)

    // Set up alternates file to share objects with source repository
    const objectsPath = path.join(targetPath, "objects")
    const alternatesPath = path.join(objectsPath, "info", "alternates")
    const relativeSourceObjects = path.relative(objectsPath, path.join(sourcePath, "objects"))

    await fs.mkdir(path.join(objectsPath, "info"), { recursive: true })
    await fs.writeFile(alternatesPath, relativeSourceObjects)

    return targetPath
  }

  /**
   * Get temporary working directory for operations
   */
  async getTempWorkingDir(prefix = "git-work-"): Promise<string> {
    // Create temp directory if it doesn't exist
    await fs.mkdir(this.tempPath, { recursive: true })

    // Generate unique directory name
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9)
    const tempDir = path.join(this.tempPath, `${prefix}${uniqueSuffix}`)

    // Create the directory
    await fs.mkdir(tempDir)

    return tempDir
  }

  /**
   * Clean up temporary working directory
   */
  async cleanupTempDir(tempDir: string): Promise<void> {
    try {
      await execAsync(`rm -rf "${tempDir}"`)
    } catch (error) {
      console.error(`Failed to clean up temp directory ${tempDir}:`, error)
    }
  }

  /**
   * Calculate repository size
   */
  async getRepositorySize(repoPath: string): Promise<number> {
    try {
      const { stdout } = await execAsync(`du -sk "${repoPath}" | cut -f1`)
      return Number.parseInt(stdout.trim(), 10) * 1024 // Convert KB to bytes
    } catch (error) {
      console.error(`Failed to get repository size for ${repoPath}:`, error)
      return 0
    }
  }

  /**
   * Run garbage collection on repository
   */
  async garbageCollect(owner: string, name: string, aggressive = false): Promise<void> {
    const repoPath = await this.getRepositoryPath(owner, name)
    const gcCommand = aggressive ? "git gc --aggressive --prune=now" : "git gc --auto"

    try {
      await execAsync(`cd "${repoPath}" && ${gcCommand}`)
    } catch (error) {
      console.error(`Failed to run garbage collection on ${repoPath}:`, error)
      throw new Error(`Garbage collection failed: ${(error as Error).message}`)
    }
  }

  /**
   * Check repository health
   */
  async checkRepositoryHealth(owner: string, name: string): Promise<{ healthy: boolean; issues: string[] }> {
    const repoPath = await this.getRepositoryPath(owner, name)
    const issues: string[] = []

    try {
      // Check if repository exists
      await fs.access(repoPath)

      // Run fsck to check for corruption
      try {
        await execAsync(`git -C "${repoPath}" fsck --full`)
      } catch (error) {
        issues.push(`Repository integrity check failed: ${(error as Error).message}`)
      }

      // Check for required files
      const requiredFiles = ["HEAD", "config", "objects", "refs"]
      for (const file of requiredFiles) {
        try {
          await fs.access(path.join(repoPath, file))
        } catch {
          issues.push(`Missing required file/directory: ${file}`)
        }
      }

      return {
        healthy: issues.length === 0,
        issues,
      }
    } catch (error) {
      return {
        healthy: false,
        issues: [`Repository not found: ${(error as Error).message}`],
      }
    }
  }

  /**
   * Create repository backup
   */
  async createBackup(owner: string, name: string, backupPath: string): Promise<string> {
    const repoPath = await this.getRepositoryPath(owner, name)
    const backupFile = path.join(backupPath, `${owner}-${name}-${Date.now()}.bundle`)

    try {
      // Create bundle backup
      await execAsync(`git -C "${repoPath}" bundle create "${backupFile}" --all`)
      return backupFile
    } catch (error) {
      throw new Error(`Backup failed: ${(error as Error).message}`)
    }
  }

  /**
   * Restore repository from backup
   */
  async restoreFromBackup(owner: string, name: string, backupFile: string): Promise<string> {
    const repoPath = await this.getRepositoryPath(owner, name)
    const tempDir = await this.getTempWorkingDir("restore-")

    try {
      // Clone from bundle
      await execAsync(`git clone "${backupFile}" "${tempDir}"`)

      // Initialize bare repository
      await this.initRepository(owner, name)

      // Push all refs to the new repository
      await execAsync(`cd "${tempDir}" && git push --mirror "${repoPath}"`)

      return repoPath
    } catch (error) {
      throw new Error(`Restore failed: ${(error as Error).message}`)
    } finally {
      await this.cleanupTempDir(tempDir)
    }
  }
}
