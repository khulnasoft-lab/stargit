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
import {
  Bug,
  Plus,
  Search,
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Lightbulb,
  HelpCircle,
} from "lucide-react"
import Link from "next/link"

interface Issue {
  id: string
  number: number
  title: string
  body: string
  state: "open" | "closed"
  author: {
    username: string
    avatar_url: string
  }
  created_at: string
  updated_at: string
  closed_at?: string
  comments_count: number
  labels: Array<{
    name: string
    color: string
    description?: string
  }>
  assignees: Array<{
    username: string
    avatar_url: string
  }>
  milestone?: {
    title: string
    due_on?: string
  }
  priority: "low" | "medium" | "high" | "critical"
  type: "bug" | "feature" | "enhancement" | "question" | "documentation"
}

interface Repository {
  id: string
  name: string
  full_name: string
}

interface IssuesTabProps {
  repository: Repository
}

export function IssuesTab({ repository }: IssuesTabProps) {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("open")
  const [labelFilter, setLabelFilter] = useState("all")
  const [sortBy, setSortBy] = useState("created")
  const [labels, setLabels] = useState<Array<{ name: string; color: string }>>([])
  const { toast } = useToast()

  useEffect(() => {
    fetchIssues()
    fetchLabels()
  }, [repository.full_name, statusFilter, labelFilter, sortBy, searchQuery])

  const fetchIssues = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        state: statusFilter,
        sort: sortBy,
        ...(searchQuery && { search: searchQuery }),
        ...(labelFilter !== "all" && { labels: labelFilter }),
      })

      const response = await fetch(`/api/repositories/${encodeURIComponent(repository.full_name)}/issues?${params}`)
      if (!response.ok) throw new Error("Failed to fetch issues")

      const data = await response.json()
      setIssues(data.issues || [])
    } catch (error) {
      console.error("Failed to fetch issues:", error)
      toast({
        title: "Error",
        description: "Failed to load issues",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchLabels = async () => {
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repository.full_name)}/labels`)
      if (!response.ok) throw new Error("Failed to fetch labels")

      const data = await response.json()
      setLabels(data.labels || [])
    } catch (error) {
      console.error("Failed to fetch labels:", error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "bug":
        return <Bug className="h-4 w-4 text-red-600" />
      case "feature":
      case "enhancement":
        return <Lightbulb className="h-4 w-4 text-blue-600" />
      case "question":
        return <HelpCircle className="h-4 w-4 text-purple-600" />
      default:
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "critical":
        return (
          <Badge variant="destructive" className="text-xs">
            Critical
          </Badge>
        )
      case "high":
        return <Badge className="bg-orange-100 text-orange-800 text-xs">High</Badge>
      case "medium":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">Medium</Badge>
      case "low":
        return (
          <Badge variant="secondary" className="text-xs">
            Low
          </Badge>
        )
      default:
        return null
    }
  }

  const getStatusIcon = (state: string) => {
    switch (state) {
      case "open":
        return <AlertTriangle className="h-4 w-4 text-green-600" />
      case "closed":
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      default:
        return <XCircle className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    })
  }

  const openCount = issues.filter((issue) => issue.state === "open").length
  const closedCount = issues.filter((issue) => issue.state === "closed").length

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
              <Bug className="h-5 w-5" />
              Issues
            </CardTitle>
            <Button asChild>
              <Link href={`/${repository.full_name}/issues/new`}>
                <Plus className="h-4 w-4 mr-2" />
                New Issue
              </Link>
            </Button>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search issues..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={labelFilter} onValueChange={setLabelFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Labels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All labels</SelectItem>
                {labels.map((label) => (
                  <SelectItem key={label.name} value={label.name}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: `#${label.color}` }} />
                      {label.name}
                    </div>
                  </SelectItem>
                ))}
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
                <SelectItem value="priority">Priority</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Status Tabs */}
          <Tabs value={statusFilter} onValueChange={setStatusFilter}>
            <TabsList>
              <TabsTrigger value="open" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Open ({openCount})
              </TabsTrigger>
              <TabsTrigger value="closed" className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Closed ({closedCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>

      {/* Issues List */}
      <Card>
        <CardContent className="p-0">
          {issues.length === 0 ? (
            <div className="text-center py-8">
              <Bug className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No issues found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No issues match your search criteria" : "There are no issues for this repository yet"}
              </p>
              <Button asChild>
                <Link href={`/${repository.full_name}/issues/new`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create the first issue
                </Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {issues.map((issue) => (
                <div key={issue.id} className="p-4 hover:bg-muted/50">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusIcon(issue.state)}</div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getTypeIcon(issue.type)}
                            <Link
                              href={`/${repository.full_name}/issues/${issue.number}`}
                              className="font-medium hover:underline"
                            >
                              {issue.title}
                            </Link>
                            {getPriorityBadge(issue.priority)}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <span>#{issue.number}</span>
                            <span>opened {formatDate(issue.created_at)}</span>
                            <span className="flex items-center gap-1">
                              by
                              <Avatar className="h-4 w-4">
                                <AvatarImage src={issue.author.avatar_url || "/placeholder.svg"} />
                                <AvatarFallback>{issue.author.username[0]}</AvatarFallback>
                              </Avatar>
                              {issue.author.username}
                            </span>
                            {issue.milestone && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {issue.milestone.title}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {issue.comments_count}
                            </span>
                            {issue.closed_at && <span>closed {formatDate(issue.closed_at)}</span>}
                          </div>

                          {issue.labels.length > 0 && (
                            <div className="flex items-center gap-1 mt-2">
                              {issue.labels.map((label) => (
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
                          {issue.assignees.length > 0 && (
                            <div className="flex -space-x-1">
                              {issue.assignees.slice(0, 3).map((assignee) => (
                                <Avatar key={assignee.username} className="h-6 w-6 border-2 border-background">
                                  <AvatarImage src={assignee.avatar_url || "/placeholder.svg"} />
                                  <AvatarFallback className="text-xs">{assignee.username[0]}</AvatarFallback>
                                </Avatar>
                              ))}
                              {issue.assignees.length > 3 && (
                                <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                                  +{issue.assignees.length - 3}
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
