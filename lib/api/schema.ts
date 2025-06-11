/**
 * API Schema Definitions
 *
 * This file defines the API schema for the Git platform, including:
 * - REST API endpoints and parameters
 * - GraphQL schema types and resolvers
 * - Response formats and error handling
 */

// REST API Schemas

/**
 * Repository API Schema
 */
export interface RepositoryCreateParams {
  name: string
  description?: string
  visibility: "public" | "private" | "internal"
  auto_init?: boolean
  gitignore_template?: string
  license_template?: string
  default_branch?: string
  organization_id?: string
}

export interface RepositoryUpdateParams {
  name?: string
  description?: string
  visibility?: "public" | "private" | "internal"
  default_branch?: string
  has_issues?: boolean
  has_wiki?: boolean
  has_projects?: boolean
  archived?: boolean
}

export interface RepositoryResponse {
  id: string
  name: string
  full_name: string
  description: string | null
  owner: {
    id: string
    login: string
    type: "User" | "Organization"
    avatar_url: string | null
  }
  private: boolean
  visibility: "public" | "private" | "internal"
  fork: boolean
  created_at: string
  updated_at: string
  pushed_at: string | null
  size: number
  stargazers_count: number
  watchers_count: number
  forks_count: number
  open_issues_count: number
  default_branch: string
  permissions?: {
    admin: boolean
    push: boolean
    pull: boolean
  }
  license?: {
    key: string
    name: string
    url: string
  } | null
  has_issues: boolean
  has_wiki: boolean
  has_projects: boolean
  archived: boolean
  disabled: boolean
  clone_url: string
  ssh_url: string
  html_url: string
  url: string
}

/**
 * User API Schema
 */
export interface UserResponse {
  id: string
  login: string
  name: string | null
  email: string | null
  avatar_url: string | null
  bio: string | null
  location: string | null
  company: string | null
  blog: string | null
  twitter_username: string | null
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
  type: "User"
  site_admin: boolean
}

/**
 * Organization API Schema
 */
export interface OrganizationResponse {
  id: string
  login: string
  name: string | null
  description: string | null
  avatar_url: string | null
  location: string | null
  email: string | null
  blog: string | null
  twitter_username: string | null
  company: string | null
  public_repos: number
  public_members: number
  followers: number
  following: number
  created_at: string
  updated_at: string
  type: "Organization"
  total_private_repos: number
  owned_private_repos: number
  private_gists: number
  disk_usage: number
  collaborators: number
  billing_email: string | null
  plan: {
    name: string
    space: number
    private_repos: number
    collaborators: number
  }
}

/**
 * Webhook API Schema
 */
export interface WebhookCreateParams {
  name: string
  config: {
    url: string
    content_type: "json" | "form"
    secret?: string
    insecure_ssl?: boolean
  }
  events: string[]
  active?: boolean
}

export interface WebhookResponse {
  id: string
  name: string
  active: boolean
  events: string[]
  config: {
    url: string
    content_type: string
    insecure_ssl: boolean
  }
  updated_at: string
  created_at: string
  url: string
  test_url: string
  ping_url: string
  deliveries_url: string
  last_response: {
    code: number | null
    status: string
    message: string | null
  }
}

/**
 * API Error Response Schema
 */
export interface APIError {
  message: string
  documentation_url?: string
  errors?: Array<{
    resource: string
    field: string
    code: string
    message?: string
  }>
}

/**
 * Pagination Schema
 */
export interface PaginationParams {
  page?: number
  per_page?: number
  sort?: string
  direction?: "asc" | "desc"
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    per_page: number
    total_count: number
    total_pages: number
    has_next_page: boolean
    has_prev_page: boolean
  }
  links: {
    first?: string
    prev?: string
    next?: string
    last?: string
  }
}

/**
 * GraphQL Schema Types
 */
