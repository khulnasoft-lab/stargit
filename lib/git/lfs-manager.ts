import { promises as fs } from "fs"
import { join, dirname } from "path"
import { promisify } from "util"
import { createHash } from "crypto"
import { supabase } from "../supabase"

const exec = promisify(require("child_process").exec)

/**
 * Git LFS (Large File Storage) Manager
 *
 * Handles Git LFS operations including:
 * - LFS object storage and retrieval
 * - Pointer file generation
 * - LFS hooks management
 * - Content-addressable storage
 */
export class GitLFSManager {
  private lfsStoragePath: string
  private tempPath: string

  constructor(
    storagePath: string = process.env.GIT_LFS_PATH || "/var/git/lfs-objects",
    tempPath: string = process.env.GIT_TEMP_PATH || "/var/git/temp",
  ) {
    this.lfsStoragePath = storagePath
    this.tempPath = tempPath
  }

  /**
   * Initialize LFS for a repository
   */
  async initializeLFS(repoPath: string): Promise<void> {
    try {
      // Ensure LFS is installed
      await exec("git lfs version")

      // Initialize LFS in the repository
      await exec(`cd "${repoPath}" && git lfs install --local`)

      // Create LFS hooks
      await this.setupLFSHooks(repoPath)

      console.log(`LFS initialized for repository at ${repoPath}`)
    } catch (error) {
      console.error("Failed to initialize LFS:", error)
      throw new Error(`LFS initialization failed: ${(error as Error).message}`)
    }
  }

  /**
   * Setup LFS hooks in repository
   */
  private async setupLFSHooks(repoPath: string): Promise<void> {
    const hooksDir = join(repoPath, "hooks")

    // Ensure hooks directory exists
    await fs.mkdir(hooksDir, { recursive: true })

    // Create pre-push hook for LFS
    const prePushHook = `#!/bin/sh
command -v git-lfs >/dev/null 2>&1 || { echo >&2 "Git LFS not installed."; exit 0; }
git lfs pre-push "$@"
`
    await fs.writeFile(join(hooksDir, "pre-push"), prePushHook)
    await fs.chmod(join(hooksDir, "pre-push"), 0o755)

    // Create post-checkout hook for LFS
    const postCheckoutHook = `#!/bin/sh
command -v git-lfs >/dev/null 2>&1 || { echo >&2 "Git LFS not installed."; exit 0; }
git lfs post-checkout "$@"
`
    await fs.writeFile(join(hooksDir, "post-checkout"), postCheckoutHook)
    await fs.chmod(join(hooksDir, "post-checkout"), 0o755)

    // Create post-merge hook for LFS
    const postMergeHook = `#!/bin/sh
command -v git-lfs >/dev/null 2>&1 || { echo >&2 "Git LFS not installed."; exit 0; }
git lfs post-merge "$@"
`
    await fs.writeFile(join(hooksDir, "post-merge"), postMergeHook)
    await fs.chmod(join(hooksDir, "post-merge"), 0o755)
  }

