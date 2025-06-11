-- Row Level Security for Authentication Tables

-- Enable RLS
ALTER TABLE oauth_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE permission_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE auth_audit_log ENABLE ROW LEVEL SECURITY;

-- OAuth providers policies (admin only)
CREATE POLICY "Only admins can manage OAuth providers" ON oauth_providers FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (users.username = 'admin' OR 'admin' = ANY(users.roles))
  )
);

CREATE POLICY "Everyone can view enabled OAuth providers" ON oauth_providers FOR SELECT USING (enabled = true);

-- OAuth connections policies
CREATE POLICY "Users can manage their own OAuth connections" ON oauth_connections FOR ALL USING (user_id = auth.uid());

-- API tokens policies
CREATE POLICY "Users can manage their own API tokens" ON api_tokens FOR ALL USING (user_id = auth.uid());

-- User sessions policies
CREATE POLICY "Users can view their own sessions" ON user_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users can delete their own sessions" ON user_sessions FOR DELETE USING (user_id = auth.uid());

-- Permission templates policies
CREATE POLICY "Everyone can view permission templates" ON permission_templates FOR SELECT USING (true);
CREATE POLICY "Only admins can manage permission templates" ON permission_templates FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (users.username = 'admin' OR 'admin' = ANY(users.roles))
  )
);

-- Auth audit log policies
CREATE POLICY "Users can view their own audit logs" ON auth_audit_log FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Admins can view all audit logs" ON auth_audit_log FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE id = auth.uid() 
    AND (users.username = 'admin' OR 'admin' = ANY(users.roles))
  )
);
