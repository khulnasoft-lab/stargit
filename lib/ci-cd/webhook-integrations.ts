import type { PushEvent, PullRequestEvent } from "../webhooks/event-types"

/**
 * CI/CD Webhook Integrations
 *
 * Provides integration points for popular CI/CD platforms via webhooks.
 * Supports GitHub Actions, GitLab CI, Jenkins, CircleCI, and custom integrations.
 */

export interface CICDProvider {
  name: string
  webhookUrl: string
  secret?: string
  events: string[]
  config: Record<string, any>
}

export interface CICDIntegration {
  id: string
  repositoryId: string
  provider: CICDProvider
  active: boolean
  createdAt: string
  updatedAt: string
}

/**
 * GitHub Actions Integration
 */
export class GitHubActionsIntegration {
  /**
   * Transform StarGit webhook payload to GitHub Actions format
   */
  static transformPayload(event: any, eventType: string): any {
    switch (eventType) {
      case "push":
        return this.transformPushEvent(event as PushEvent)
      case "pull_request":
        return this.transformPullRequestEvent(event as PullRequestEvent)
      default:
        return event
    }
  }

  private static transformPushEvent(event: PushEvent): any {
    return {
      ref: event.ref,
      before: event.before,
      after: event.after,
      repository: {
        id: event.repository.id,
        name: event.repository.name,
        full_name: event.repository.full_name,
        owner: {
          name: event.repository.owner.name,
          login: event.repository.owner.name,
        },
        private: event.repository.private,
        html_url: `https://github.com/${event.repository.full_name}`,
        clone_url: `https://github.com/${event.repository.full_name}.git`,
        default_branch: event.repository.default_branch,
      },
      pusher: {
        name: event.sender.name,
        email: event.sender.email,
      },
      sender: {
        login: event.sender.name,
        id: event.sender.id,
        type: "User",
      },
      commits: event.commits.map((commit) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        url: commit.url,
        author: {
          name: commit.author.name,
          email: commit.author.email,
          username: commit.author.name,
        },
        committer: {
          name: commit.author.name,
          email: commit.author.email,
          username: commit.author.name,
        },
        added: commit.added,
        removed: commit.removed,
        modified: commit.modified,
      })),
      head_commit: event.head_commit
        ? {
            id: event.head_commit.id,
            message: event.head_commit.message,
            timestamp: event.head_commit.timestamp,
            url: event.head_commit.url,
            author: {
              name: event.head_commit.author.name,
              email: event.head_commit.author.email,
              username: event.head_commit.author.name,
            },
            committer: {
              name: event.head_commit.author.name,
              email: event.head_commit.author.email,
              username: event.head_commit.author.name,
            },
          }
        : null,
    }
  }

  private static transformPullRequestEvent(event: PullRequestEvent): any {
    return {
      action: event.action,
      number: event.number,
      pull_request: {
        id: event.pull_request.id,
        number: event.pull_request.number,
        title: event.pull_request.title,
        body: event.pull_request.body,
        state: event.pull_request.state,
        created_at: event.pull_request.created_at,
        updated_at: event.pull_request.updated_at,
        closed_at: event.pull_request.closed_at,
        merged_at: event.pull_request.merged_at,
        merge_commit_sha: event.pull_request.merge_commit_sha,
        user: {
          login: event.pull_request.user.name,
          id: event.pull_request.user.id,
        },
        head: {
          ref: event.pull_request.head.ref,
          sha: event.pull_request.head.sha,
          repo: {
            id: event.pull_request.head.repo.id,
            name: event.pull_request.head.repo.name,
            full_name: event.pull_request.head.repo.full_name,
          },
        },
        base: {
          ref: event.pull_request.base.ref,
          sha: event.pull_request.base.sha,
          repo: {
            id: event.pull_request.base.repo.id,
            name: event.pull_request.base.repo.name,
            full_name: event.pull_request.base.repo.full_name,
          },
        },
        merged: event.pull_request.merged,
        mergeable: event.pull_request.mergeable,
        mergeable_state: event.pull_request.mergeable_state,
      },
      repository: {
        id: event.repository.id,
        name: event.repository.name,
        full_name: event.repository.full_name,
        owner: {
          login: event.repository.owner.name,
          id: event.repository.owner.id,
        },
        private: event.repository.private,
        default_branch: event.repository.default_branch,
      },
      sender: {
        login: event.sender.name,
        id: event.sender.id,
      },
    }
  }
}

/**
 * GitLab CI Integration
 */
export class GitLabCIIntegration {
  static transformPayload(event: any, eventType: string): any {
    switch (eventType) {
      case "push":
        return this.transformPushEvent(event as PushEvent)
      case "pull_request":
        return this.transformMergeRequestEvent(event as PullRequestEvent)
      default:
        return event
    }
  }

