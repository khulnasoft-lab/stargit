import { type NextRequest, NextResponse } from "next/server"
import { TenantManager } from "./tenant-manager"

/**
 * Multi-tenant middleware for request routing and isolation
 */
export class TenantMiddleware {
  private tenantManager: TenantManager

  constructor() {
    this.tenantManager = new TenantManager()
  }

  /**
   * Handle multi-tenant routing
   */
  async handleRequest(request: NextRequest): Promise<NextResponse> {
    const url = request.nextUrl.clone()

    // Extract tenant context
    const tenantContext = await this.tenantManager.getTenantContext(request)

    if (!tenantContext && this.requiresAuthentication(url.pathname)) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Add tenant context to headers
    const response = NextResponse.next()
    if (tenantContext) {
      response.headers.set("x-organization-id", tenantContext.organizationId)
      response.headers.set("x-user-id", tenantContext.userId)
      response.headers.set("x-permissions", JSON.stringify(tenantContext.permissions))
    }

    // Handle subdomain routing
    if (this.isSubdomainRequest(request)) {
      return this.handleSubdomainRouting(request, tenantContext)
    }

    return response
  }

  /**
   * Check if request is from subdomain
   */
  private isSubdomainRequest(request: NextRequest): boolean {
    const hostname = request.nextUrl.hostname
    const parts = hostname.split(".")

    // Check if it's a subdomain (not www or api)
    return parts.length > 2 && !["www", "api"].includes(parts[0])
  }

  /**
   * Handle subdomain-based routing
   */
  private async handleSubdomainRouting(request: NextRequest, tenantContext: any): Promise<NextResponse> {
    const url = request.nextUrl.clone()
    const subdomain = url.hostname.split(".")[0]

    // Rewrite URL to include organization context
    url.pathname = `/org/${subdomain}${url.pathname}`

    return NextResponse.rewrite(url)
  }

  /**
   * Check if path requires authentication
   */
  private requiresAuthentication(pathname: string): boolean {
    const publicPaths = ["/api/health", "/api/auth", "/login", "/register", "/public"]

    return !publicPaths.some((path) => pathname.startsWith(path))
  }

  /**
   * Check resource access permissions
   */
  async checkResourceAccess(
    organizationId: string,
    userId: string,
    resource: string,
    action: string,
  ): Promise<boolean> {
    // Get user permissions in organization
    const tenantClient = this.tenantManager.createTenantClient(organizationId, userId)

    const { data: member } = await tenantClient
      .from("organization_members")
      .select("role, permissions")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single()

    if (!member) return false

    // Check role-based permissions
    const rolePermissions = this.getRolePermissions(member.role)
    const customPermissions = member.permissions || []

    const allPermissions = [...rolePermissions, ...customPermissions]

    return (
      allPermissions.includes(`${resource}:${action}`) ||
      allPermissions.includes(`${resource}:*`) ||
      allPermissions.includes("*:*")
    )
  }

  /**
   * Get permissions for role
   */
  private getRolePermissions(role: string): string[] {
    const rolePermissions = {
      owner: ["*:*"],
      admin: ["repositories:*", "webhooks:*", "members:*", "settings:*"],
      member: ["repositories:read", "repositories:write", "webhooks:read"],
      viewer: ["repositories:read"],
    }

    return rolePermissions[role as keyof typeof rolePermissions] || []
  }
}
