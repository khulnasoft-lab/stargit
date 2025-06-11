import { GitRepositoryManager, type GitRepositoryConfig } from "../git/repository-manager"
import { RepositoriesAPI } from "./repositories"
import { WebhooksAPI } from "./webhooks"
import { supabase } from "../supabase"
import type { Database } from "../database.types"

type Repository = Database["public"]["Tables"]["repositories"]["Row"]

export class GitOperationsAPI {
  private gitManager: GitRepositoryManager

  constructor() {
    this.gitManager = new GitRepositoryManager()
  }

  /**
   * Create repository with both database record and Git repository on disk
   */
  async createRepository(config: GitRepositoryConfig): Promise<Repository> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Determine owner information
    let ownerUsername: string
    let organizationName: string | undefined

    if (config.organization) {
      const { data: org } = await supabase.from("organizations").select("name").eq("id", config.organization).single()
      if (!org) throw new Error("Organization not found")
      organizationName = org.name
      ownerUsername = org.name
    } else {
      const { data: userProfile } = await supabase.from("users").select("username").eq("id", user.id).single()
      if (!userProfile) throw new Error("User profile not found")
      ownerUsername = userProfile.username
    }

    const fullName = `${ownerUsername}/${config.name}`

    try {
      // Create Git repository on disk first
      const repoPath = await this.gitManager.createRepository({
        ...config,
        owner: ownerUsername,
        organization: organizationName,
      })

      // Create database record
      const repository = await RepositoriesAPI.create({
        name: config.name,
        full_name: fullName,
        description: config.description,
        owner_id: config.organization ? null : user.id,
        organization_id: config.organization || null,
        visibility: config.visibility,
        default_branch: config.defaultBranch || "main",
        has_issues: config.hasIssues ?? true,
        has_wiki: config.hasWiki ?? true,
        has_projects: config.hasProjects ?? true,
        clone_url: `${process.env.NEXT_PUBLIC_GIT_BASE_URL}/${fullName}.git`,
        ssh_url: `git@${process.env.NEXT_PUBLIC_GIT_DOMAIN || "localhost"}:${fullName}.git`,
      })

      // Get repository info and update database
      const repoInfo = await this.gitManager.getRepositoryInfo(ownerUsername, config.name)
      await RepositoriesAPI.update(repository.id, {
        size_kb: Math.round(repoInfo.size / 1024),
        pushed_at: repoInfo.lastCommit?.date || new Date().toISOString(),
      })

      return repository
    } catch (error) {
      // Clean up Git repository if database creation fails
      try {
        await this.gitManager.deleteRepository(ownerUsername, config.name)
      } catch (cleanupError) {
        console.error("Failed to clean up Git repository:", cleanupError)
      }
      throw error
    }
  }

  /**
   * Rename repository (both database and disk)
   */
  async renameRepository(repositoryId: string, newName: string): Promise<Repository> {
    // Get current repository info
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", repositoryId)
      .single()

    if (error || !repo) throw new Error("Repository not found")

    const ownerName = repo.organizations?.name || repo.users?.username
    if (!ownerName) throw new Error("Repository owner not found")

    const oldName = repo.name
    const newFullName = `${ownerName}/${newName}`

    try {
      // Rename Git repository on disk
      await this.gitManager.renameRepository(ownerName, oldName, newName)

      // Update database record
      const updatedRepo = await RepositoriesAPI.update(repositoryId, {
        name: newName,
        full_name: newFullName,
        clone_url: `${process.env.NEXT_PUBLIC_GIT_BASE_URL}/${newFullName}.git`,
        ssh_url: `git@${process.env.NEXT_PUBLIC_GIT_DOMAIN || "localhost"}:${newFullName}.git`,
      })

      return updatedRepo
    } catch (error) {
      // If Git rename succeeded but database update failed, try to revert
      try {
        await this.gitManager.renameRepository(ownerName, newName, oldName)
      } catch (revertError) {
        console.error("Failed to revert Git repository rename:", revertError)
      }
      throw error
    }
  }

  /**
   * Delete repository (both database and disk)
   */
  async deleteRepository(repositoryId: string): Promise<void> {
    // Get repository info
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", repositoryId)
      .single()

    if (error || !repo) throw new Error("Repository not found")

    const ownerName = repo.organizations?.name || repo.users?.username
    if (!ownerName) throw new Error("Repository owner not found")

    // Delete from database first (this will cascade to related records)
    await RepositoriesAPI.delete(repositoryId)

    // Delete Git repository from disk
    try {
      await this.gitManager.deleteRepository(ownerName, repo.name)
    } catch (error) {
      console.error("Failed to delete Git repository from disk:", error)
      // Don't throw here as database deletion already succeeded
    }
  }

  /**
   * Fork repository (both database and disk)
   */
  async forkRepository(
    sourceRepositoryId: string,
    targetName?: string,
    targetOrganizationId?: string,
  ): Promise<Repository> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Get source repository info
    const { data: sourceRepo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", sourceRepositoryId)
      .single()

    if (error || !sourceRepo) throw new Error("Source repository not found")

    const sourceOwnerName = sourceRepo.organizations?.name || sourceRepo.users?.username
    if (!sourceOwnerName) throw new Error("Source repository owner not found")

    // Determine target owner
    let targetOwnerName: string
    let targetOwnerId: string | null = user.id
    let targetOrgId: string | null = null

    if (targetOrganizationId) {
      const { data: org } = await supabase.from("organizations").select("name").eq("id", targetOrganizationId).single()
      if (!org) throw new Error("Target organization not found")
      targetOwnerName = org.name
      targetOwnerId = null
      targetOrgId = targetOrganizationId
    } else {
      const { data: userProfile } = await supabase.from("users").select("username").eq("id", user.id).single()
      if (!userProfile) throw new Error("User profile not found")
      targetOwnerName = userProfile.username
    }

    const forkName = targetName || sourceRepo.name
    const forkFullName = `${targetOwnerName}/${forkName}`

    try {
      // Fork Git repository on disk
      await this.gitManager.forkRepository(sourceOwnerName, sourceRepo.name, targetOwnerName, forkName)

      // Create database record for fork
      const forkRepo = await RepositoriesAPI.create({
        name: forkName,
        full_name: forkFullName,
        description: sourceRepo.description,
        owner_id: targetOwnerId,
        organization_id: targetOrgId,
        visibility: sourceRepo.visibility,
        default_branch: sourceRepo.default_branch,
        is_fork: true,
        fork_parent_id: sourceRepositoryId,
        has_issues: sourceRepo.has_issues,
        has_wiki: sourceRepo.has_wiki,
        has_projects: sourceRepo.has_projects,
        clone_url: `${process.env.NEXT_PUBLIC_GIT_BASE_URL}/${forkFullName}.git`,
        ssh_url: `git@${process.env.NEXT_PUBLIC_GIT_DOMAIN || "localhost"}:${forkFullName}.git`,
      })

      // Update fork count on source repository
      await supabase
        .from("repositories")
        .update({ forks_count: sourceRepo.forks_count + 1 })
        .eq("id", sourceRepositoryId)

      // Get repository info and update database
      const repoInfo = await this.gitManager.getRepositoryInfo(targetOwnerName, forkName)
      await RepositoriesAPI.update(forkRepo.id, {
        size_kb: Math.round(repoInfo.size / 1024),
        pushed_at: repoInfo.lastCommit?.date || new Date().toISOString(),
      })

      return forkRepo
    } catch (error) {
      // Clean up Git repository if database creation fails
      try {
        await this.gitManager.deleteRepository(targetOwnerName, forkName)
      } catch (cleanupError) {
        console.error("Failed to clean up forked Git repository:", cleanupError)
      }
      throw error
    }
  }

  /**
   * Update repository metadata
   */
  async updateRepositoryMetadata(
    repositoryId: string,
    updates: {
      description?: string
      defaultBranch?: string
      visibility?: "public" | "private" | "internal"
      hasIssues?: boolean
      hasWiki?: boolean
      hasProjects?: boolean
    },
  ): Promise<Repository> {
    // Get repository info
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", repositoryId)
      .single()

    if (error || !repo) throw new Error("Repository not found")

    const ownerName = repo.organizations?.name || repo.users?.username
    if (!ownerName) throw new Error("Repository owner not found")

    // Update Git repository metadata
    if (updates.description !== undefined) {
      await this.gitManager.updateDescription(ownerName, repo.name, updates.description)
    }

    if (updates.defaultBranch !== undefined) {
      await this.gitManager.setDefaultBranch(ownerName, repo.name, updates.defaultBranch)
    }

    // Update database record
    const dbUpdates: any = {}
    if (updates.description !== undefined) dbUpdates.description = updates.description
    if (updates.defaultBranch !== undefined) dbUpdates.default_branch = updates.defaultBranch
    if (updates.visibility !== undefined) dbUpdates.visibility = updates.visibility
    if (updates.hasIssues !== undefined) dbUpdates.has_issues = updates.hasIssues
    if (updates.hasWiki !== undefined) dbUpdates.has_wiki = updates.hasWiki
    if (updates.hasProjects !== undefined) dbUpdates.has_projects = updates.hasProjects

    return await RepositoriesAPI.update(repositoryId, dbUpdates)
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStatistics(repositoryId: string) {
    // Get repository info
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", repositoryId)
      .single()

    if (error || !repo) throw new Error("Repository not found")

    const ownerName = repo.organizations?.name || repo.users?.username
    if (!ownerName) throw new Error("Repository owner not found")

    // Get Git repository info
    const gitInfo = await this.gitManager.getRepositoryInfo(ownerName, repo.name)

    // Update database with latest info
    await RepositoriesAPI.update(repositoryId, {
      size_kb: Math.round(gitInfo.size / 1024),
      pushed_at: gitInfo.lastCommit?.date || repo.pushed_at,
    })

    return {
      ...repo,
      git_info: gitInfo,
      size_kb: Math.round(gitInfo.size / 1024),
      branches_count: gitInfo.branches.length,
      tags_count: gitInfo.tags.length,
    }
  }

  /**
   * Archive repository
   */
  async archiveRepository(repositoryId: string, outputPath: string): Promise<void> {
    // Get repository info
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        *,
        users (username),
        organizations (name)
      `)
      .eq("id", repositoryId)
      .single()

    if (error || !repo) throw new Error("Repository not found")

    const ownerName = repo.organizations?.name || repo.users?.username
    if (!ownerName) throw new Error("Repository owner not found")

    // Create archive
    await this.gitManager.archiveRepository(ownerName, repo.name, outputPath)

    // Mark repository as archived in database
    await RepositoriesAPI.update(repositoryId, { archived: true })
  }

  /**
   * Trigger webhooks for repository events
   */
  async triggerRepositoryWebhooks(
    repositoryId: string,
    eventType: "push" | "pull_request" | "issue" | "release" | "deployment",
    payload: any,
  ): Promise<void> {
    await WebhooksAPI.triggerRepositoryWebhooks(repositoryId, eventType, payload)
  }
}
