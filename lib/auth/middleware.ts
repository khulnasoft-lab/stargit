import type { NextRequest } from "next/server"
import { supabase } from "../supabase"
import { TokenService } from "./tokens"
import { PermissionService } from "./permissions"
import type { AuthContext } from "./types"

export class AuthMiddleware {
  /**
   * Authenticate request and return auth context
   */
  static async authenticate(request: NextRequest): Promise<AuthContext | null> {
    // Try different authentication methods
    const tokenAuth = await this.authenticateWithToken(request)
    if (tokenAuth) return tokenAuth

    const basicAuth = await this.authenticateWithBasic(request)
    if (basicAuth) return basicAuth

    const sessionAuth = await this.authenticateWithSession(request)
    if (sessionAuth) return sessionAuth

    return null
  }

  /**
   * Authenticate with API token
   */
  private static async authenticateWithToken(request: NextRequest): Promise<AuthContext | null> {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Bearer ")) return null

    const token = authHeader.substring(7)
    const tokenData = await TokenService.validateToken(token)
    if (!tokenData) return null

    // Get user info
    const { data: user, error } = await supabase.from("users").select("*").eq("id", tokenData.user_id).single()

    if (error || !user) return null

    return {
      user,
      method: "token",
      permissions: {
        repo: tokenData.scopes,
        issues: tokenData.scopes,
        wiki: tokenData.scopes,
        pull_requests: tokenData.scopes,
        settings: tokenData.scopes,
        collaborators: tokenData.scopes,
      },
      token: tokenData,
    }
  }

  /**
   * Authenticate with Basic Auth
   */
  private static async authenticateWithBasic(request: NextRequest): Promise<AuthContext | null> {
    const authHeader = request.headers.get("authorization")
    if (!authHeader?.startsWith("Basic ")) return null

    try {
      const credentials = Buffer.from(authHeader.substring(6), "base64").toString()
      const [username, password] = credentials.split(":")

      // Try to sign in with email/password
      const { data, error } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      })

      if (error || !data.user) return null

      // Get user profile
      const { data: profile } = await supabase.from("users").select("*").eq("id", data.user.id).single()

      if (!profile) return null

      return {
        user: profile,
        method: "basic",
        permissions: {
          repo: ["read", "write"],
          issues: ["read", "write", "create"],
          wiki: ["read", "write"],
          pull_requests: ["read", "write", "create"],
          settings: ["read"],
          collaborators: ["read"],
        },
      }
    } catch (error) {
      return null
    }
  }

  /**
   * Authenticate with session cookie
   */
  private static async authenticateWithSession(request: NextRequest): Promise<AuthContext | null> {
    const sessionToken = request.cookies.get("session-token")?.value
    if (!sessionToken) return null

    const { data: session, error } = await supabase
      .from("user_sessions")
      .select(`
        *,
        users (*)
      `)
      .eq("session_token", sessionToken)
      .gt("expires_at", new Date().toISOString())
      .single()

    if (error || !session) return null

    return {
      user: session.users,
      method: "oauth",
      permissions: {
        repo: ["read", "write"],
        issues: ["read", "write", "create"],
        wiki: ["read", "write"],
        pull_requests: ["read", "write", "create"],
        settings: ["read"],
        collaborators: ["read"],
      },
    }
  }

  /**
   * Require authentication
   */
  static async requireAuth(request: NextRequest): Promise<AuthContext> {
    const auth = await this.authenticate(request)
    if (!auth) {
      throw new Error("Authentication required")
    }
    return auth
  }

  /**
   * Require specific permission on repository
   */
  static async requireRepositoryPermission(
    request: NextRequest,
    repositoryId: string,
    permission: string,
    resource = "repo",
  ): Promise<AuthContext> {
    const auth = await this.requireAuth(request)

    // Check token scope for API tokens
    if (auth.method === "token" && auth.token) {
      const requiredScope = `${resource}:${permission}`
      if (!TokenService.hasScope(auth.token, requiredScope)) {
        throw new Error(`Insufficient token scope. Required: ${requiredScope}`)
      }
    }

    // Check repository permission
    const hasPermission = await PermissionService.hasRepositoryPermission(
      auth.user.id,
      repositoryId,
      permission,
      resource,
    )

    if (!hasPermission) {
      throw new Error(`Insufficient permissions. Required: ${resource}:${permission}`)
    }

    return auth
  }

  /**
   * Log authentication event
   */
  static async logAuthEvent(
    userId: string | null,
    eventType: string,
    eventData: any = {},
    request: NextRequest,
    success = true,
  ): Promise<void> {
    const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown"
    const userAgent = request.headers.get("user-agent") || "unknown"

    await supabase.from("auth_audit_log").insert({
      user_id: userId,
      event_type: eventType,
      event_data: eventData,
      ip_address: ip,
      user_agent: userAgent,
      success,
    })
  }
}
