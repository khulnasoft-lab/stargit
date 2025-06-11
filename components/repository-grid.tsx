"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GitBranch, Star, GitFork, Clock, Lock, Globe, Users } from "lucide-react"
import Link from "next/link"
import { useRepositories } from "@/hooks/use-repositories"

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  visibility: "public" | "private" | "internal"
  default_branch: string
  stars_count: number
  forks_count: number
  updated_at: string
  language: string | null
  owner: {
    username: string
    avatar_url: string | null
  }
  organization?: {
    name: string
    avatar_url: string | null
  }
}

export function RepositoryGrid() {
  const { repositories, loading, error } = useRepositories()

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Failed to load repositories</p>
        </CardContent>
      </Card>
    )
  }

  if (!repositories.length) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <GitBranch className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No repositories yet</h3>
            <p className="text-muted-foreground">Get started by creating your first repository.</p>
            <Button className="mt-4" asChild>
              <Link href="/repositories/new">Create Repository</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Card key={repo.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base">
                  <Link href={`/${repo.full_name}`} className="hover:underline">
                    {repo.name}
                  </Link>
                </CardTitle>
                <CardDescription className="text-sm">{repo.organization?.name || repo.owner.username}</CardDescription>
              </div>
              <div className="flex items-center space-x-1">
                {repo.visibility === "private" && <Lock className="h-3 w-3 text-muted-foreground" />}
                {repo.visibility === "public" && <Globe className="h-3 w-3 text-muted-foreground" />}
                {repo.visibility === "internal" && <Users className="h-3 w-3 text-muted-foreground" />}
                <Badge variant="outline" className="text-xs">
                  {repo.visibility}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {repo.description && <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{repo.description}</p>}

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center space-x-4">
                {repo.language && (
                  <div className="flex items-center space-x-1">
                    <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                    <span>{repo.language}</span>
                  </div>
                )}
                <div className="flex items-center space-x-1">
                  <Star className="h-3 w-3" />
                  <span>{repo.stars_count}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <GitFork className="h-3 w-3" />
                  <span>{repo.forks_count}</span>
                </div>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="h-3 w-3" />
                <span>{new Date(repo.updated_at).toLocaleDateString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
