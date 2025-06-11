"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Code, GitCommit, GitPullRequest, Bug, Settings, Shield, Activity, FileText, Package } from "lucide-react"
import Link from "next/link"

interface Repository {
  id: string
  name: string
  full_name: string
  open_issues_count: number
  open_pull_requests_count?: number
  has_issues: boolean
  has_projects: boolean
  has_wiki: boolean
}

interface RepositoryTabsProps {
  repository: Repository
  activeTab: string
}

export function RepositoryTabs({ repository, activeTab }: RepositoryTabsProps) {
  const tabs = [
    {
      id: "code",
      label: "Code",
      icon: <Code className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=code`,
    },
    {
      id: "commits",
      label: "Commits",
      icon: <GitCommit className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=commits`,
    },
    {
      id: "pull-requests",
      label: "Pull Requests",
      icon: <GitPullRequest className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=pull-requests`,
      badge: repository.open_pull_requests_count || 0,
    },
    {
      id: "issues",
      label: "Issues",
      icon: <Bug className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=issues`,
      badge: repository.open_issues_count,
      show: repository.has_issues,
    },
    {
      id: "actions",
      label: "Actions",
      icon: <Activity className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=actions`,
    },
    {
      id: "projects",
      label: "Projects",
      icon: <Package className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=projects`,
      show: repository.has_projects,
    },
    {
      id: "wiki",
      label: "Wiki",
      icon: <FileText className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=wiki`,
      show: repository.has_wiki,
    },
    {
      id: "security",
      label: "Security",
      icon: <Shield className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=security`,
    },
    {
      id: "insights",
      label: "Insights",
      icon: <Activity className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=insights`,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="h-4 w-4" />,
      href: `/${repository.full_name}?tab=settings`,
    },
  ]

  const visibleTabs = tabs.filter((tab) => tab.show !== false)

  return (
    <div className="border-b">
      <div className="flex items-center space-x-1 overflow-x-auto">
        {visibleTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? "secondary" : "ghost"}
            size="sm"
            asChild
            className="flex items-center space-x-2 whitespace-nowrap"
          >
            <Link href={tab.href}>
              {tab.icon}
              <span>{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {tab.badge}
                </Badge>
              )}
            </Link>
          </Button>
        ))}
      </div>
    </div>
  )
}
