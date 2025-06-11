import { supabase } from "../supabase"
import type { RepositoryPermissions, PermissionTemplate } from "./types"

export class PermissionService {
  /**
   * Check if user has permission on repository
   */
  static async hasRepositoryPermission(
    userId: string,
    repositoryId: string,
    permission: string,
    resource = "repo",
  ): Promise<boolean> {
    // Get repository info
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select("owner_id, organization_id, visibility")
      .eq("id", repositoryId)
      .single()

    if (repoError || !repo) return false

    // Public repositories allow read access to everyone
    if (repo.visibility === "public" && permission === "read" && resource === "repo") {
      return true
    }

    // Check if user is repository owner
    if (repo.owner_id === userId) return true

    // Check organization membership
    if (repo.organization_id) {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("role, permissions")
        .eq("organization_id", repo.organization_id)
        .eq("user_id", userId)
        .single()

      if (orgMember) {
        // Organization owners and admins have full access
        if (orgMember.role === "owner" || orgMember.role === "admin") return true

        // Check custom permissions
        if (orgMember.permissions && this.checkPermission(orgMember.permissions, resource, permission)) {
          return true
        }
      }
    }

    // Check direct repository collaboration
    const { data: collaborator } = await supabase
      .from("repository_collaborators")
      .select("permission, permissions")
      .eq("repository_id", repositoryId)
      .eq("user_id", userId)
      .single()

    if (collaborator) {
      // Check legacy permission field
      if (this.checkLegacyPermission(collaborator.permission, permission)) return true

      // Check custom permissions
      if (collaborator.permissions && this.checkPermission(collaborator.permissions, resource, permission)) {
        return true
      }
    }

    return false
  }

  /**
   * Check permission in permissions object
   */
  private static checkPermission(permissions: any, resource: string, permission: string): boolean {
    if (!permissions || typeof permissions !== "object") return false

    const resourcePermissions = permissions[resource]
    if (!Array.isArray(resourcePermissions)) return false

    return resourcePermissions.includes(permission) || resourcePermissions.includes("*")
  }

  /**
   * Check legacy permission field
   */
  private static checkLegacyPermission(collaboratorPermission: string, requiredPermission: string): boolean {
    const permissionHierarchy = {
      read: ["read"],
      write: ["read", "write"],
      admin: ["read", "write", "admin", "delete"],
    }

    const allowedPermissions = permissionHierarchy[collaboratorPermission as keyof typeof permissionHierarchy] || []
    return allowedPermissions.includes(requiredPermission)
  }

  /**
   * Get user's effective permissions for repository
   */
  static async getRepositoryPermissions(userId: string, repositoryId: string): Promise<RepositoryPermissions> {
    const defaultPermissions: RepositoryPermissions = {
      repo: [],
      issues: [],
      wiki: [],
      pull_requests: [],
      settings: [],
      collaborators: [],
    }

    // Get repository info
    const { data: repo, error: repoError } = await supabase
      .from("repositories")
      .select("owner_id, organization_id, visibility")
      .eq("id", repositoryId)
      .single()

    if (repoError || !repo) return defaultPermissions

    // Public repositories allow read access
    if (repo.visibility === "public") {
      defaultPermissions.repo.push("read")
      defaultPermissions.issues.push("read")
      defaultPermissions.wiki.push("read")
    }

    // Repository owner has full permissions
    if (repo.owner_id === userId) {
      return {
        repo: ["read", "write", "delete"],
        issues: ["read", "write", "create", "delete"],
        wiki: ["read", "write", "delete"],
        pull_requests: ["read", "write", "create", "merge", "delete"],
        settings: ["read", "write", "delete"],
        collaborators: ["read", "write", "delete"],
      }
    }

    // Check organization permissions
    if (repo.organization_id) {
      const { data: orgMember } = await supabase
        .from("organization_members")
        .select("role, permissions")
        .eq("organization_id", repo.organization_id)
        .eq("user_id", userId)
        .single()

      if (orgMember) {
        if (orgMember.role === "owner" || orgMember.role === "admin") {
          return {
            repo: ["read", "write", "delete"],
            issues: ["read", "write", "create", "delete"],
            wiki: ["read", "write", "delete"],
            pull_requests: ["read", "write", "create", "merge", "delete"],
            settings: ["read", "write", "delete"],
            collaborators: ["read", "write", "delete"],
          }
        }

        if (orgMember.permissions) {
          return this.mergePermissions(defaultPermissions, orgMember.permissions)
        }
      }
    }

    // Check direct collaboration permissions
    const { data: collaborator } = await supabase
      .from("repository_collaborators")
      .select("permission, permissions")
      .eq("repository_id", repositoryId)
      .eq("user_id", userId)
      .single()

    if (collaborator) {
      if (collaborator.permissions) {
        return this.mergePermissions(defaultPermissions, collaborator.permissions)
      }

      // Handle legacy permissions
      const legacyPermissions = this.convertLegacyPermissions(collaborator.permission)
      return this.mergePermissions(defaultPermissions, legacyPermissions)
    }

    return defaultPermissions
  }

  /**
   * Merge permissions objects
   */
  private static mergePermissions(base: RepositoryPermissions, additional: any): RepositoryPermissions {
    const result = { ...base }

    for (const [resource, permissions] of Object.entries(additional)) {
      if (Array.isArray(permissions) && resource in result) {
        const resourceKey = resource as keyof RepositoryPermissions
        result[resourceKey] = [...new Set([...result[resourceKey], ...permissions])]
      }
    }

    return result
  }

  /**
   * Convert legacy permission to new format
   */
  private static convertLegacyPermissions(permission: string): RepositoryPermissions {
    switch (permission) {
      case "read":
        return {
          repo: ["read"],
          issues: ["read"],
          wiki: ["read"],
          pull_requests: ["read"],
          settings: [],
          collaborators: [],
        }
      case "write":
        return {
          repo: ["read", "write"],
          issues: ["read", "write", "create"],
          wiki: ["read", "write"],
          pull_requests: ["read", "write", "create"],
          settings: [],
          collaborators: [],
        }
      case "admin":
        return {
          repo: ["read", "write"],
          issues: ["read", "write", "create", "delete"],
          wiki: ["read", "write", "delete"],
          pull_requests: ["read", "write", "create", "merge"],
          settings: ["read", "write"],
          collaborators: ["read", "write"],
        }
      default:
        return {
          repo: [],
          issues: [],
          wiki: [],
          pull_requests: [],
          settings: [],
          collaborators: [],
        }
    }
  }

  /**
   * Get permission templates
   */
  static async getPermissionTemplates(): Promise<PermissionTemplate[]> {
    const { data, error } = await supabase.from("permission_templates").select("*").order("name")

    if (error) throw error
    return data
  }

  /**
   * Apply permission template to user
   */
  static async applyPermissionTemplate(repositoryId: string, userId: string, templateId: string): Promise<void> {
    // Get template
    const { data: template, error: templateError } = await supabase
      .from("permission_templates")
      .select("permissions")
      .eq("id", templateId)
      .single()

    if (templateError || !template) throw new Error("Permission template not found")

    // Update or create collaborator record
    const { error } = await supabase.from("repository_collaborators").upsert({
      repository_id: repositoryId,
      user_id: userId,
      permissions: template.permissions,
      permission: "write", // Legacy field
    })

    if (error) throw error
  }

  /**
   * Check API token scope
   */
  static checkTokenScope(tokenScopes: string[], requiredScope: string): boolean {
    return tokenScopes.includes("*") || tokenScopes.includes(requiredScope)
  }
}
