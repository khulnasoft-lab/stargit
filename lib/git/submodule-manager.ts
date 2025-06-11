import { promises as fs } from "fs"
import { join } from "path"
import { promisify } from "util"

const exec = promisify(require("child_process").exec)

/**
 * Git Submodule Manager
 *
 * Handles Git submodule operations including:
 * - Adding, updating, and removing submodules
 * - Submodule status tracking
 * - Recursive submodule operations
 */
export class GitSubmoduleManager {
  /**
   * List submodules in a repository
   */
  async listSubmodules(repoPath: string): Promise<
    Array<{
      name: string
      path: string
      url: string
      branch?: string
      commit: string
      status: "upToDate" | "modified" | "needsUpdate" | "uninitialized"
    }>
  > {
    try {
      // Get submodule status
      const { stdout: statusOutput } = await exec(`cd "${repoPath}" && git submodule status --recursive`)

      // Get submodule config
      const { stdout: configOutput } = await exec(
        `cd "${repoPath}" && git config --file .gitmodules --get-regexp "submodule\\..*\\.(path|url|branch)"`,
      )

      // Parse config
      const configMap: Record<string, { path: string; url: string; branch?: string }> = {}
      const configLines = configOutput.split("\n").filter(Boolean)

      for (const line of configLines) {
        const match = line.match(/submodule\.(.*?)\.(\w+) (.*)/)
        if (match) {
          const [, name, key, value] = match

          if (!configMap[name]) {
            configMap[name] = { path: "", url: "" }
          }

          configMap[name][key as "path" | "url" | "branch"] = value
        }
      }

      // Parse status
      const submodules: Array<{
        name: string
        path: string
        url: string
        branch?: string
        commit: string
        status: "upToDate" | "modified" | "needsUpdate" | "uninitialized"
      }> = []

      const statusLines = statusOutput.split("\n").filter(Boolean)

      for (const line of statusLines) {
        // Format: [<status char>]<commit hash> <path> [(behind/ahead info)]
        const match = line.match(/^([ +-U])([a-f0-9]+) (.+?)( $$.+$$)?$/)

        if (match) {
          const [, statusChar, commit, path, behindAhead] = match

          // Find the submodule name from path
          const name = Object.keys(configMap).find((key) => configMap[key].path === path) || path

          if (!name) continue

          let status: "upToDate" | "modified" | "needsUpdate" | "uninitialized" = "upToDate"

          switch (statusChar) {
            case "+":
              status = "needsUpdate"
              break
            case "-":
              status = "uninitialized"
              break
            case " ":
              status = "upToDate"
              break
            case "U":
              status = "modified"
              break
          }

          submodules.push({
            name,
            path,
            url: configMap[name]?.url || "",
            branch: configMap[name]?.branch,
            commit,
            status,
          })
        }
      }

      return submodules
    } catch (error) {
      console.error("Failed to list submodules:", error)
      return []
    }
  }

  /**
   * Add a submodule to a repository
   */
  async addSubmodule(repoPath: string, url: string, path: string, branch?: string): Promise<void> {
    try {
      let command = `cd "${repoPath}" && git submodule add`

      if (branch) {
        command += ` -b ${branch}`
      }

      command += ` "${url}" "${path}"`

      await exec(command)

      // Commit the changes
      await exec(`cd "${repoPath}" && git add .gitmodules "${path}" && git commit -m "Add submodule ${path}"`)

      console.log(`Submodule added: ${path} from ${url}`)
    } catch (error) {
      console.error("Failed to add submodule:", error)
      throw new Error(`Failed to add submodule: ${(error as Error).message}`)
    }
  }

  /**
   * Update submodules in a repository
   */
  async updateSubmodules(repoPath: string, recursive = true): Promise<void> {
    try {
      const command = `cd "${repoPath}" && git submodule update --init${recursive ? " --recursive" : ""}`
      await exec(command)

      console.log(`Submodules updated${recursive ? " recursively" : ""}`)
    } catch (error) {
      console.error("Failed to update submodules:", error)
      throw new Error(`Failed to update submodules: ${(error as Error).message}`)
    }
  }

