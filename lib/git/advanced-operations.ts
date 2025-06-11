import { promises as fs } from "fs"
import { join } from "path"
import { promisify } from "util"
import { RepositoryStorageLayout } from "./storage-layout"

const exec = promisify(require("child_process").exec)

/**
 * Advanced Git Operations Manager
 *
 * Provides advanced Git operations including:
 * - Cherry-picking
 * - Rebasing
 * - Bisect
 * - Blame
 * - Stashing
 * - Reflog management
 * - Advanced diff operations
 */
export class AdvancedGitOperations {
  private storageLayout: RepositoryStorageLayout

  constructor() {
    this.storageLayout = new RepositoryStorageLayout()
  }

  /**
   * Cherry-pick a commit from one branch to another
   */
  async cherryPick(
    owner: string,
    repoName: string,
    commitHash: string,
    options: { noCommit?: boolean; signoff?: boolean } = {},
  ): Promise<{ success: boolean; message: string; resultCommit?: string }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)
    const tempDir = await this.storageLayout.getTempWorkingDir()

    try {
      // Clone the repository to temp directory
      await exec(`git clone "${repoPath}" "${tempDir}"`)

      // Build cherry-pick command
      let command = `cd "${tempDir}" && git cherry-pick`

      if (options.noCommit) {
        command += " --no-commit"
      }

      if (options.signoff) {
        command += " --signoff"
      }

      command += ` ${commitHash}`

      // Execute cherry-pick
      await exec(command)

      // Get the resulting commit hash if auto-committed
      let resultCommit: string | undefined

      if (!options.noCommit) {
        const { stdout } = await exec(`cd "${tempDir}" && git rev-parse HEAD`)
        resultCommit = stdout.trim()
      }

      // Push changes back to bare repository
      await exec(`cd "${tempDir}" && git push origin HEAD`)

      return {
        success: true,
        message: "Cherry-pick completed successfully",
        resultCommit,
      }
    } catch (error) {
      console.error("Cherry-pick failed:", error)
      return {
        success: false,
        message: `Cherry-pick failed: ${(error as Error).message}`,
      }
    } finally {
      // Clean up temp directory
      await this.storageLayout.cleanupTempDir(tempDir)
    }
  }

  /**
   * Rebase a branch onto another
   */
  async rebase(
    owner: string,
    repoName: string,
    baseBranch: string,
    targetBranch: string,
    options: { interactive?: boolean; onto?: string; signoff?: boolean } = {},
  ): Promise<{ success: boolean; message: string }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)
    const tempDir = await this.storageLayout.getTempWorkingDir()

    try {
      // Clone the repository to temp directory
      await exec(`git clone "${repoPath}" "${tempDir}"`)

      // Checkout the target branch
      await exec(`cd "${tempDir}" && git checkout ${targetBranch}`)

      // Build rebase command
      let command = `cd "${tempDir}" && git rebase`

      if (options.interactive) {
        command += " --interactive"
      }

      if (options.signoff) {
        command += " --signoff"
      }

      if (options.onto) {
        command += ` --onto ${options.onto}`
      }

      command += ` ${baseBranch}`

      // Execute rebase
      await exec(command)

      // Push changes back to bare repository (force push required for rebase)
      await exec(`cd "${tempDir}" && git push origin ${targetBranch} --force`)

      return {
        success: true,
        message: "Rebase completed successfully",
      }
    } catch (error) {
      console.error("Rebase failed:", error)
      return {
        success: false,
        message: `Rebase failed: ${(error as Error).message}`,
      }
    } finally {
      // Clean up temp directory
      await this.storageLayout.cleanupTempDir(tempDir)
    }
  }

  /**
   * Get blame information for a file
   */
  async getBlame(
    owner: string,
    repoName: string,
    filePath: string,
    options: { branch?: string; startLine?: number; endLine?: number } = {},
  ): Promise<
    Array<{
      commit: string
      author: string
      authorEmail: string
      authorDate: string
      line: number
      content: string
    }>
  > {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)

    try {
      // Build blame command
      let command = `cd "${repoPath}" && git blame -p`

      if (options.branch) {
        command += ` ${options.branch}`
      }

      if (options.startLine !== undefined && options.endLine !== undefined) {
        command += ` -L ${options.startLine},${options.endLine}`
      }

      command += ` -- "${filePath}"`

      // Execute blame
      const { stdout } = await exec(command)

      // Parse blame output
      return this.parseBlameOutput(stdout)
    } catch (error) {
      console.error("Blame failed:", error)
      return []
    }
  }

  /**
   * Parse git blame output
   */
  private parseBlameOutput(output: string): Array<{
    commit: string
    author: string
    authorEmail: string
    authorDate: string
    line: number
    content: string
  }> {
    const lines = output.split("\n")
    const result: Array<{
      commit: string
      author: string
      authorEmail: string
      authorDate: string
      line: number
      content: string
    }> = []

    let currentCommit: string | null = null
    let currentAuthor: string | null = null
    let currentAuthorEmail: string | null = null
    let currentAuthorDate: string | null = null
    let currentLine: number | null = null

    for (const line of lines) {
      if (line.startsWith("\t")) {
        // This is a content line
        if (currentCommit && currentAuthor && currentAuthorEmail && currentAuthorDate && currentLine !== null) {
          result.push({
            commit: currentCommit,
            author: currentAuthor,
            authorEmail: currentAuthorEmail,
            authorDate: currentAuthorDate,
            line: currentLine,
            content: line.substring(1), // Remove the tab
          })
        }
      } else if (line.match(/^[0-9a-f]{40}/)) {
        // This is a commit line
        const parts = line.split(" ")
        currentCommit = parts[0]
        currentLine = Number.parseInt(parts[2], 10)
      } else if (line.startsWith("author ")) {
        currentAuthor = line.substring(7)
      } else if (line.startsWith("author-mail ")) {
        currentAuthorEmail = line.substring(12).replace(/[<>]/g, "")
      } else if (line.startsWith("author-time ")) {
        const timestamp = Number.parseInt(line.substring(12), 10)
        currentAuthorDate = new Date(timestamp * 1000).toISOString()
      }
    }

    return result
  }

  /**
   * Get reflog entries for a repository
   */
  async getReflog(
    owner: string,
    repoName: string,
    options: { ref?: string; limit?: number } = {},
  ): Promise<
    Array<{
      commit: string
      action: string
      message: string
      date: string
    }>
  > {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)

    try {
      // Build reflog command
      let command = `cd "${repoPath}" && git reflog --format="%H|%gd|%gs|%aI"`

      if (options.ref) {
        command += ` ${options.ref}`
      }

      if (options.limit) {
        command += ` -n ${options.limit}`
      }

      // Execute reflog
      const { stdout } = await exec(command)

      // Parse reflog output
      const entries: Array<{
        commit: string
        action: string
        message: string
        date: string
      }> = []

      const lines = stdout.split("\n").filter(Boolean)

      for (const line of lines) {
        const [commit, action, message, date] = line.split("|")
        entries.push({ commit, action, message, date })
      }

      return entries
    } catch (error) {
      console.error("Reflog failed:", error)
      return []
    }
  }

  /**
   * Start a bisect operation
   */
  async startBisect(
    owner: string,
    repoName: string,
    goodCommit: string,
    badCommit: string,
  ): Promise<{ success: boolean; message: string; remainingSteps?: number }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)
    const tempDir = await this.storageLayout.getTempWorkingDir()

    try {
      // Clone the repository to temp directory
      await exec(`git clone "${repoPath}" "${tempDir}"`)

      // Start bisect
      await exec(`cd "${tempDir}" && git bisect start ${badCommit} ${goodCommit}`)

      // Get remaining steps
      const { stdout } = await exec(`cd "${tempDir}" && git bisect visualize --oneline | wc -l`)
      const remainingSteps = Number.parseInt(stdout.trim(), 10)

      return {
        success: true,
        message: "Bisect started successfully",
        remainingSteps,
      }
    } catch (error) {
      console.error("Bisect failed:", error)
      return {
        success: false,
        message: `Bisect failed: ${(error as Error).message}`,
      }
    } finally {
      // Clean up temp directory
      await this.storageLayout.cleanupTempDir(tempDir)
    }
  }

  /**
   * Get diff between two commits/branches
   */
  async getDiff(
    owner: string,
    repoName: string,
    base: string,
    head: string,
    options: { path?: string; context?: number; ignoreWhitespace?: boolean } = {},
  ): Promise<{
    files: Array<{
      path: string
      status: "added" | "modified" | "deleted" | "renamed"
      oldPath?: string
      additions: number
      deletions: number
      changes: number
      binary: boolean
      hunks: Array<{
        oldStart: number
        oldLines: number
        newStart: number
        newLines: number
        lines: Array<{
          type: "context" | "addition" | "deletion"
          content: string
        }>
      }>
    }>
    stats: {
      files: number
      additions: number
      deletions: number
    }
  }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)

    try {
      // Build diff command
      let command = `cd "${repoPath}" && git diff --full-index`

      if (options.context !== undefined) {
        command += ` -U${options.context}`
      }

      if (options.ignoreWhitespace) {
        command += " --ignore-all-space"
      }

      command += ` ${base}..${head}`

      if (options.path) {
        command += ` -- "${options.path}"`
      }

      // Execute diff
      const { stdout } = await exec(command)

      // Get stats
      const { stdout: statsOutput } = await exec(
        `cd "${repoPath}" && git diff --numstat ${base}..${head}${options.path ? ` -- "${options.path}"` : ""}`,
      )

      // Parse diff output
      return this.parseDiffOutput(stdout, statsOutput)
    } catch (error) {
      console.error("Diff failed:", error)
      return {
        files: [],
        stats: { files: 0, additions: 0, deletions: 0 },
      }
    }
  }

  /**
   * Parse git diff output
   */
  private parseDiffOutput(
    diffOutput: string,
    statsOutput: string,
  ): {
    files: Array<{
      path: string
      status: "added" | "modified" | "deleted" | "renamed"
      oldPath?: string
      additions: number
      deletions: number
      changes: number
      binary: boolean
      hunks: Array<{
        oldStart: number
        oldLines: number
        newStart: number
        newLines: number
        lines: Array<{
          type: "context" | "addition" | "deletion"
          content: string
        }>
      }>
    }>
    stats: {
      files: number
      additions: number
      deletions: number
    }
  } {
    // Parse stats
    const statsLines = statsOutput.split("\n").filter(Boolean)
    let totalAdditions = 0
    let totalDeletions = 0

    const fileStats: Record<string, { additions: number; deletions: number }> = {}

    for (const line of statsLines) {
      const [additions, deletions, path] = line.split("\t")

      if (additions === "-" && deletions === "-") {
        // Binary file
        fileStats[path] = { additions: 0, deletions: 0 }
      } else {
        const addCount = Number.parseInt(additions, 10)
        const delCount = Number.parseInt(deletions, 10)

        fileStats[path] = { additions: addCount, deletions: delCount }

        totalAdditions += addCount
        totalDeletions += delCount
      }
    }

    // Parse diff
    const files: Array<{
      path: string
      status: "added" | "modified" | "deleted" | "renamed"
      oldPath?: string
      additions: number
      deletions: number
      changes: number
      binary: boolean
      hunks: Array<{
        oldStart: number
        oldLines: number
        newStart: number
        newLines: number
        lines: Array<{
          type: "context" | "addition" | "deletion"
          content: string
        }>
      }>
    }> = []

    // Split diff output by file
    const fileDiffs = diffOutput.split("diff --git ").slice(1)

    for (const fileDiff of fileDiffs) {
      const lines = fileDiff.split("\n")
      const fileHeaderLine = lines[0]

      // Parse file header
      const fileHeaderMatch = fileHeaderLine.match(/a\/(.+) b\/(.+)/)
      if (!fileHeaderMatch) continue

      const [, oldPath, newPath] = fileHeaderMatch

      // Determine file status
      let status: "added" | "modified" | "deleted" | "renamed" = "modified"
      let path = newPath

      if (lines.some((line) => line.startsWith("new file mode"))) {
        status = "added"
      } else if (lines.some((line) => line.startsWith("deleted file mode"))) {
        status = "deleted"
        path = oldPath
      } else if (oldPath !== newPath) {
        status = "renamed"
      }

      // Check if binary
      const binary = lines.some((line) => line.includes("Binary files") || line.includes("GIT binary patch"))

      // Get stats for this file
      const stats = fileStats[path] || { additions: 0, deletions: 0 }

      // Parse hunks
      const hunks: Array<{
        oldStart: number
        oldLines: number
        newStart: number
        newLines: number
        lines: Array<{
          type: "context" | "addition" | "deletion"
          content: string
        }>
      }> = []

      if (!binary) {
        let currentHunk: {
          oldStart: number
          oldLines: number
          newStart: number
          newLines: number
          lines: Array<{
            type: "context" | "addition" | "deletion"
            content: string
          }>
        } | null = null

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]

          // Parse hunk header
          const hunkMatch = line.match(/@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/)

          if (hunkMatch) {
            if (currentHunk) {
              hunks.push(currentHunk)
            }

            const [, oldStart, oldLinesStr, newStart, newLinesStr] = hunkMatch

            currentHunk = {
              oldStart: Number.parseInt(oldStart, 10),
              oldLines: oldLinesStr ? Number.parseInt(oldLinesStr, 10) : 1,
              newStart: Number.parseInt(newStart, 10),
              newLines: newLinesStr ? Number.parseInt(newLinesStr, 10) : 1,
              lines: [],
            }
          } else if (currentHunk && line.startsWith("+")) {
            currentHunk.lines.push({
              type: "addition",
              content: line.substring(1),
            })
          } else if (currentHunk && line.startsWith("-")) {
            currentHunk.lines.push({
              type: "deletion",
              content: line.substring(1),
            })
          } else if (currentHunk && line.startsWith(" ")) {
            currentHunk.lines.push({
              type: "context",
              content: line.substring(1),
            })
          }
        }

        if (currentHunk) {
          hunks.push(currentHunk)
        }
      }

      files.push({
        path,
        status,
        oldPath: status === "renamed" ? oldPath : undefined,
        additions: stats.additions,
        deletions: stats.deletions,
        changes: stats.additions + stats.deletions,
        binary,
        hunks,
      })
    }

    return {
      files,
      stats: {
        files: files.length,
        additions: totalAdditions,
        deletions: totalDeletions,
      },
    }
  }

  /**
   * Create and apply a patch
   */
  async createPatch(
    owner: string,
    repoName: string,
    base: string,
    head: string,
    options: { path?: string; output?: string } = {},
  ): Promise<{ success: boolean; patch?: string; message: string }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)

    try {
      // Build patch command
      let command = `cd "${repoPath}" && git format-patch --stdout`

      command += ` ${base}..${head}`

      if (options.path) {
        command += ` -- "${options.path}"`
      }

      // Execute patch creation
      const { stdout } = await exec(command)

      // Save to file if output path provided
      if (options.output) {
        await fs.writeFile(options.output, stdout)
      }

      return {
        success: true,
        patch: stdout,
        message: "Patch created successfully",
      }
    } catch (error) {
      console.error("Patch creation failed:", error)
      return {
        success: false,
        message: `Patch creation failed: ${(error as Error).message}`,
      }
    }
  }

  /**
   * Apply a patch
   */
  async applyPatch(
    owner: string,
    repoName: string,
    patchContent: string,
    options: { signoff?: boolean; threeWay?: boolean } = {},
  ): Promise<{ success: boolean; message: string }> {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)
    const tempDir = await this.storageLayout.getTempWorkingDir()
    const patchFile = join(tempDir, "patch.diff")

    try {
      // Clone the repository to temp directory
      await exec(`git clone "${repoPath}" "${tempDir}"`)

      // Write patch to file
      await fs.writeFile(patchFile, patchContent)

      // Build apply command
      let command = `cd "${tempDir}" && git am`

      if (options.signoff) {
        command += " --signoff"
      }

      if (options.threeWay) {
        command += " --3way"
      }

      command += ` "${patchFile}"`

      // Apply patch
      await exec(command)

      // Push changes back to bare repository
      await exec(`cd "${tempDir}" && git push origin HEAD`)

      return {
        success: true,
        message: "Patch applied successfully",
      }
    } catch (error) {
      console.error("Patch application failed:", error)
      return {
        success: false,
        message: `Patch application failed: ${(error as Error).message}`,
      }
    } finally {
      // Clean up temp directory
      await this.storageLayout.cleanupTempDir(tempDir)
    }
  }

  /**
   * Get commit history with advanced filtering
   */
  async getCommitHistory(
    owner: string,
    repoName: string,
    options: {
      branch?: string
      path?: string
      author?: string
      since?: string
      until?: string
      grep?: string
      limit?: number
      skip?: number
    } = {},
  ): Promise<
    Array<{
      hash: string
      shortHash: string
      parentHashes: string[]
      author: string
      authorEmail: string
      authorDate: string
      committer: string
      committerEmail: string
      committerDate: string
      message: string
      files: Array<{
        path: string
        status: string
        additions: number
        deletions: number
      }>
    }>
  > {
    const repoPath = await this.storageLayout.getRepositoryPath(owner, repoName)

    try {
      // Build log command
      let command = `cd "${repoPath}" && git log --format="%H|%P|%an|%ae|%aI|%cn|%ce|%cI|%s" --name-status`

      if (options.branch) {
        command += ` ${options.branch}`
      }

      if (options.path) {
        command += ` -- "${options.path}"`
      }

      if (options.author) {
        command += ` --author="${options.author}"`
      }

      if (options.since) {
        command += ` --since="${options.since}"`
      }

      if (options.until) {
        command += ` --until="${options.until}"`
      }

      if (options.grep) {
        command += ` --grep="${options.grep}"`
      }

      if (options.limit) {
        command += ` -n ${options.limit}`
      }

      if (options.skip) {
        command += ` --skip=${options.skip}`
      }

      // Execute log
      const { stdout } = await exec(command)

      // Parse log output
      return this.parseCommitHistory(stdout)
    } catch (error) {
      console.error("Commit history failed:", error)
      return []
    }
  }

  /**
   * Parse git log output
   */
  private parseCommitHistory(output: string): Array<{
    hash: string
    shortHash: string
    parentHashes: string[]
    author: string
    authorEmail: string
    authorDate: string
    committer: string
    committerEmail: string
    committerDate: string
    message: string
    files: Array<{
      path: string
      status: string
      additions: number
      deletions: number
    }>
  }> {
    const commits: Array<{
      hash: string
      shortHash: string
      parentHashes: string[]
      author: string
      authorEmail: string
      authorDate: string
      committer: string
      committerEmail: string
      committerDate: string
      message: string
      files: Array<{
        path: string
        status: string
        additions: number
        deletions: number
      }>
    }> = []

    // Split output by commit
    const commitChunks = output.split("\n\n")

    for (let i = 0; i < commitChunks.length; i += 2) {
      const commitInfo = commitChunks[i]
      const fileInfo = commitChunks[i + 1]

      if (!commitInfo) continue

      const [
        hash,
        parentHashesStr,
        author,
        authorEmail,
        authorDate,
        committer,
        committerEmail,
        committerDate,
        message,
      ] = commitInfo.split("|")

      const parentHashes = parentHashesStr ? parentHashesStr.split(" ") : []

      const files: Array<{
        path: string
        status: string
        additions: number
        deletions: number
      }> = []

      if (fileInfo) {
        const fileLines = fileInfo.split("\n").filter(Boolean)

        for (const line of fileLines) {
          const [status, ...pathParts] = line.split("\t")
          const path = pathParts.join("\t") // Handle paths with tabs

          files.push({
            path,
            status,
            additions: 0, // We don't have this info from --name-status
            deletions: 0, // We don't have this info from --name-status
          })
        }
      }

      commits.push({
        hash,
        shortHash: hash.substring(0, 7),
        parentHashes,
        author,
        authorEmail,
        authorDate,
        committer,
        committerEmail,
        committerDate,
        message,
        files,
      })
    }

    return commits
  }
}

// Export singleton instance
export const advancedGitOperations = new AdvancedGitOperations()
