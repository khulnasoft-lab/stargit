import { RepositoryStorageLayout } from "./storage-layout"
import { GitHookManager } from "./hook-manager"
import { promises as fs } from "fs"
import { join, dirname } from "path"
import { promisify } from "util"
import { rimraf } from "rimraf"

const exec = promisify(require("child_process").exec)

export interface GitRepositoryConfig {
  name: string
  owner: string
  organization?: string
  description?: string
  defaultBranch?: string
  visibility: "public" | "private" | "internal"
  hasIssues?: boolean
  hasWiki?: boolean
  hasProjects?: boolean
}

export interface GitRepositoryInfo {
  path: string
  size: number
  lastCommit?: {
    hash: string
    message: string
    author: string
    date: string
  }
  branches: string[]
  tags: string[]
  remotes: string[]
}

export class GitRepositoryManager {
  private storageLayout: RepositoryStorageLayout
  private hookManager: GitHookManager
  private gitUser: string
  private gitEmail: string

  constructor(basePath: string = process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories") {
    this.storageLayout = new RepositoryStorageLayout(basePath)
    this.hookManager = new GitHookManager()
    this.gitUser = process.env.GIT_USER || "git"
    this.gitEmail = process.env.GIT_EMAIL || "git@localhost"
  }

  /**
   * Execute git command in repository
   */
  private async execGit(repoPath: string, command: string): Promise<string> {
    try {
      const { stdout } = await exec(`git -C "${repoPath}" ${command}`)
      return stdout.trim()
    } catch (error) {
      throw new Error(`Git command failed: ${command} - ${(error as Error).message}`)
    }
  }

  /**
   * Create a new bare Git repository
   */
  async createRepository(config: GitRepositoryConfig): Promise<string> {
    const owner = config.organization || config.owner

    // Check if repository already exists
    try {
      const repoPath = await this.storageLayout.getRepositoryPath(owner, config.name)
      await fs.access(repoPath)
      throw new Error(`Repository ${owner}/${config.name} already exists`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }
    }

    try {
      // Initialize bare repository
      const repoPath = await this.storageLayout.initRepository(owner, config.name, config.description)

      // Set up repository configuration
      await this.execGit(repoPath, `config user.name "${this.gitUser}"`)
      await this.execGit(repoPath, `config user.email "${this.gitEmail}"`)

      // Set default branch if specified
      if (config.defaultBranch) {
        await this.execGit(repoPath, `symbolic-ref HEAD refs/heads/${config.defaultBranch}`)
      }

      // Set up Git hooks
      await this.hookManager.setupRepositoryHooks(repoPath, {
        owner,
        name: config.name,
        visibility: config.visibility,
      })

      // Create initial commit if default branch is specified
      if (config.defaultBranch) {
        await this.createInitialCommit(repoPath, config)
      }

      return repoPath
    } catch (error) {
      // Clean up on failure
      try {
        const repoPath = await this.storageLayout.getRepositoryPath(owner, config.name)
        await rimraf(repoPath)
      } catch (cleanupError) {
        console.error("Failed to clean up repository:", cleanupError)
      }
      throw error
    }
  }

  /**
   * Create initial commit with README
   */
  private async createInitialCommit(repoPath: string, config: GitRepositoryConfig): Promise<void> {
    const tempDir = await this.storageLayout.getTempWorkingDir()

    try {
      // Clone the bare repository to a temporary directory
      await exec(`git clone "${repoPath}" "${tempDir}"`)

      // Create README.md
      const readmeContent = `# ${config.name}\n\n${config.description || "A new Git repository"}\n`
      await fs.writeFile(join(tempDir, "README.md"), readmeContent)

      // Configure git user for this operation
      await exec(`git -C "${tempDir}" config user.name "${this.gitUser}"`)
      await exec(`git -C "${tempDir}" config user.email "${this.gitEmail}"`)

      // Add and commit
      await exec(`git -C "${tempDir}" add README.md`)
      await exec(`git -C "${tempDir}" commit -m "Initial commit"`)

      // Push to bare repository
      await exec(`git -C "${tempDir}" push origin ${config.defaultBranch || "main"}`)
    } finally {
      // Clean up temporary directory
      await this.storageLayout.cleanupTempDir(tempDir)
    }
  }

  /**
   * Rename repository
   */
  async renameRepository(owner: string, oldName: string, newName: string): Promise<string> {
    const oldPath = await this.storageLayout.getRepositoryPath(owner, oldName)
    const newPath = await this.storageLayout.getRepositoryPath(owner, newName)

    // Check if old repository exists
    try {
      await fs.access(oldPath)
    } catch (error) {
      throw new Error(`Repository ${owner}/${oldName} does not exist`)
    }

    // Check if new name is already taken
    try {
      await fs.access(newPath)
      throw new Error(`Repository ${owner}/${newName} already exists`)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error
      }
    }

