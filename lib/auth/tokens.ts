import { supabase } from "../supabase"
import { createHash, randomBytes } from "crypto"
import type { ApiToken } from "./types"

export class TokenService {
  /**
   * Generate API token
   */
  static async generateToken(
    userId: string,
    name: string,
    scopes: string[] = ["repo:read"],
    expiresInDays?: number,
  ): Promise<{ token: string; tokenData: ApiToken }> {
    // Generate random token
    const tokenBytes = randomBytes(32)
    const token = `stargit_${tokenBytes.toString("hex")}`

    // Create hash for storage
    const tokenHash = createHash("sha256").update(token).digest("hex")
    const tokenPrefix = token.substring(0, 12)

    // Calculate expiration
    const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000).toISOString() : null

    const { data, error } = await supabase
      .from("api_tokens")
      .insert({
        user_id: userId,
        name,
        token_hash: tokenHash,
        token_prefix: tokenPrefix,
        scopes,
        expires_at: expiresAt,
      })
      .select()
      .single()

    if (error) throw error

    return { token, tokenData: data }
  }

  /**
   * Validate API token
   */
  static async validateToken(token: string): Promise<ApiToken | null> {
    if (!token.startsWith("stargit_")) return null

    const tokenHash = createHash("sha256").update(token).digest("hex")

    const { data, error } = await supabase.from("api_tokens").select("*").eq("token_hash", tokenHash).single()

    if (error || !data) return null

    // Check if token is expired
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      return null
    }

    // Update last used timestamp
    await supabase.from("api_tokens").update({ last_used_at: new Date().toISOString() }).eq("id", data.id)

    return data
  }

  /**
   * List user's API tokens
   */
  static async listUserTokens(userId: string): Promise<ApiToken[]> {
    const { data, error } = await supabase
      .from("api_tokens")
      .select("id, name, token_prefix, scopes, last_used_at, expires_at, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Revoke API token
   */
  static async revokeToken(userId: string, tokenId: string): Promise<void> {
    const { error } = await supabase.from("api_tokens").delete().eq("id", tokenId).eq("user_id", userId)

    if (error) throw error
  }

  /**
   * Check if token has required scope
   */
  static hasScope(token: ApiToken, requiredScope: string): boolean {
    return token.scopes.includes(requiredScope) || token.scopes.includes("*")
  }

  /**
   * Get available scopes
   */
  static getAvailableScopes(): Record<string, string> {
    return {
      "*": "Full access to all resources",
      "repo:read": "Read access to repositories",
      "repo:write": "Write access to repositories",
      "repo:admin": "Administrative access to repositories",
      "user:read": "Read access to user profile",
      "user:write": "Write access to user profile",
      "org:read": "Read access to organizations",
      "org:write": "Write access to organizations",
      "org:admin": "Administrative access to organizations",
    }
  }
}
