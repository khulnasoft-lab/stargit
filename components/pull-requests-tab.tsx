"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { GitPullRequest, Plus, Search, MessageSquare, GitMerge, GitBranch, XCircle } from "lucide-react"
import Link from "next/link"

interface PullRequest {
  id: string
  number: number
  title: string
  body: string
  state: "open" | "closed" | "merged"
  author: {
    username: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  merged_at?: string
  head_branch: string
  base_branch: string
  comments_count: number
  commits_count: number
  additions: number
  deletions: number
  changed_files: number
  mergeable: boolean
  draft: boolean
  labels: Array<{
    name: string
    color: string
  }>
  assignees: Array<{
    username: string
    avatar_url: string
  }>
  reviewers: Array<{
    username: string
    avatar_url: string
    state: "pending" | "approved" | "changes_requested"
  }>
}

interface Repository {
  id: string
  name: string
  full_name: string
}

interface PullRequestsTabProps {
  repository: Repository
}

export function PullRequestsTab({ repository }: PullRequestsTabProps) {
  const [pullRequests, setPullRequests] = useState<PullRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("open")
  const [sortBy, setSortBy] = useState("created")
  const { toast } = useToast()

  useEffect(() => {
    fetchPullRequests()
  }, [repository.full_name, statusFilter, sortBy, searchQuery])

  const fetchPullRequests = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        state: statusFilter,
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(
        `/api/repositories/${encodeURIComponent(repository.full_name)}/pull-requests?${params}`,
      )
      if (!response.ok) throw new Error("Failed to fetch pull requests")

      const data = await response.json()
      setPullRequests(data.pull_requests || [])
    } catch (error) {
      console.error("Failed to fetch pull requests:", error)
      toast({
        title: "Error",
        description: "Failed to load pull requests",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getStatusIcon = (state: string, merged_at?: string) => {
    if (merged_at) {
      return <GitMerge className="h-4 w-4 text-purple-600" />
    }
    switch (state) {
      case "open":
        return <GitPullRequest className="h-4 w-4 text-green-600" />
      case "closed":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <GitPullRequest className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusBadge = (state: string, merged_at?: string, draft?: boolean) => {
    if (draft) {
      return <Badge variant="secondary">Draft</Badge>
    }
    if (merged_at) {
      return <Badge className="bg-purple-100 text-purple-800">Merged</Badge>
    }
    switch (state) {
      case "open":
        return <Badge className="bg-green-100 text-green-800">Open</Badge>
      case "closed":
        return <Badge variant="destructive">Closed</Badge>
      default:
        return <Badge variant="secondary">{state}</Badge>
    }
  }

  const getReviewStatus = (reviewers: PullRequest["reviewers"]) => {
    if (reviewers.length === 0) return null

    const approved = reviewers.filter((r) => r.state === "approved").length
    const changesRequested = reviewers.filter((r) => r.state === "changes_requested").length
    const pending = reviewers.filter((r) => r.state === "pending").length

    if (changesRequested > 0) {
      return (
        <Badge variant="destructive" className="text-xs">
          Changes requested
        </Badge>
      )
    }
    if (approved > 0 && pending === 0) {
      return <Badge className="bg-green-100 text-green-800 text-xs">Approved</Badge>
    }
    if (pending > 0) {
      return (
        <Badge variant="secondary" className="text-xs">
          Review pending
        </Badge>
      )
    }
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const openCount = pullRequests.filter((pr) => pr.state === "open" && !pr.merged_at).length
  const closedCount = pullRequests.filter((pr) => pr.state === "closed" && !pr.merged_at).length
  const mergedCount = pullRequests.filter((pr) => pr.merged_at).length

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-6 h-6 bg-muted rounded"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitPullRequest className="h-5 w-5" />
              Pull Requests
            </CardTitle>
            <Button asChild>
              <Link href={`/${repository.full_name}/compare`}>
                <Plus className="h-4 w-4 mr-2" />
                New Pull Request
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search pull requests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
                <SelectItem value="merged">Merged</SelectItem>
                <SelectItem value="all">All</SelectItem>
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Recently created</SelectItem>
                <SelectItem value="updated">Recently updated</SelectItem>
                <SelectItem value="comments">Most commented</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="open" className="flex items-center gap-2">
                <GitPullRequest className="h-4 w-4" />
                Open ({openCount})
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Closed ({closedCount})
              </TabsTrigger>
              <TabsTrigger value="merged" className="flex items-center gap-2">
                <GitMerge className="h-4 w-4" />
                Merged ({mergedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Pull Request List */}
      <Card>
        <CardContent className="p-0">
          {pullRequests.length === 0 ? (
            <div className="text-center py-8">
              <GitPullRequest className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No pull requests found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "No pull requests match your search criteria"
                  : "There are no pull requests for this repository yet"}
              </p>
              <Button asChild>
                <Link href={`/${repository.full_name}/compare`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create the first pull request
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {pullRequests.map((pr) => (
                <div key={pr.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(pr.state, pr.merged_at)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Link
                              href={`/${repository.full_name}/pull/${pr.number}`}
                              className="font-medium hover:underline"
                            >
                              {pr.title}
                            </Link>
                            {getStatusBadge(pr.state, pr.merged_at, pr.draft)}
                            {getReviewStatus(pr.reviewers)}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>#{pr.number}</span>
                            <span>opened {formatDate(pr.created_at)}</span>
                            <span className="flex items-center gap-1">
                              by
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={pr.author.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{pr.author.username[0]}</AvatarFallback>
                              </Avatar>
                              {pr.author.username}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <GitBranch className="h-3 w-3" />
                              {pr.head_branch} → {pr.base_branch}
                            </span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {pr.comments_count}
                            </span>
                            <span className="text-green-600">+{pr.additions}</span>
                            <span className="text-red-600">-{pr.deletions}</span>
                            <span>{pr.changed_files} files</span>
                          </div>

                          {pr.labels.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {pr.labels.map((label) => (
                                <Badge
                                  key={label.name}
                                  variant="outline"
                                  className="text-xs"
                                  style={{
                                    borderColor: `#${label.color}`,
                                    color: `#${label.color}`,
                                  }}
                                >
                                  {label.name}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          {pr.assignees.length > 0 && (
                            <div className="flex -space-x-1">
                              {pr.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.username} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={assignee.avatar_url || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{assignee.username[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                              {pr.assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                  +{pr.assignees.length - 3}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
