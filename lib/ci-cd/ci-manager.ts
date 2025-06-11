import { supabase } from "../supabase"

/**
 * CI/CD Manager
 *
 * Manages CI/CD integrations and pipeline configurations:
 * - CI/CD provider integrations
 * - Pipeline configuration management
 * - Build status tracking
 * - Deployment management
 */
export class CIManager {
  /**
   * Get CI integrations for a repository
   */
  async getIntegrations(repositoryId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from("ci_integrations")
        .select("*")
        .eq("repository_id", repositoryId)
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Failed to get CI integrations:", error)
      return []
    }
  }
  
  /**
   * Create a new CI integration
   */
  async createIntegration(
    repositoryId: string,
    provider: string,
    config: Record<string, any>
  ): Promise<{ success: boolean; integration?: any; message: string }> {
    try {
      // Validate provider
      if (!this.isSupportedProvider(provider)) {
        return {
          success: false,
          message: `Unsupported CI provider: ${provider}`,
        }
      }
      
      // Create integration record
      const { data, error } = await supabase
        .from("ci_integrations")
        .insert({
          repository_id: repositoryId,
          provider,
          config,
          active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()
      
      if (error) throw error
      
      // Register webhook for the integration
      await this.registerWebhook(repositoryId, provider, data.id, config)
      
      return {
        success: true,
        integration: data,
        message: `${provider} integration created successfully`,
      }
    } catch (error) {
      console.error("Failed to create CI integration:", error)
      return {
        success: false,
        message: `Failed to create integration: ${(error as Error).message}`,
      }
    }
  }
  
  /**
   * Update a CI integration
   */
  async updateIntegration(
    integrationId: string,
    updates: { config?: Record<string, any>; active?: boolean }
  ): Promise<{ success: boolean; integration?: any; message: string }> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
      }
      
      if (updates.config !== undefined) {
        updateData.config = updates.config
      }
      
      if (updates.active !== undefined) {
        updateData.active = updates.active
      }
      
      const { data, error } = await supabase
        .from("ci_integrations")
        .update(updateData)
        .eq("id", integrationId)
        .select()
        .single()
      
      if (error) throw error
      
      // Update webhook if config changed
      if (updates.config) {
        await this.updateWebhook(data.repository_id, data.provider, integrationId, data.config)
      }
      
      return {
        success: true,
        integration: data,
        message: "Integration updated successfully",
      }
    } catch (error) {
      console.error("Failed to update CI integration:", error)
      return {
        success: false,
        message: `Failed to update integration: ${(error as Error).message}`,
      }
    }
  }
  
  /**
   * Delete a CI integration
   */
  async deleteIntegration(integrationId: string): Promise<{ success: boolean; message: string }> {
    try {
      // Get integration details first
      const { data: integration, error: fetchError } = await supabase
        .from("ci_integrations")
        .select("*")
        .eq("id", integrationId)
        .single()
      
      if (fetchError) throw fetchError
      
      // Delete integration
      const { error } = await supabase
        .from("ci_integrations")
        .delete()
        .eq("id", integrationId)
      
      if (error) throw error
      
      // Delete associated webhook
      await this.deleteWebhook(integration.repository_id, integration.provider, integrationId)
      
      return {
        success: true,
        message: "Integration deleted successfully",
      }
    } catch (error) {
      console.error("Failed to delete CI integration:", error)
      return {
        success: false,
        message: `Failed to delete integration: ${(error as Error).message}`,
      }
    }
  }
  
  /**
   * Register webhook for CI integration
   */
  private async registerWebhook(
    repositoryId: string,
    provider: string,
    integrationId: string,
    config: Record<string, any>
  ): Promise<void> {
    try {
      // Get repository details
      const { data: repository, error } = await supabase
        .from("repositories")
        .select("*")
        .eq("id", repositoryId)
        .single()
      
      if (error) throw error
      
      // Determine webhook URL and events based on provider
      const webhookConfig = this.getWebhookConfig(provider, config)
      
      // Create webhook
      await supabase.from("webhooks").insert({
        repository_id: repositoryId,
        url: webhookConfig.url,
        content_type: "application/json",
        secret: webhookConfig.secret,
        events: webhookConfig.events,
        status: "active",
        metadata: {
          provider,
          integration_id: integrationId,
          ci_webhook: true,
        },
      })
    } catch (error) {
      console.error("Failed to register CI webhook:", error)
      throw error
    }
  }
  
  /**
   * Update webhook for CI integration
   */
  private async updateWebhook(
    repositoryId: string,
    provider: string,
    integrationId: string,
    config: Record<string, any>
  ): Promise<void> {
    try {
      // Find existing webhook
      const { data: webhook, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("repository_id", repositoryId)
        .eq("metadata->integration_id", integrationId)
        .single()
      
      if (error) throw error
      
      // Determine webhook URL and events based on provider
      const webhookConfig = this.getWebhookConfig(provider, config)
      
      // Update webhook
      await supabase
        .from("webhooks")
        .update({
          url: webhookConfig.url,
          secret: webhookConfig.secret,
          events: webhookConfig.events,
          updated_at: new Date().toISOString(),
        })
        .eq("id", webhook.id)
    } catch (error) {
      console.error("Failed to update CI webhook:", error)
      throw error
    }
  }
  
  /**
   * Delete webhook for CI integration
   */
  private async deleteWebhook(
    repositoryId: string,
    provider: string,
    integrationId: string
  ): Promise<void> {
    try {
      // Find and delete webhook
      await supabase
        .from("webhooks")
        .delete()
        .eq("repository_id", repositoryId)
        .eq("metadata->integration_id", integrationId)
    } catch (error) {
      console.error("Failed to delete CI webhook:", error)
      throw error
    }
  }
  
  /**
   * Get webhook configuration for a CI provider
   */
  private getWebhookConfig(
    provider: string,
    config: Record<string, any>
  ): { url: string; secret?: string; events: string[] } {
    switch (provider) {
      case "github-actions":
        return {
          url: config.webhook_url || `https://api.github.com/repos/${config.owner}/${config.repo}/dispatches`,
          secret: config.webhook_secret,
          events: ["push", "pull_request"],
        }
      case "gitlab-ci":
        return {
          url: config.webhook_url || `https://gitlab.com/api/v4/projects/${config.project_id}/trigger/pipeline`,
          secret: config.webhook_token,
          events: ["push", "pull_request"],
        }
      case "jenkins":
        return {
          url: config.webhook_url,
          secret: config.webhook_token,
          events: ["push", "pull_request"],
        }
      case "circle-ci":
        return {
          url: config.webhook_url || `https://circleci.com/api/v2/project/${config.vcs_type}/${config.org}/${config.repo}/pipeline`,
          secret: config.webhook_token,
          events: ["push", "pull_request"],
        }
      case "travis-ci":
        return {
          url: config.webhook_url || "https://api.travis-ci.com/repo/trigger",
          secret: config.webhook_token,
          events: ["push", "pull_request"],
        }
      case "azure-devops":
        return {
          url: config.webhook_url,
          secret: config.webhook_secret,
          events: ["push", "pull_request"],
        }
      default:
        return {
          url: config.webhook_url || "",
          secret: config.webhook_secret,
          events: config.events || ["push"],
        }
    }
  }
  
  /**
   * Check if a provider is supported
   */
  private isSupportedProvider(provider: string): boolean {
    const supportedProviders = [
      "github-actions",
      "gitlab-ci",
      "jenkins",
      "circle-ci",
      "travis-ci",
      "azure-devops",
      "custom",
    ]
    
    return supportedProviders.includes(provider)
  }
  
  /**
   * Get build status for a repository
   */
  async getBuildStatus(
    repositoryId: string,
    ref: string
  ): Promise<Array<{
    provider: string;
    status: "pending" | "success" | "failure" | "error" | "cancelled";
    url?: string;
    description?: string;
    created_at: string;
  }>> {
    try {
      const { data, error } = await supabase
        .from("ci_builds")
        .select("*")
        .eq("repository_id", repositoryId)
        .eq("ref", ref)
        .order("created_at", { ascending: false })
      
      if (error) throw error
      return data || []
    } catch (error) {
      console.error("Failed to get build status:", error)
      return []
    }
  }
  
  /**
   * Record build status
   */
  async recordBuildStatus(
    repositoryId: string,
    ref: string,
    provider: string,
    status: "pending" | "success" | "failure" | "error" | "cancelled",
    details: { url?: string; description?: string; build_id?: string } = {}
  ): Promise<void> {
    try {
      await supabase.from("ci_builds").insert({
        repository_id: repositoryId,
        ref,
        provider,
        status,
        url: details.url,
        description: details.description,
        build_id: details.build_id,
        created_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error("Failed to record build status:", error)
      throw error
    }
  }
  
  /**
   * Get CI configuration file content
   */
  async getConfigFile(
    repositoryId: string,
    provider: string
  ): Promise<{ content?: string; path?: string; exists: boolean }> {
    try {
      // Get repository details
      const { data: repository, error } = await supabase
        .from("repositories")
        .select("*")
        .eq("id", repositoryId)
        .single()
      
      if (error) throw error
      
      // Determine config file path based on provider
      const configPath = this.getConfigFilePath(provider)
      
      // Check if file exists in repository
      // In a real implementation, this would check the actual Git repository
      // For this example, we'll check a database table that tracks files
      const { data: fileData, error: fileError } = await supabase
        .from("repository_files")
        .select("content")
        .eq("repository_id", repositoryId)
        .eq("path", configPath)
        .single()
      
      if (fileError) {
        return { exists: false, path: configPath }
      }
      
      return {
        content: fileData.content,
        path: configPath