  private static transformPushEvent(event: PushEvent): any {
    return {
      object_kind: "push",
      event_name: "push",
      before: event.before,
      after: event.after,
      ref: event.ref,
      checkout_sha: event.after,
      message: event.head_commit?.message,
      user_id: event.sender.id,
      user_name: event.sender.name,
      user_username: event.sender.name,
      user_email: event.sender.email,
      project_id: event.repository.id,
      project: {
        id: event.repository.id,
        name: event.repository.name,
        description: event.repository.description,
        web_url: `https://gitlab.com/${event.repository.full_name}`,
        git_ssh_url: `git@gitlab.com:${event.repository.full_name}.git`,
        git_http_url: `https://gitlab.com/${event.repository.full_name}.git`,
        namespace: event.repository.owner.name,
        visibility_level: event.repository.private ? 0 : 20,
        path_with_namespace: event.repository.full_name,
        default_branch: event.repository.default_branch,
      },
      commits: event.commits.map((commit) => ({
        id: commit.id,
        message: commit.message,
        timestamp: commit.timestamp,
        url: commit.url,
        author: {
          name: commit.author.name,
          email: commit.author.email,
        },
        added: commit.added,
        removed: commit.removed,
        modified: commit.modified,
      })),
      total_commits_count: event.commits.length,
      repository: {
        name: event.repository.name,
        url: `https://gitlab.com/${event.repository.full_name}`,
        description: event.repository.description,
        homepage: `https://gitlab.com/${event.repository.full_name}`,
        git_http_url: `https://gitlab.com/${event.repository.full_name}.git`,
        git_ssh_url: `git@gitlab.com:${event.repository.full_name}.git`,
        visibility_level: event.repository.private ? 0 : 20,
      },
    }
  }

  private static transformMergeRequestEvent(event: PullRequestEvent): any {
    return {
      object_kind: "merge_request",
      event_type: "merge_request",
      user: {
        id: event.sender.id,
        name: event.sender.name,
        username: event.sender.name,
        email: event.sender.email,
      },
      project: {
        id: event.repository.id,
        name: event.repository.name,
        description: event.repository.description,
        web_url: `https://gitlab.com/${event.repository.full_name}`,
        git_ssh_url: `git@gitlab.com:${event.repository.full_name}.git`,
        git_http_url: `https://gitlab.com/${event.repository.full_name}.git`,
        namespace: event.repository.owner.name,
        visibility_level: event.repository.private ? 0 : 20,
        path_with_namespace: event.repository.full_name,
        default_branch: event.repository.default_branch,
      },
      object_attributes: {
        id: event.pull_request.id,
        iid: event.pull_request.number,
        title: event.pull_request.title,
        description: event.pull_request.body,
        state: event.pull_request.state,
        created_at: event.pull_request.created_at,
        updated_at: event.pull_request.updated_at,
        target_branch: event.pull_request.base.ref,
        source_branch: event.pull_request.head.ref,
        source_project_id: event.pull_request.head.repo.id,
        target_project_id: event.pull_request.base.repo.id,
        author_id: event.pull_request.user.id,
        merge_status: event.pull_request.mergeable ? "can_be_merged" : "cannot_be_merged",
        work_in_progress: false,
        url: `https://gitlab.com/${event.repository.full_name}/-/merge_requests/${event.pull_request.number}`,
        action: event.action,
      },
    }
  }
}

/**
 * Jenkins Integration
 */
export class JenkinsIntegration {
  static transformPayload(event: any, eventType: string): any {
    return {
      repository: {
        name: event.repository.name,
        url: `https://git.example.com/${event.repository.full_name}.git`,
        absolute_url: `https://git.example.com/${event.repository.full_name}`,
      },
      pusher: {
        name: event.sender.name,
        email: event.sender.email,
      },
      ref: eventType === "push" ? event.ref : undefined,
      commits: eventType === "push" ? event.commits : undefined,
      pull_request: eventType === "pull_request" ? event.pull_request : undefined,
    }
  }
}

/**
 * CircleCI Integration
 */
export class CircleCIIntegration {
  static transformPayload(event: any, eventType: string): any {
    return {
      payload: {
        vcs_type: "git",
        repository_url: `https://git.example.com/${event.repository.full_name}`,
        branch: eventType === "push" ? event.ref.replace("refs/heads/", "") : event.pull_request?.head.ref,
        commit: {
          sha: eventType === "push" ? event.after : event.pull_request?.head.sha,
          message: eventType === "push" ? event.head_commit?.message : event.pull_request?.title,
          author: {
            name: event.sender.name,
            email: event.sender.email,
          },
        },
      },
    }
  }
}

