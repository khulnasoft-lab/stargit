"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { GitCommit, Search, Calendar, User, Hash, GitBranch, Copy, ExternalLink, Filter, Shield } from "lucide-react"
import Link from "next/link"

interface Commit {
  sha: string
  message: string
  author: {
    name: string
    email: string
    avatar_url?: string
  }
  committer: {
    name: string
    email: string
    date: string
  }
  stats: {
    additions: number
    deletions: number
    total: number
  }
  parents: string[]
  verified: boolean
}

interface Repository {
  id: string
  name: string
  full_name: string
  default_branch: string
}

interface CommitHistoryProps {
  repository: Repository
  gitRef: string
}

export function CommitHistory({ repository, gitRef }: CommitHistoryProps) {
  const [commits, setCommits] = useState<Commit[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedBranch, setSelectedBranch] = useState(gitRef)
  const [branches, setBranches] = useState<string[]>([])
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchCommits()
    fetchBranches()
  }, [repository.full_name, selectedBranch, searchQuery])

  const fetchCommits = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1)
      const params = new URLSearchParams({
        ref: selectedBranch,
        page: pageNum.toString(),
        per_page: "30",
        ...(searchQuery && { search: searchQuery }),
      })

      const response = await fetch(`/api/repositories/${encodeURIComponent(repository.full_name)}/commits?${params}`)
      if (!response.ok) throw new Error("Failed to fetch commits")

      const data = await response.json()

      if (pageNum === 1) {
        setCommits(data.commits || [])
      } else {
        setCommits((prev) => [...prev, ...(data.commits || [])])
      }

      setHasMore(data.has_more || false)
      setPage(pageNum)
    } catch (error) {
      console.error("Failed to fetch commits:", error)
      toast({
        title: "Error",
        description: "Failed to load commit history",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchBranches = async () => {
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repository.full_name)}/branches`)
      if (!response.ok) throw new Error("Failed to fetch branches")

      const data = await response.json()
      setBranches(data.branches?.map((b: any) => b.name) || [])
    } catch (error) {
      console.error("Failed to fetch branches:", error)
    }
  }

  const handleLoadMore = () => {
    if (!loading && hasMore) {
      fetchCommits(page + 1)
    }
  }

  const handleCopyCommitSha = (sha: string) => {
    navigator.clipboard.writeText(sha)
    toast({
      title: "Copied",
      description: "Commit SHA copied to clipboard",
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getCommitMessageTitle = (message: string) => {
    return message.split("\n")[0]
  }

  const getCommitMessageBody = (message: string) => {
    const lines = message.split("\n")
    return lines.length > 1 ? lines.slice(2).join("\n") : ""
  }

  if (loading && commits.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-muted rounded-full"></div>
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
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <GitCommit className="h-5 w-5" />
              Commit History
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={selectedBranch} onValueChange={setSelectedBranch}>
                <SelectTrigger className="w-40">
                  <GitBranch className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((branch) => (
                    <SelectItem key={branch} value={branch}>
                      {branch}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search commits..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline" size="icon">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Commit List */}
      <Card>
        <CardContent className="p-0">
          {commits.length === 0 ? (
            <div className="text-center py-8">
              <GitCommit className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No commits found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? "No commits match your search criteria" : "This branch has no commits yet"}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {commits.map((commit, index) => (
                <div key={commit.sha} className={`p-4 hover:bg-muted/50 ${index === 0 ? "" : "border-t"}`}>
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarImage src={commit.author.avatar_url || "/placeholder.svg"} alt={commit.author.name} />
                      <AvatarFallback>
                        {commit.author.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <Link
                            href={`/${repository.full_name}/commit/${commit.sha}`}
                            className="font-medium hover:underline block"
                          >
                            {getCommitMessageTitle(commit.message)}
                          </Link>
                          {getCommitMessageBody(commit.message) && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {getCommitMessageBody(commit.message)}
                            </p>
                          )}
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {commit.author.name}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(commit.committer.date)}
                            </span>
                            {commit.verified && (
                              <Badge variant="secondary" className="text-xs">
                                <Shield className="h-3 w-3 mr-1" />
                                Verified
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <div className="text-right text-sm">
                            <div className="text-green-600">+{commit.stats.additions}</div>
                            <div className="text-red-600">-{commit.stats.deletions}</div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyCommitSha(commit.sha)}
                              className="font-mono text-xs"
                            >
                              <Hash className="h-3 w-3 mr-1" />
                              {commit.sha.substring(0, 7)}
                              <Copy className="h-3 w-3 ml-1" />
                            </Button>
                            <Button variant="ghost" size="sm" asChild>
                              <Link href={`/${repository.full_name}/commit/${commit.sha}`}>
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {hasMore && commits.length > 0 && (
            <div className="p-4 border-t text-center">
              <Button variant="outline" onClick={handleLoadMore} disabled={loading}>
                {loading ? "Loading..." : "Load More Commits"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