  /**
   * Remove a submodule from a repository
   */
  async removeSubmodule(repoPath: string, path: string): Promise<void> {
    try {
      // 1. Deinit the submodule
      await exec(`cd "${repoPath}" && git submodule deinit -f "${path}"`)

      // 2. Remove from .git/modules
      await exec(`cd "${repoPath}" && rm -rf .git/modules/${path}`)

      // 3. Remove from working tree
      await exec(`cd "${repoPath}" && git rm -f "${path}"`)

      // 4. Commit the changes
      await exec(`cd "${repoPath}" && git commit -m "Remove submodule ${path}"`)

      console.log(`Submodule removed: ${path}`)
    } catch (error) {
      console.error("Failed to remove submodule:", error)
      throw new Error(`Failed to remove submodule: ${(error as Error).message}`)
    }
  }

  /**
   * Update a submodule to a specific commit
   */
  async updateSubmoduleCommit(repoPath: string, submodulePath: string, commit: string): Promise<void> {
    try {
      // 1. Change to the submodule directory
      await exec(`cd "${repoPath}/${submodulePath}" && git checkout ${commit}`)

      // 2. Go back to the main repository and stage the change
      await exec(`cd "${repoPath}" && git add "${submodulePath}"`)

      // 3. Commit the change
      await exec(`cd "${repoPath}" && git commit -m "Update submodule ${submodulePath} to ${commit.substring(0, 7)}"`)

      console.log(`Submodule ${submodulePath} updated to commit ${commit.substring(0, 7)}`)
    } catch (error) {
      console.error("Failed to update submodule commit:", error)
      throw new Error(`Failed to update submodule commit: ${(error as Error).message}`)
    }
  }

  /**
   * Get detailed information about a specific submodule
   */
  async getSubmoduleInfo(
    repoPath: string,
    submodulePath: string,
  ): Promise<{
    name: string
    path: string
    url: string
    branch?: string
    commit: string
    lastCommitMessage: string
    lastCommitAuthor: string
    lastCommitDate: string
  } | null> {
    try {
      // Get submodule name
      const { stdout: nameOutput } = await exec(
        `cd "${repoPath}" && git config --file .gitmodules --get-regexp "submodule\\..*\\.path" | grep "${submodulePath}$"`,
      )

      const nameMatch = nameOutput.match(/submodule\.(.*?)\.path/)
      if (!nameMatch) return null

      const name = nameMatch[1]

      // Get submodule URL
      const { stdout: urlOutput } = await exec(
        `cd "${repoPath}" && git config --file .gitmodules --get submodule.${name}.url`,
      )

      const url = urlOutput.trim()

      // Get branch if available
      let branch: string | undefined
      try {
        const { stdout: branchOutput } = await exec(
          `cd "${repoPath}" && git config --file .gitmodules --get submodule.${name}.branch`,
        )
        branch = branchOutput.trim() || undefined
      } catch {
        // Branch might not be configured
      }

      // Get current commit
      const { stdout: commitOutput } = await exec(
        `cd "${repoPath}" && git submodule status "${submodulePath}" | cut -c2-41`,
      )

      const commit = commitOutput.trim()

      // Get last commit info
      const { stdout: commitInfoOutput } = await exec(
        `cd "${repoPath}/${submodulePath}" && git log -1 --format="%H|%s|%an|%aI"`,
      )

      const [, lastCommitMessage, lastCommitAuthor, lastCommitDate] = commitInfoOutput.split("|")

      return {
        name,
        path: submodulePath,
        url,
        branch,
        commit,
        lastCommitMessage,
        lastCommitAuthor,
        lastCommitDate,
      }
    } catch (error) {
      console.error("Failed to get submodule info:", error)
      return null
    }
  }

  /**
   * Sync submodules (update URLs from .gitmodules)
   */
  async syncSubmodules(repoPath: string): Promise<void> {
    try {
      await exec(`cd "${repoPath}" && git submodule sync --recursive`)
      console.log("Submodules synchronized")
    } catch (error) {
      console.error("Failed to sync submodules:", error)
      throw new Error(`Failed to sync submodules: ${(error as Error).message}`)
    }
  }

  /**
   * Check if a repository has submodules
   */
  async hasSubmodules(repoPath: string): Promise<boolean> {
    try {
      await fs.access(join(repoPath, ".gitmodules"))
      return true
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const submoduleManager = new GitSubmoduleManager()
