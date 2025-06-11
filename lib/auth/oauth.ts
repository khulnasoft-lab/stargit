import { supabase } from "../supabase"
import { AuthAPI } from "../api/auth"
import type { OAuthProvider, OAuthConnection } from "./types"

export class OAuthService {
  /**
   * Get enabled OAuth providers
   */
  static async getEnabledProviders(): Promise<OAuthProvider[]> {
    const { data, error } = await supabase
      .from("oauth_providers")
      .select("id, name, client_id, authorization_url, scope, enabled")
      .eq("enabled", true)

    if (error) {
      console.error("Error fetching OAuth providers:", error)
      return []
    }
    return data || []
  }

  /**
   * Get OAuth provider by name
   */
  static async getProvider(name: string): Promise<OAuthProvider | null> {
    const { data, error } = await supabase
      .from("oauth_providers")
      .select("*")
      .eq("name", name)
      .eq("enabled", true)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Generate OAuth authorization URL
   */
  static generateAuthUrl(provider: OAuthProvider, redirectUri: string, state: string): string {
    const params = new URLSearchParams({
      client_id: provider.client_id,
      redirect_uri: redirectUri,
      scope: provider.scope,
      state,
      response_type: "code",
    })

    return `${provider.authorization_url}?${params.toString()}`
  }

  /**
   * Exchange OAuth code for tokens
   */
  static async exchangeCodeForTokens(
    provider: OAuthProvider,
    code: string,
    redirectUri: string,
  ): Promise<{
    access_token: string
    refresh_token?: string
    expires_in?: number
  }> {
    if (!provider.token_url) {
      throw new Error("Token URL not configured for provider")
    }

    const response = await fetch(provider.token_url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams({
        client_id: provider.client_id,
        client_secret: provider.client_secret || "",
        code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    })

    if (!response.ok) {
      throw new Error(`OAuth token exchange failed: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Get user info from OAuth provider
   */
  static async getUserInfo(provider: OAuthProvider, accessToken: string): Promise<any> {
    if (!provider.user_info_url) {
      throw new Error("User info URL not configured for provider")
    }

    const response = await fetch(provider.user_info_url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch user info: ${response.statusText}`)
    }

    return response.json()
  }

  /**
   * Handle OAuth callback and create/login user
   */
  static async handleCallback(
    providerName: string,
    code: string,
    redirectUri: string,
  ): Promise<{ user: any; isNewUser: boolean }> {
    const provider = await this.getProvider(providerName)
    if (!provider) throw new Error("OAuth provider not found")

    // Exchange code for tokens
    const tokens = await this.exchangeCodeForTokens(provider, code, redirectUri)

    // Get user info from provider
    const providerUserInfo = await this.getUserInfo(provider, tokens.access_token)

    // Check if user already has OAuth connection
    const { data: existingConnection } = await supabase
      .from("oauth_connections")
      .select(`
        user_id,
        users (*)
      `)
      .eq("provider_id", provider.id)
      .eq("provider_user_id", providerUserInfo.id.toString())
      .single()

    let user
    let isNewUser = false

    if (existingConnection) {
      // Update existing connection
      await this.updateConnection(existingConnection.user_id, provider.id, tokens, providerUserInfo)
      user = existingConnection.users
    } else {
      // Create new user and connection
      const userData = this.mapProviderUserInfo(providerName, providerUserInfo)

      // Check if user exists by email
      const existingUser = userData.email ? await AuthAPI.getUserByEmail(userData.email) : null

      if (existingUser) {
        // Link OAuth to existing user
        await this.createConnection(existingUser.id, provider.id, tokens, providerUserInfo)
        user = existingUser
      } else {
        // Create new user
        const { user: newUser } = await AuthAPI.signUp(
          userData.email || `${userData.username}@oauth.local`,
          this.generateRandomPassword(),
          userData,
        )
        await this.createConnection(newUser.id, provider.id, tokens, providerUserInfo)
        user = newUser
        isNewUser = true
      }
    }

    return { user, isNewUser }
  }

  /**
   * Create OAuth connection
   */
  private static async createConnection(
    userId: string,
    providerId: string,
    tokens: any,
    providerUserInfo: any,
  ): Promise<OAuthConnection> {
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null

    const { data, error } = await supabase
      .from("oauth_connections")
      .insert({
        user_id: userId,
        provider_id: providerId,
        provider_user_id: providerUserInfo.id.toString(),
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        provider_data: providerUserInfo,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update OAuth connection
   */
  private static async updateConnection(
    userId: string,
    providerId: string,
    tokens: any,
    providerUserInfo: any,
  ): Promise<void> {
    const expiresAt = tokens.expires_in ? new Date(Date.now() + tokens.expires_in * 1000).toISOString() : null

    const { error } = await supabase
      .from("oauth_connections")
      .update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        token_expires_at: expiresAt,
        provider_data: providerUserInfo,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("provider_id", providerId)

    if (error) throw error
  }

  /**
   * Map provider user info to our user format
   */
  private static mapProviderUserInfo(providerName: string, providerUserInfo: any) {
    switch (providerName) {
      case "github":
        return {
          username: providerUserInfo.login,
          email: providerUserInfo.email,
          full_name: providerUserInfo.name,
          avatar_url: providerUserInfo.avatar_url,
          bio: providerUserInfo.bio,
          location: providerUserInfo.location,
          website: providerUserInfo.blog,
          company: providerUserInfo.company,
        }
      case "gitlab":
        return {
          username: providerUserInfo.username,
          email: providerUserInfo.email,
          full_name: providerUserInfo.name,
          avatar_url: providerUserInfo.avatar_url,
          bio: providerUserInfo.bio,
          location: providerUserInfo.location,
          website: providerUserInfo.web_url,
        }
      case "google":
        return {
          username: providerUserInfo.email?.split("@")[0] || `user_${Date.now()}`,
          email: providerUserInfo.email,
          full_name: providerUserInfo.name,
          avatar_url: providerUserInfo.picture,
        }
      default:
        throw new Error(`Unsupported OAuth provider: ${providerName}`)
    }
  }

  /**
   * Generate random password for OAuth users
   */
  private static generateRandomPassword(): string {
    return Math.random().toString(36).slice(-12) + Math.random().toString(36).slice(-12)
  }

  /**
   * Disconnect OAuth provider
   */
  static async disconnectProvider(userId: string, providerId: string): Promise<void> {
    const { error } = await supabase
      .from("oauth_connections")
      .delete()
      .eq("user_id", userId)
      .eq("provider_id", providerId)

    if (error) throw error
  }

  /**
   * Get user's OAuth connections
   */
  static async getUserConnections(userId: string): Promise<OAuthConnection[]> {
    const { data, error } = await supabase
      .from("oauth_connections")
      .select(`
        *,
        oauth_providers (name, enabled)
      `)
      .eq("user_id", userId)

    if (error) throw error
    return data || []
  }
}