/**
 * CI/CD Webhook Manager
 */
export class CICDWebhookManager {
  /**
   * Register CI/CD integration for a repository
   */
  static async registerIntegration(repositoryId: string, provider: CICDProvider): Promise<CICDIntegration> {
    const integration: CICDIntegration = {
      id: `cicd_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      repositoryId,
      provider,
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    // Store integration in database
    // In a real implementation, this would be stored in the database
    console.log("Registered CI/CD integration:", integration)

    return integration
  }

  /**
   * Trigger CI/CD webhooks for repository events
   */
  static async triggerCICDWebhooks(repositoryId: string, eventType: string, payload: any): Promise<void> {
    // Get CI/CD integrations for repository
    const integrations = await this.getRepositoryIntegrations(repositoryId)

    for (const integration of integrations) {
      if (!integration.active || !integration.provider.events.includes(eventType)) {
        continue
      }

      try {
        let transformedPayload = payload

        // Transform payload based on provider
        switch (integration.provider.name) {
          case "github-actions":
            transformedPayload = GitHubActionsIntegration.transformPayload(payload, eventType)
            break
          case "gitlab-ci":
            transformedPayload = GitLabCIIntegration.transformPayload(payload, eventType)
            break
          case "jenkins":
            transformedPayload = JenkinsIntegration.transformPayload(payload, eventType)
            break
          case "circleci":
            transformedPayload = CircleCIIntegration.transformPayload(payload, eventType)
            break
        }

        // Send webhook to CI/CD provider
        await this.sendWebhook(integration, eventType, transformedPayload)
      } catch (error) {
        console.error(`Failed to trigger CI/CD webhook for ${integration.provider.name}:`, error)
      }
    }
  }

  /**
   * Send webhook to CI/CD provider
   */
  private static async sendWebhook(integration: CICDIntegration, eventType: string, payload: any): Promise<void> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "StarGit-CICD/1.0",
      "X-StarGit-Event": eventType,
      "X-StarGit-Delivery": `del_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
    }

    // Add provider-specific headers
    switch (integration.provider.name) {
      case "github-actions":
        headers["X-GitHub-Event"] = eventType
        if (integration.provider.secret) {
          headers["X-Hub-Signature-256"] = this.generateSignature(payload, integration.provider.secret)
        }
        break
      case "gitlab-ci":
        headers["X-Gitlab-Event"] = eventType
        if (integration.provider.secret) {
          headers["X-Gitlab-Token"] = integration.provider.secret
        }
        break
      case "jenkins":
        if (integration.provider.secret) {
          headers["Authorization"] = `Bearer ${integration.provider.secret}`
        }
        break
    }

    const response = await fetch(integration.provider.webhookUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      throw new Error(`Webhook failed with status ${response.status}: ${response.statusText}`)
    }

    console.log(`CI/CD webhook sent successfully to ${integration.provider.name}`)
  }

  /**
   * Generate webhook signature
   */
  private static generateSignature(payload: any, secret: string): string {
    const crypto = require("crypto")
    const hmac = crypto.createHmac("sha256", secret)
    const signature = hmac.update(JSON.stringify(payload)).digest("hex")
    return `sha256=${signature}`
  }

  /**
   * Get CI/CD integrations for repository
   */
  private static async getRepositoryIntegrations(repositoryId: string): Promise<CICDIntegration[]> {
    // In a real implementation, this would query the database
    // For this example, we'll return an empty array
    return []
  }
}

/**
 * Example CI/CD Integration Configurations
 */
export const CICDExamples = {
  githubActions: {
    name: "github-actions",
    webhookUrl: "https://api.github.com/repos/owner/repo/dispatches",
    events: ["push", "pull_request", "release"],
    config: {
      event_type: "repository_dispatch",
      client_payload: {},
    },
  },

  gitlabCI: {
    name: "gitlab-ci",
    webhookUrl: "https://gitlab.com/api/v4/projects/:id/trigger/pipeline",
    events: ["push", "pull_request"],
    config: {
      token: "trigger_token",
      ref: "main",
    },
  },

  jenkins: {
    name: "jenkins",
    webhookUrl: "https://jenkins.example.com/generic-webhook-trigger/invoke",
    events: ["push", "pull_request"],
    config: {
      token: "webhook_token",
      cause: "StarGit webhook",
    },
  },

  circleci: {
    name: "circleci",
    webhookUrl: "https://circleci.com/api/v2/project/gh/owner/repo/pipeline",
    events: ["push", "pull_request"],
    config: {
      branch: "main",
    },
  },
}
