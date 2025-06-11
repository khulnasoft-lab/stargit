export interface OAuthProvider {
  id: string
  name: string
  client_id: string
  client_secret?: string
  authorization_url: string
  token_url: string
  user_info_url: string
  scope: string
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface OAuthConnection {
  id: string
  user_id: string
  provider_id: string
  provider_user_id: string
  access_token: string
  refresh_token?: string | null
  token_expires_at?: string | null
  provider_data: any
  created_at: string
  updated_at: string
  oauth_providers?: {
    name: string
    enabled: boolean
  }
}

export interface ApiToken {
  id: string
  user_id: string
  name: string
  token_hash: string
  token_prefix: string
  scopes: string[]
  last_used_at?: string | null
  expires_at?: string | null
  created_at: string
  updated_at: string
}

export interface AuthContext {
  user: {
    id: string
    username: string
    full_name?: string | null
    email?: string | null
    avatar_url?: string | null
  }
  method: "token" | "basic" | "oauth"
  permissions: RepositoryPermissions
  token?: ApiToken
}

export interface RepositoryPermissions {
  repo: string[]
  issues: string[]
  wiki: string[]
  pull_requests: string[]
  settings: string[]
  collaborators: string[]
}

export interface PermissionTemplate {
  id: string
  name: string
  description: string
  permissions: RepositoryPermissions
  created_at: string
  updated_at: string
}

export interface UserSession {
  id: string
  user_id: string
  session_token: string
  ip_address?: string | null
  user_agent?: string | null
  expires_at: string
  created_at: string
  updated_at: string
}

export interface AuthAuditLog {
  id: string
  user_id?: string | null
  event_type: string
  event_data: any
  ip_address: string
  user_agent: string
  success: boolean
  created_at: string
}
