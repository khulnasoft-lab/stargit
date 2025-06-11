-- Authentication and Authorization Schema Extensions

-- OAuth providers table
CREATE TABLE public.oauth_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) UNIQUE NOT NULL, -- github, gitlab, google, etc.
  client_id VARCHAR(255) NOT NULL,
  client_secret VARCHAR(255) NOT NULL,
  authorization_url TEXT NOT NULL,
  token_url TEXT NOT NULL,
  user_info_url TEXT NOT NULL,
  scope VARCHAR(255) DEFAULT 'user:email',
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- OAuth user connections
CREATE TABLE public.oauth_connections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES oauth_providers(id) ON DELETE CASCADE,
  provider_user_id VARCHAR(255) NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  provider_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(provider_id, provider_user_id)
);

-- API tokens for programmatic access
CREATE TABLE public.api_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  token_hash VARCHAR(255) UNIQUE NOT NULL,
  token_prefix VARCHAR(20) NOT NULL, -- First few chars for identification
  scopes TEXT[] DEFAULT ARRAY['repo:read'], -- permissions array
  last_used_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for web authentication
CREATE TABLE public.user_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Permission templates for common role combinations
CREATE TABLE public.permission_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  permissions JSONB NOT NULL, -- {repo: ['read', 'write'], issues: ['read', 'write'], etc}
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles at organization level (extends existing organization_members)
ALTER TABLE organization_members ADD COLUMN permissions JSONB DEFAULT '{}';

-- Repository permissions (extends existing repository_collaborators)
ALTER TABLE repository_collaborators ADD COLUMN permissions JSONB DEFAULT '{}';

-- Audit log for authentication events
CREATE TABLE public.auth_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  event_type VARCHAR(50) NOT NULL, -- login, logout, token_created, permission_changed, etc.
  event_data JSONB,
  ip_address INET,
  user_agent TEXT,
  success BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_oauth_connections_user_id ON oauth_connections(user_id);
CREATE INDEX idx_oauth_connections_provider ON oauth_connections(provider_id, provider_user_id);
CREATE INDEX idx_api_tokens_user_id ON api_tokens(user_id);
CREATE INDEX idx_api_tokens_hash ON api_tokens(token_hash);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_auth_audit_log_user_id ON auth_audit_log(user_id);
CREATE INDEX idx_auth_audit_log_created_at ON auth_audit_log(created_at);

-- Insert default permission templates
INSERT INTO permission_templates (name, description, permissions, is_system) VALUES
('read_only', 'Read-only access to repositories', '{"repo": ["read"], "issues": ["read"], "wiki": ["read"]}', true),
('developer', 'Standard developer permissions', '{"repo": ["read", "write"], "issues": ["read", "write", "create"], "wiki": ["read", "write"], "pull_requests": ["read", "write", "create"]}', true),
('maintainer', 'Maintainer with additional permissions', '{"repo": ["read", "write"], "issues": ["read", "write", "create", "delete"], "wiki": ["read", "write", "delete"], "pull_requests": ["read", "write", "create", "merge"], "settings": ["read", "write"]}', true),
('admin', 'Full administrative access', '{"repo": ["read", "write", "delete"], "issues": ["read", "write", "create", "delete"], "wiki": ["read", "write", "delete"], "pull_requests": ["read", "write", "create", "merge", "delete"], "settings": ["read", "write", "delete"], "collaborators": ["read", "write", "delete"]}', true);

-- Insert default OAuth providers (disabled by default)
INSERT INTO oauth_providers (name, client_id, client_secret, authorization_url, token_url, user_info_url, enabled) VALUES
('github', 'your_github_client_id', 'your_github_client_secret', 'https://github.com/login/oauth/authorize', 'https://github.com/login/oauth/access_token', 'https://api.github.com/user', false),
('gitlab', 'your_gitlab_client_id', 'your_gitlab_client_secret', 'https://gitlab.com/oauth/authorize', 'https://gitlab.com/oauth/token', 'https://gitlab.com/api/v4/user', false),
('google', 'your_google_client_id', 'your_google_client_secret', 'https://accounts.google.com/o/oauth2/v2/auth', 'https://oauth2.googleapis.com/token', 'https://www.googleapis.com/oauth2/v2/userinfo', false);

-- Triggers for updated_at
CREATE TRIGGER update_oauth_providers_updated_at BEFORE UPDATE ON oauth_providers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_oauth_connections_updated_at BEFORE UPDATE ON oauth_connections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_tokens_updated_at BEFORE UPDATE ON api_tokens FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_sessions_updated_at BEFORE UPDATE ON user_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