  /**
   * Track files with LFS
   */
  async trackFiles(repoPath: string, patterns: string[]): Promise<void> {
    try {
      for (const pattern of patterns) {
        await exec(`cd "${repoPath}" && git lfs track "${pattern}"`)
      }

      // Commit .gitattributes changes
      await exec(`cd "${repoPath}" && git add .gitattributes`)

      console.log(`LFS tracking set up for patterns: ${patterns.join(", ")}`)
    } catch (error) {
      console.error("Failed to set up LFS tracking:", error)
      throw new Error(`LFS tracking failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get tracked LFS patterns for a repository
   */
  async getTrackedPatterns(repoPath: string): Promise<string[]> {
    try {
      const { stdout } = await exec(`cd "${repoPath}" && git lfs track`)

      // Parse output to extract patterns
      const lines = stdout.split("\n")
      const patterns: string[] = []

      for (const line of lines) {
        const match = line.match(/Tracking "([^"]+)"/)
        if (match && match[1]) {
          patterns.push(match[1])
        }
      }

      return patterns
    } catch (error) {
      console.error("Failed to get LFS tracked patterns:", error)
      return []
    }
  }

  /**
   * Store LFS object
   */
  async storeObject(content: Buffer): Promise<{ oid: string; size: number }> {
    // Calculate SHA-256 hash of content
    const oid = createHash("sha256").update(content).digest("hex")
    const size = content.length

    // Determine storage path using OID prefix for sharding
    const prefix = oid.substring(0, 2)
    const objectPath = join(this.lfsStoragePath, prefix, oid)

    // Create directory if it doesn't exist
    await fs.mkdir(dirname(objectPath), { recursive: true })

    // Store the object
    await fs.writeFile(objectPath, content)

    // Record in database
    await this.recordLFSObject(oid, size)

    return { oid, size }
  }

  /**
   * Record LFS object in database
   */
  private async recordLFSObject(oid: string, size: number): Promise<void> {
    await supabase.from("lfs_objects").upsert({
      oid,
      size,
      created_at: new Date().toISOString(),
    })
  }

  /**
   * Generate LFS pointer file content
   */
  generatePointerFile(oid: string, size: number): string {
    return `version https://git-lfs.github.com/spec/v1
oid sha256:${oid}
size ${size}
`
  }

  /**
   * Get LFS object
   */
  async getObject(oid: string): Promise<Buffer> {
    const prefix = oid.substring(0, 2)
    const objectPath = join(this.lfsStoragePath, prefix, oid)

    try {
      return await fs.readFile(objectPath)
    } catch (error) {
      throw new Error(`LFS object not found: ${oid}`)
    }
  }

  /**
   * Check if an object exists in LFS storage
   */
  async objectExists(oid: string): Promise<boolean> {
    const prefix = oid.substring(0, 2)
    const objectPath = join(this.lfsStoragePath, prefix, oid)

    try {
      await fs.access(objectPath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get LFS objects for a repository
   */
  async getRepositoryLFSObjects(repoPath: string): Promise<Array<{ oid: string; size: number; path: string }>> {
    try {
      // Get list of LFS objects in the repository
      const { stdout } = await exec(`cd "${repoPath}" && git lfs ls-files --long`)

      // Parse output
      const lines = stdout.split("\n").filter(Boolean)
      const objects: Array<{ oid: string; size: number; path: string }> = []

      for (const line of lines) {
        // Format: <oid> - <path> (<size>)
        const match = line.match(/([a-f0-9]{64}) - (.+) $$(\d+)$$/)
        if (match) {
          objects.push({
            oid: match[1],
            path: match[2],
            size: Number.parseInt(match[3], 10),
          })
        }
      }

      return objects
    } catch (error) {
      console.error("Failed to get LFS objects:", error)
      return []
    }
  }

  /**
   * Prune unused LFS objects
   */
  async pruneObjects(): Promise<number> {
    try {
      // Get all LFS objects in storage
      const allObjects = await this.getAllStoredObjects()

      // Get all referenced objects from database
      const { data: referencedObjects } = await supabase.from("lfs_objects").select("oid").eq("referenced", true)

      const referencedOids = new Set(referencedObjects?.map((obj) => obj.oid) || [])
      let prunedCount = 0

      // Delete unreferenced objects
      for (const oid of allObjects) {
        if (!referencedOids.has(oid)) {
          await this.deleteObject(oid)
          prunedCount++
        }
      }

      return prunedCount
    } catch (error) {
      console.error("Failed to prune LFS objects:", error)
      throw new Error(`LFS pruning failed: ${(error as Error).message}`)
    }
  }

  /**
   * Get all stored LFS objects
   */
  private async getAllStoredObjects(): Promise<string[]> {
    const objects: string[] = []

    async function scanDirectory(dir: string) {
      const entries = await fs.readdir(dir, { withFileTypes: true })

      for (const entry of entries) {
        const fullPath = join(dir, entry.name)

        if (entry.isDirectory()) {
          await scanDirectory(fullPath)
        } else if (entry.isFile() && /^[a-f0-9]{64}$/.test(entry.name)) {
          objects.push(entry.name)
        }
      }
    }

    await scanDirectory(this.lfsStoragePath)
    return objects
  }

  /**
   * Delete an LFS object
   */
  private async deleteObject(oid: string): Promise<void> {
    const prefix = oid.substring(0, 2)
    const objectPath = join(this.lfsStoragePath, prefix, oid)

    try {
      await fs.unlink(objectPath)

      // Remove from database
      await supabase.from("lfs_objects").delete().eq("oid", oid)
    } catch (error) {
      console.error(`Failed to delete LFS object ${oid}:`, error)
    }
  }

  /**
   * Get LFS storage stats
   */
  async getStorageStats(): Promise<{ objectCount: number; totalSize: number }> {
    try {
      const { count } = await supabase.from("lfs_objects").select("*", { count: "exact", head: true })

      const { data: sizeData } = await supabase.from("lfs_objects").select("size")

      const totalSize = sizeData?.reduce((sum, obj) => sum + obj.size, 0) || 0

      return {
        objectCount: count || 0,
        totalSize,
      }
    } catch (error) {
      console.error("Failed to get LFS storage stats:", error)
      return { objectCount: 0, totalSize: 0 }
    }
  }
}

// Export singleton instance
export const lfsManager = new GitLFSManager()
