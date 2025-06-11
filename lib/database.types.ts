export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          location: string | null
          website: string | null
          company: string | null
          email: string | null
          email_public: boolean
          hireable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          company?: string | null
          email?: string | null
          email_public?: boolean
          hireable?: boolean
        }
        Update: {
          username?: string
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          location?: string | null
          website?: string | null
          company?: string | null
          email?: string | null
          email_public?: boolean
          hireable?: boolean
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          display_name: string
          description: string | null
          avatar_url: string | null
          website: string | null
          location: string | null
          email: string | null
          billing_email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          display_name: string
          description?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          email?: string | null
          billing_email?: string | null
        }
        Update: {
          name?: string
          display_name?: string
          description?: string | null
          avatar_url?: string | null
          website?: string | null
          location?: string | null
          email?: string | null
          billing_email?: string | null
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: "owner" | "admin" | "member"
          permissions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          organization_id: string
          user_id: string
          role?: "owner" | "admin" | "member"
          permissions?: Json | null
        }
        Update: {
          role?: "owner" | "admin" | "member"
          permissions?: Json | null
        }
      }
      repositories: {
        Row: {
          id: string
          name: string
          full_name: string
          description: string | null
          owner_id: string | null
          organization_id: string | null
          visibility: "public" | "private" | "internal"
          default_branch: string
          is_fork: boolean
          fork_parent_id: string | null
          clone_url: string | null
          ssh_url: string | null
          size_kb: number
          stars_count: number
          forks_count: number
          watchers_count: number
          open_issues_count: number
          has_issues: boolean
          has_projects: boolean
          has_wiki: boolean
          has_pages: boolean
          archived: boolean
          disabled: boolean
          pushed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          full_name: string
          description?: string | null
          owner_id?: string | null
          organization_id?: string | null
          visibility?: "public" | "private" | "internal"
          default_branch?: string
          is_fork?: boolean
          fork_parent_id?: string | null
          clone_url?: string | null
          ssh_url?: string | null
          has_issues?: boolean
          has_projects?: boolean
          has_wiki?: boolean
          has_pages?: boolean
        }
        Update: {
          name?: string
          description?: string | null
          visibility?: "public" | "private" | "internal"
          default_branch?: string
          has_issues?: boolean
          has_projects?: boolean
          has_wiki?: boolean
          has_pages?: boolean
          archived?: boolean
          disabled?: boolean
          pushed_at?: string | null
        }
      }
      repository_collaborators: {
        Row: {
          id: string
          repository_id: string
          user_id: string
          permission: "read" | "write" | "admin"
          permissions: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          repository_id: string
          user_id: string
          permission?: "read" | "write" | "admin"
          permissions?: Json | null
        }
        Update: {
          permission?: "read" | "write" | "admin"
          permissions?: Json | null
        }
      }
      ssh_keys: {
        Row: {
          id: string
          user_id: string
          title: string
          key_content: string
          key_type: string
          fingerprint: string
          last_used_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          title: string
          key_content: string
          key_type: string
          fingerprint: string
        }
        Update: {
          title?: string
          last_used_at?: string | null
        }
      }
      webhooks: {
        Row: {
          id: string
          repository_id: string
          url: string
          content_type: string
          secret: string | null
          insecure_ssl: boolean
          events: ("push" | "pull_request" | "issue" | "release" | "deployment")[]
          status: "active" | "inactive" | "failed"
          last_response_code: number | null
          last_response_message: string | null
          last_delivery_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          repository_id: string
          url: string
          content_type?: string
          secret?: string | null
          insecure_ssl?: boolean
          events?: ("push" | "pull_request" | "issue" | "release" | "deployment")[]
          status?: "active" | "inactive" | "failed"
        }
        Update: {
          url?: string
          content_type?: string
          secret?: string | null
          insecure_ssl?: boolean
          events?: ("push" | "pull_request" | "issue" | "release" | "deployment")[]
          status?: "active" | "inactive" | "failed"
          last_response_code?: number | null
          last_response_message?: string | null
          last_delivery_at?: string | null
        }
      }
      webhook_deliveries: {
        Row: {
          id: string
          webhook_id: string
          event_type: "push" | "pull_request" | "issue" | "release" | "deployment"
          payload: Json
          response_code: number | null
          response_headers: Json | null
          response_body: string | null
          duration_ms: number | null
          success: boolean
          created_at: string
        }
        Insert: {
          webhook_id: string
          event_type: "push" | "pull_request" | "issue" | "release" | "deployment"
          payload: Json
          response_code?: number | null
          response_headers?: Json | null
          response_body?: string | null
          duration_ms?: number | null
          success?: boolean
        }
        Update: {
          response_code?: number | null
          response_headers?: Json | null
          response_body?: string | null
          duration_ms?: number | null
          success?: boolean
        }
      }
      oauth_providers: {
        Row: {
          id: string
          name: string
          client_id: string
          client_secret: string | null
          authorization_url: string
          token_url: string
          user_info_url: string
          scope: string
          enabled: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          name: string
          client_id: string
          client_secret?: string | null
          authorization_url: string
          token_url: string
          user_info_url: string
          scope: string
          enabled?: boolean
        }
        Update: {
          name?: string
          client_id?: string
          client_secret?: string | null
          authorization_url?: string
          token_url?: string
          user_info_url?: string
          scope?: string
          enabled?: boolean
        }
      }
      oauth_connections: {
        Row: {
          id: string
          user_id: string
          provider_id: string
          provider_user_id: string
          access_token: string
          refresh_token: string | null
          token_expires_at: string | null
          provider_data: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          provider_id: string
          provider_user_id: string
          access_token: string
          refresh_token?: string | null
          token_expires_at?: string | null
          provider_data: Json
        }
        Update: {
          access_token?: string
          refresh_token?: string | null
          token_expires_at?: string | null
          provider_data?: Json
        }
      }
      api_tokens: {
        Row: {
          id: string
          user_id: string
          name: string
          token_hash: string
          token_prefix: string
          scopes: string[]
          last_used_at: string | null
          expires_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          name: string
          token_hash: string
          token_prefix: string
          scopes: string[]
          expires_at?: string | null
        }
        Update: {
          name?: string
          last_used_at?: string | null
        }
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          session_token: string
          ip_address: string | null
          user_agent: string | null
          expires_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id: string
          session_token: string
          ip_address?: string | null
          user_agent?: string | null
          expires_at: string
        }
        Update: {
          expires_at?: string
        }
      }
      auth_audit_log: {
        Row: {
          id: string
          user_id: string | null
          event_type: string
          event_data: Json
          ip_address: string
          user_agent: string
          success: boolean
          created_at: string
        }
        Insert: {
          user_id?: string | null
          event_type: string
          event_data?: Json
          ip_address: string
          user_agent: string
          success?: boolean
        }
        Update: never
      }
    }
  }
}
