/**
 * Webhook event types and payload definitions
 */

// Base event interface
export interface GitEvent {
  repository: {
    id: string
    name: string
    full_name: string
    owner: {
      id: string
      name: string
      type: string
    }
    private: boolean
    description?: string
    default_branch: string
  }
  sender: {
    id: string
    name: string
    email?: string
  }
  created_at: string
}

// Push event
export interface PushEvent extends GitEvent {
  ref: string
  before: string
  after: string
  commits: Array<{
    id: string
    message: string
    timestamp: string
    author: {
      name: string
      email: string
    }
    url: string
    added: string[]
    removed: string[]
    modified: string[]
  }>
  head_commit: {
    id: string
    message: string
    timestamp: string
    author: {
      name: string
      email: string
    }
    url: string
  }
}

// Pull request event
export interface PullRequestEvent extends GitEvent {
  action:
    | "opened"
    | "closed"
    | "reopened"
    | "edited"
    | "assigned"
    | "unassigned"
    | "review_requested"
    | "review_request_removed"
    | "labeled"
    | "unlabeled"
    | "synchronized"
    | "merged"
  number: number
  pull_request: {
    id: string
    number: number
    title: string
    body?: string
    state: "open" | "closed"
    created_at: string
    updated_at: string
    closed_at?: string
    merged_at?: string
    merge_commit_sha?: string
    user: {
      id: string
      name: string
    }
    head: {
      ref: string
      sha: string
      repo: {
        id: string
        name: string
        full_name: string
      }
    }
    base: {
      ref: string
      sha: string
      repo: {
        id: string
        name: string
        full_name: string
      }
    }
    merged: boolean
    mergeable?: boolean
    mergeable_state?: string
    comments: number
    commits: number
    additions: number
    deletions: number
    changed_files: number
  }
}

// Issue event
export interface IssueEvent extends GitEvent {
  action: "opened" | "closed" | "reopened" | "edited" | "assigned" | "unassigned" | "labeled" | "unlabeled"
  issue: {
    id: string
    number: number
    title: string
    body?: string
    state: "open" | "closed"
    created_at: string
    updated_at: string
    closed_at?: string
    user: {
      id: string
      name: string
    }
    labels: Array<{
      id: string
      name: string
      color: string
    }>
    assignees: Array<{
      id: string
      name: string
    }>
    comments: number
  }
}

// Release event
export interface ReleaseEvent extends GitEvent {
  action: "published" | "unpublished" | "created" | "edited" | "deleted" | "prereleased"
  release: {
    id: string
    tag_name: string
    name?: string
    body?: string
    draft: boolean
    prerelease: boolean
    created_at: string
    published_at?: string
    author: {
      id: string
      name: string
    }
    assets: Array<{
      id: string
      name: string
      label?: string
      content_type: string
      size: number
      download_count: number
      created_at: string
      updated_at: string
    }>
  }
}

// Comment event
export interface CommentEvent extends GitEvent {
  action: "created" | "edited" | "deleted"
  comment: {
    id: string
    body: string
    created_at: string
    updated_at: string
    user: {
      id: string
      name: string
    }
  }
  issue?: {
    id: string
    number: number
    title: string
  }
  pull_request?: {
    id: string
    number: number
    title: string
  }
}

// Deployment event
export interface DeploymentEvent extends GitEvent {
  deployment: {
    id: string
    ref: string
    sha: string
    task: string
    environment: string
    description?: string
    creator: {
      id: string
      name: string
    }
    created_at: string
    updated_at: string
    statuses_url: string
    repository_url: string
  }
}

// Deployment status event
export interface DeploymentStatusEvent extends GitEvent {
  deployment_status: {
    id: string
    state: "pending" | "success" | "failure" | "error" | "inactive"
    creator: {
      id: string
      name: string
    }
    description?: string
    environment: string
    target_url?: string
    created_at: string
    updated_at: string
  }
  deployment: {
    id: string
    ref: string
    sha: string
    task: string
    environment: string
  }
}

// Event type mapping
export type GitEventType =
  | "push"
  | "pull_request"
  | "issue"
  | "release"
  | "comment"
  | "deployment"
  | "deployment_status"
  | "ping"

// Event payload mapping
export type GitEventPayload =
  | PushEvent
  | PullRequestEvent
  | IssueEvent
  | ReleaseEvent
  | CommentEvent
  | DeploymentEvent
  | DeploymentStatusEvent
