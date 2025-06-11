-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE repositories ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE ssh_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public profiles are viewable by everyone" ON users FOR SELECT USING (true);

-- Organizations policies
CREATE POLICY "Organizations are viewable by everyone" ON organizations FOR SELECT USING (true);
CREATE POLICY "Organization members can update organization" ON organizations FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = organizations.id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Organization members policies
CREATE POLICY "Organization members are viewable by organization members" ON organization_members FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.organization_id = organization_members.organization_id 
    AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Organization owners/admins can manage members" ON organization_members FOR ALL USING (
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = organization_members.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Repositories policies
CREATE POLICY "Public repositories are viewable by everyone" ON repositories FOR SELECT USING (visibility = 'public');
CREATE POLICY "Private repositories are viewable by owner/collaborators" ON repositories FOR SELECT USING (
  visibility = 'public' OR
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM repository_collaborators 
    WHERE repository_id = repositories.id AND user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = repositories.organization_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Repository owners can manage repositories" ON repositories FOR ALL USING (
  owner_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_id = repositories.organization_id 
    AND user_id = auth.uid() 
    AND role IN ('owner', 'admin')
  )
);

-- Repository collaborators policies
CREATE POLICY "Repository collaborators are viewable by repository members" ON repository_collaborators FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM repositories r 
    WHERE r.id = repository_collaborators.repository_id 
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM repository_collaborators rc 
        WHERE rc.repository_id = r.id AND rc.user_id = auth.uid()
      )
    )
  )
);

CREATE POLICY "Repository owners can manage collaborators" ON repository_collaborators FOR ALL USING (
  EXISTS (
    SELECT 1 FROM repositories r 
    WHERE r.id = repository_collaborators.repository_id 
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM repository_collaborators rc 
        WHERE rc.repository_id = r.id 
        AND rc.user_id = auth.uid() 
        AND rc.permission = 'admin'
      )
    )
  )
);

-- SSH Keys policies
CREATE POLICY "Users can manage their own SSH keys" ON ssh_keys FOR ALL USING (user_id = auth.uid());

-- Webhooks policies
CREATE POLICY "Repository owners can manage webhooks" ON webhooks FOR ALL USING (
  EXISTS (
    SELECT 1 FROM repositories r 
    WHERE r.id = webhooks.repository_id 
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM repository_collaborators rc 
        WHERE rc.repository_id = r.id 
        AND rc.user_id = auth.uid() 
        AND rc.permission IN ('admin', 'write')
      )
    )
  )
);

-- Webhook deliveries policies
CREATE POLICY "Repository owners can view webhook deliveries" ON webhook_deliveries FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM webhooks w
    JOIN repositories r ON r.id = w.repository_id
    WHERE w.id = webhook_deliveries.webhook_id 
    AND (
      r.owner_id = auth.uid() OR
      EXISTS (
        SELECT 1 FROM repository_collaborators rc 
        WHERE rc.repository_id = r.id 
        AND rc.user_id = auth.uid() 
        AND rc.permission IN ('admin', 'write')
      )
    )
  )
);
