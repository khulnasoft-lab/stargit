import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/lib/database.types"

/**
 * Multi-tenant isolation manager
 *
 * Provides organization-level isolation for:
 * - Database queries with RLS policies
 * - Repository storage namespacing
 * - API access control
 * - Resource quotas and limits
 */
export class TenantManager {
  private supabase: ReturnType<typeof createClient<Database>>

  constructor() {
    this.supabase = createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  /**
   * Get tenant context from request
   */
  async getTenantContext(request: Request): Promise<{
    organizationId: string
    userId: string
    permissions: string[]
  } | null> {
    const authHeader = request.headers.get("authorization")
    if (!authHeader) return null

    try {
      // Extract JWT token
      const token = authHeader.replace("Bearer ", "")
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser(token)

      if (error || !user) return null

      // Get organization context from subdomain or header
      const organizationSlug = this.extractOrganizationSlug(request)
      if (!organizationSlug) return null

      // Get organization and user permissions
      const { data: orgMember } = await this.supabase
        .from("organization_members")
        .select(`
          organization_id,
          role,
          permissions,
          organizations!inner(slug)
        `)
        .eq("user_id", user.id)
        .eq("organizations.slug", organizationSlug)
        .single()

      if (!orgMember) return null

      return {
        organizationId: orgMember.organization_id,
        userId: user.id,
        permissions: orgMember.permissions || [],
      }
    } catch (error) {
      console.error("Failed to get tenant context:", error)
      return null
    }
  }

  /**
   * Extract organization slug from request
   */
  private extractOrganizationSlug(request: Request): string | null {
    const url = new URL(request.url)

    // Check subdomain (e.g., acme.stargit.com)
    const subdomain = url.hostname.split(".")[0]
    if (subdomain && subdomain !== "www" && subdomain !== "api") {
      return subdomain
    }

    // Check X-Organization header
    const orgHeader = request.headers.get("x-organization")
    if (orgHeader) {
      return orgHeader
    }

    // Check path prefix (e.g., /org/acme/...)
    const pathMatch = url.pathname.match(/^\/org\/([^/]+)/)
    if (pathMatch) {
      return pathMatch[1]
    }

    return null
  }

  /**
   * Create tenant-scoped Supabase client
   */
  createTenantClient(organizationId: string, userId: string) {
    return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!, {
      global: {
        headers: {
          "x-organization-id": organizationId,
          "x-user-id": userId,
        },
      },
    })
  }

  /**
   * Get repository path with tenant isolation
   */
  getTenantRepositoryPath(organizationSlug: string, repositoryName: string): string {
    // Use organization slug as namespace
    return `${organizationSlug}/${repositoryName}`
  }

  /**
   * Check tenant resource limits
   */
  async checkResourceLimits(
    organizationId: string,
    resource: string,
  ): Promise<{
    allowed: boolean
    current: number
    limit: number
  }> {
    // Get organization plan and limits
    const { data: org } = await this.supabase
      .from("organizations")
      .select("plan, settings")
      .eq("id", organizationId)
      .single()

    if (!org) {
      return { allowed: false, current: 0, limit: 0 }
    }

    const limits = this.getPlanLimits(org.plan)
    const currentUsage = await this.getCurrentUsage(organizationId, resource)

    return {
      allowed: currentUsage < limits[resource],
      current: currentUsage,
      limit: limits[resource],
    }
  }

  /**
   * Get plan limits
   */
  private getPlanLimits(plan: string): Record<string, number> {
    const limits = {
      free: {
        repositories: 10,
        collaborators: 3,
        storage_gb: 1,
        bandwidth_gb: 1,
        webhooks: 5,
      },
      pro: {
        repositories: 100,
        collaborators: 25,
        storage_gb: 10,
        bandwidth_gb: 10,
        webhooks: 50,
      },
      enterprise: {
        repositories: 1000,
        collaborators: 500,
        storage_gb: 100,
        bandwidth_gb: 100,
        webhooks: 500,
      },
    }

    return limits[plan as keyof typeof limits] || limits.free
  }

  /**
   * Get current resource usage
   */
  private async getCurrentUsage(organizationId: string, resource: string): Promise<number> {
    switch (resource) {
      case "repositories":
        const { count: repoCount } = await this.supabase
          .from("repositories")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
        return repoCount || 0

      case "collaborators":
        const { count: collabCount } = await this.supabase
          .from("organization_members")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
        return collabCount || 0

      case "webhooks":
        const { count: webhookCount } = await this.supabase
          .from("webhooks")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", organizationId)
        return webhookCount || 0

      default:
        return 0
    }
  }

  /**
   * Enforce tenant isolation in database queries
   */
  async enforceTenantIsolation(query: any, organizationId: string, tableName: string) {
    // Add organization filter to all queries
    if (this.isMultiTenantTable(tableName)) {
      return query.eq("organization_id", organizationId)
    }
    return query
  }

  /**
   * Check if table requires tenant isolation
   */
  private isMultiTenantTable(tableName: string): boolean {
    const multiTenantTables = [
      "repositories",
      "webhooks",
      "events",
      "collaborators",
      "ssh_keys",
      "api_tokens",
      "organization_members",
    ]
    return multiTenantTables.includes(tableName)
  }

  /**
   * Create organization namespace
   */
  async createOrganizationNamespace(organizationSlug: string): Promise<void> {
    // Create organization-specific database schema if needed
    // This is optional for advanced isolation

    // Create organization directory structure
    const fs = require("fs").promises
    const path = require("path")

    const orgPath = path.join(process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories", organizationSlug)

    try {
      await fs.mkdir(orgPath, { recursive: true })
      await fs.chmod(orgPath, 0o755)
    } catch (error) {
      console.error("Failed to create organization namespace:", error)
      throw error
    }
  }

  /**
   * Delete organization namespace
   */
  async deleteOrganizationNamespace(organizationSlug: string): Promise<void> {
    const fs = require("fs").promises
    const path = require("path")

    const orgPath = path.join(process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories", organizationSlug)

    try {
      await fs.rmdir(orgPath, { recursive: true })
    } catch (error) {
      console.error("Failed to delete organization namespace:", error)
      throw error
    }
  }
}
