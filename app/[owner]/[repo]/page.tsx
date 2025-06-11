import { RepositoryHeader } from "@/components/repository-header"
import { RepositoryTabs } from "@/components/repository-tabs"
import { FileBrowser } from "@/components/file-browser"
import { CommitHistory } from "@/components/commit-history"
import { PullRequestsTab } from "@/components/pull-requests-tab"
import { IssuesTab } from "@/components/issues-tab"
import { SettingsTab } from "@/components/settings-tab"
import { notFound } from "next/navigation"

interface RepositoryPageProps {
  params: {
    owner: string
    repo: string
  }
  searchParams: {
    tab?: string
    path?: string
    ref?: string
  }
}

export default async function RepositoryPage({ params, searchParams }: RepositoryPageProps) {
  const { owner, repo } = await params
  const { tab = "code", path = "", ref = "main" } = await searchParams

  // In a real app, fetch repository data here
  const repository = {
    id: "1",
    name: repo,
    full_name: `${owner}/${repo}`,
    description: "A sample repository for demonstration",
    visibility: "public" as const,
    default_branch: "main",
    stars_count: 42,
    forks_count: 12,
    watchers_count: 8,
    open_issues_count: 3,
    owner: {
      username: owner,
      avatar_url: "/placeholder.svg?height=40&width=40",
    },
    created_at: "2023-01-15T10:30:00Z",
    updated_at: "2023-06-10T14:22:15Z",
    pushed_at: "2023-06-10T14:22:15Z",
    language: "TypeScript",
    has_issues: true,
    has_projects: true,
    has_wiki: true,
  }

  if (!repository) {
    notFound()
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <RepositoryHeader repository={repository} />
      <RepositoryTabs activeTab={tab} repository={repository} />

      <div className="mt-6">
        {tab === "code" && <FileBrowser repository={repository} path={path} gitRef={ref} />}
        {tab === "commits" && <CommitHistory repository={repository} gitRef={ref} />}
        {tab === "pull-requests" && <PullRequestsTab repository={repository} />}
        {tab === "issues" && <IssuesTab repository={repository} />}
        {tab === "settings" && <SettingsTab repository={repository} />}
      </div>
    </div>
  )
}