export const GraphQLTypeDefs = `
  scalar DateTime
  scalar JSON

  type User {
    id: ID!
    login: String!
    name: String
    email: String
    avatarUrl: String
    bio: String
    location: String
    company: String
    blog: String
    twitterUsername: String
    publicRepos: Int!
    publicGists: Int!
    followers: Int!
    following: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    repositories(first: Int, after: String): RepositoryConnection!
    organizations(first: Int, after: String): OrganizationConnection!
  }

  type Organization {
    id: ID!
    login: String!
    name: String
    description: String
    avatarUrl: String
    location: String
    email: String
    blog: String
    twitterUsername: String
    company: String
    publicRepos: Int!
    publicMembers: Int!
    followers: Int!
    following: Int!
    createdAt: DateTime!
    updatedAt: DateTime!
    repositories(first: Int, after: String): RepositoryConnection!
    members(first: Int, after: String): UserConnection!
  }

  type Repository {
    id: ID!
    name: String!
    fullName: String!
    description: String
    owner: RepositoryOwner!
    private: Boolean!
    visibility: RepositoryVisibility!
    fork: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
    pushedAt: DateTime
    size: Int!
    stargazersCount: Int!
    watchersCount: Int!
    forksCount: Int!
    openIssuesCount: Int!
    defaultBranch: String!
    hasIssues: Boolean!
    hasWiki: Boolean!
    hasProjects: Boolean!
    archived: Boolean!
    disabled: Boolean!
    cloneUrl: String!
    sshUrl: String!
    htmlUrl: String!
    url: String!
    commits(first: Int, after: String): CommitConnection!
    branches(first: Int, after: String): BranchConnection!
    tags(first: Int, after: String): TagConnection!
    webhooks(first: Int, after: String): WebhookConnection!
  }

  union RepositoryOwner = User | Organization

  enum RepositoryVisibility {
    PUBLIC
    PRIVATE
    INTERNAL
  }

  type Commit {
    id: ID!
    sha: String!
    message: String!
    author: GitActor!
    committer: GitActor!
    authoredDate: DateTime!
    committedDate: DateTime!
    repository: Repository!
    url: String!
    parents: [Commit!]!
  }

  type GitActor {
    name: String!
    email: String!
    date: DateTime!
    user: User
  }

  type Branch {
    id: ID!
    name: String!
    commit: Commit!
    protected: Boolean!
    repository: Repository!
  }

  type Tag {
    id: ID!
    name: String!
    commit: Commit!
    repository: Repository!
  }

  type Webhook {
    id: ID!
    name: String!
    active: Boolean!
    events: [String!]!
    config: JSON!
    createdAt: DateTime!
    updatedAt: DateTime!
    repository: Repository!
  }

  # Connection types for pagination
  type RepositoryConnection {
    edges: [RepositoryEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type RepositoryEdge {
    node: Repository!
    cursor: String!
  }

  type UserConnection {
    edges: [UserEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type UserEdge {
    node: User!
    cursor: String!
  }

  type OrganizationConnection {
    edges: [OrganizationEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type OrganizationEdge {
    node: Organization!
    cursor: String!
  }

  type CommitConnection {
    edges: [CommitEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type CommitEdge {
    node: Commit!
    cursor: String!
  }

  type BranchConnection {
    edges: [BranchEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BranchEdge {
    node: Branch!
    cursor: String!
  }

  type TagConnection {
    edges: [TagEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TagEdge {
    node: Tag!
    cursor: String!
  }

  type WebhookConnection {
    edges: [WebhookEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type WebhookEdge {
    node: Webhook!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Query root
  type Query {
    viewer: User
    user(login: String!): User
    organization(login: String!): Organization
    repository(owner: String!, name: String!): Repository
    repositories(
      first: Int
      after: String
      orderBy: RepositoryOrder
      affiliations: [RepositoryAffiliation!]
      visibility: RepositoryVisibility
    ): RepositoryConnection!
    search(query: String!, type: SearchType!, first: Int, after: String): SearchResultItemConnection!
  }

  # Mutation root
  type Mutation {
    createRepository(input: CreateRepositoryInput!): CreateRepositoryPayload!
    updateRepository(input: UpdateRepositoryInput!): UpdateRepositoryPayload!
    deleteRepository(input: DeleteRepositoryInput!): DeleteRepositoryPayload!
    createWebhook(input: CreateWebhookInput!): CreateWebhookPayload!
    updateWebhook(input: UpdateWebhookInput!): UpdateWebhookPayload!
    deleteWebhook(input: DeleteWebhookInput!): DeleteWebhookPayload!
  }

  # Input types
  input CreateRepositoryInput {
    name: String!
    description: String
    visibility: RepositoryVisibility!
    autoInit: Boolean
    gitignoreTemplate: String
    licenseTemplate: String
    defaultBranch: String
    organizationId: ID
  }

  input UpdateRepositoryInput {
    repositoryId: ID!
    name: String
    description: String
    visibility: RepositoryVisibility
    defaultBranch: String
    hasIssues: Boolean
    hasWiki: Boolean
    hasProjects: Boolean
    archived: Boolean
  }

  input DeleteRepositoryInput {
    repositoryId: ID!
  }

  input CreateWebhookInput {
    repositoryId: ID!
    name: String!
    config: JSON!
    events: [String!]!
    active: Boolean
  }

  input UpdateWebhookInput {
    webhookId: ID!
    name: String
    config: JSON
    events: [String!]
    active: Boolean
  }

  input DeleteWebhookInput {
    webhookId: ID!
  }

  # Payload types
  type CreateRepositoryPayload {
    repository: Repository
    errors: [UserError!]
  }

  type UpdateRepositoryPayload {
    repository: Repository
    errors: [UserError!]
  }

  type DeleteRepositoryPayload {
    success: Boolean!
    errors: [UserError!]
  }

  type CreateWebhookPayload {
    webhook: Webhook
    errors: [UserError!]
  }

  type UpdateWebhookPayload {
    webhook: Webhook
    errors: [UserError!]
  }

  type DeleteWebhookPayload {
    success: Boolean!
    errors: [UserError!]
  }

  type UserError {
    field: String!
    message: String!
  }

  # Enums
  enum RepositoryOrder {
    CREATED
    UPDATED
    PUSHED
    NAME
    STARGAZERS
  }

  enum RepositoryAffiliation {
    OWNER
    COLLABORATOR
    ORGANIZATION_MEMBER
  }

  enum SearchType {
    REPOSITORY
    USER
    ORGANIZATION
  }

  # Search result types
  union SearchResultItem = Repository | User | Organization

  type SearchResultItemConnection {
    edges: [SearchResultItemEdge!]!
    pageInfo: PageInfo!
    repositoryCount: Int!
    userCount: Int!
    organizationCount: Int!
  }

  type SearchResultItemEdge {
    node: SearchResultItem!
    cursor: String!
  }
`

/**
 * API Version Configuration
 */
export const API_VERSIONS = {
  v1: {
    version: "2024-01-01",
    deprecated: false,
    sunset_date: null,
  },
  v2: {
    version: "2024-06-01",
    deprecated: false,
    sunset_date: null,
  },
} as const

/**
 * Rate Limiting Configuration
 */
export const RATE_LIMITS = {
  authenticated: {
    requests_per_hour: 5000,
    search_requests_per_minute: 30,
    graphql_requests_per_hour: 5000,
  },
  unauthenticated: {
    requests_per_hour: 60,
    search_requests_per_minute: 10,
    graphql_requests_per_hour: 0,
  },
} as const