    // Create parent directory for new path if it doesn't exist
    await fs.mkdir(dirname(newPath), { recursive: true })

    // Rename the repository directory
    await fs.rename(oldPath, newPath)

    return newPath
  }

  /**
   * Delete repository
   */
  async deleteRepository(owner: string, name: string): Promise<void> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)

    // Check if repository exists
    try {
      await fs.access(repoPath)
    } catch (error) {
      throw new Error(`Repository ${owner}/${name} does not exist`)
    }

    // Remove repository directory
    await rimraf(repoPath)
  }

  /**
   * Fork repository
   */
  async forkRepository(
    sourceOwner: string,
    sourceName: string,
    targetOwner: string,
    targetName: string,
  ): Promise<string> {
    // Fork repository with object sharing
    return this.storageLayout.forkRepository(sourceOwner, sourceName, targetOwner, targetName)
  }

  /**
   * Get repository information
   */
  async getRepositoryInfo(owner: string, name: string): Promise<GitRepositoryInfo> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)

    // Check if repository exists
    try {
      await fs.access(repoPath)
    } catch (error) {
      throw new Error(`Repository ${owner}/${name} does not exist`)
    }

    // Get repository size
    const size = await this.storageLayout.getRepositorySize(repoPath)

    // Get branches
    let branches: string[] = []
    try {
      const branchOutput = await this.execGit(repoPath, "branch -r")
      branches = branchOutput
        .split("\n")
        .map((branch) => branch.trim().replace("origin/", ""))
        .filter((branch) => branch && !branch.includes("HEAD"))
    } catch (error) {
      // Repository might be empty
    }

    // Get tags
    let tags: string[] = []
    try {
      const tagOutput = await this.execGit(repoPath, "tag -l")
      tags = tagOutput.split("\n").filter((tag) => tag.trim())
    } catch (error) {
      // No tags
    }

    // Get remotes
    let remotes: string[] = []
    try {
      const remoteOutput = await this.execGit(repoPath, "remote")
      remotes = remoteOutput.split("\n").filter((remote) => remote.trim())
    } catch (error) {
      // No remotes
    }

    // Get last commit info
    let lastCommit
    try {
      const commitHash = await this.execGit(repoPath, "rev-parse HEAD")
      const commitInfo = await this.execGit(repoPath, 'log -1 --format="%H|%s|%an|%ai"')
      const [hash, message, author, date] = commitInfo.split("|")
      lastCommit = { hash, message, author, date }
    } catch (error) {
      // Repository might be empty
    }

    return {
      path: repoPath,
      size,
      lastCommit,
      branches,
      tags,
      remotes,
    }
  }

  /**
   * Update repository description
   */
  async updateDescription(owner: string, name: string, description: string): Promise<void> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)
    await fs.writeFile(join(repoPath, "description"), description)
  }

  /**
   * Get repository description
   */
  async getDescription(owner: string, name: string): Promise<string> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)
    try {
      return await fs.readFile(join(repoPath, "description"), "utf-8")
    } catch (error) {
      return ""
    }
  }

  /**
   * Set default branch
   */
  async setDefaultBranch(owner: string, name: string, branch: string): Promise<void> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)
    await this.execGit(repoPath, `symbolic-ref HEAD refs/heads/${branch}`)
  }

  /**
   * Get default branch
   */
  async getDefaultBranch(owner: string, name: string): Promise<string> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, name)
    try {
      const ref = await this.execGit(repoPath, "symbolic-ref HEAD")
      return ref.replace("refs/heads/", "")
    } catch (error) {
      return "main" // Default fallback
    }
  }

  /**
   * Check if repository exists
   */
  async repositoryExists(owner: string, name: string): Promise<boolean> {
    try {
      const repoPath = await this.storageLayout.getRepositoryPath(owner, name)
      await fs.access(repoPath)
      return true
    } catch (error) {
      return false
    }
  }

  /**
   * Run garbage collection on repository
   */
  async runGarbageCollection(owner: string, name: string, aggressive = false): Promise<void> {
    await this.storageLayout.garbageCollect(owner, name, aggressive)
  }

  /**
   * Check repository health
   */
  async checkHealth(owner: string, name: string): Promise<{ healthy: boolean; issues: string[] }> {
    return this.storageLayout.checkRepositoryHealth(owner, name)
  }

  /**
   * Create repository backup
   */
  async createBackup(owner: string, name: string, backupPath: string): Promise<string> {
    return this.storageLayout.createBackup(owner, name, backupPath)
  }

  /**
   * Restore repository from backup
   */
  async restoreFromBackup(owner: string, name: string, backupFile: string): Promise<string> {
    return this.storageLayout.restoreFromBackup(owner, name, backupFile)
  }
}
