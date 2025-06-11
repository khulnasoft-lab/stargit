"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Star, GitFork, Eye, Bug, GitBranch, Download, Code, Lock, Globe, Users } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  visibility: "public" | "private" | "internal"
  default_branch: string
  stars_count: number
  forks_count: number
  watchers_count: number
  open_issues_count: number
  owner: {
    username: string
    avatar_url: string | null
  }
  language: string | null
  created_at: string
  updated_at: string
}

interface RepositoryHeaderProps {
  repository: Repository
}

export function RepositoryHeader({ repository }: RepositoryHeaderProps) {
  const [isStarred, setIsStarred] = useState(false)
  const [isWatching, setIsWatching] = useState(false)
  const { toast } = useToast()

  const handleStar = async () => {
    try {
      // API call to star/unstar repository
      setIsStarred(!isStarred)
      toast({
        title: isStarred ? "Repository unstarred" : "Repository starred",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update star status",
        variant: "destructive",
      })
    }
  }

  const handleWatch = async () => {
    try {
      // API call to watch/unwatch repository
      setIsWatching(!isWatching)
      toast({
        title: isWatching ? "Stopped watching" : "Now watching",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update watch status",
        variant: "destructive",
      })
    }
  }

  const handleFork = async () => {
    try {
      // API call to fork repository
      toast({
        title: "Repository forked successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fork repository",
        variant: "destructive",
      })
    }
  }

  const getVisibilityIcon = () => {
    switch (repository.visibility) {
      case "private":
        return <Lock className="h-4 w-4" />
      case "internal":
        return <Users className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  const cloneUrl = `https://git.example.com/${repository.full_name}.git`
  const sshUrl = `git@git.example.com:${repository.full_name}.git`

  return (
    <div className="border-b pb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={repository.owner.avatar_url || undefined} />
            <AvatarFallback>{repository.owner.username[0].toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">
                <Link href={`/${repository.owner.username}`} className="hover:underline">
                  {repository.owner.username}
                </Link>
                <span className="text-muted-foreground"> / </span>
                <span>{repository.name}</span>
              </h1>
              <div className="flex items-center space-x-1">
                {getVisibilityIcon()}
                <Badge variant="outline">{repository.visibility}</Badge>
              </div>
            </div>
            {repository.description && <p className="text-muted-foreground mt-1">{repository.description}</p>}
            <div className="flex items-center space-x-4 mt-2 text-sm text-muted-foreground">
              {repository.language && (
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span>{repository.language}</span>
                </div>
              )}
              <span>Updated {new Date(repository.updated_at).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={handleWatch}>
            <Eye className="h-4 w-4 mr-1" />
            {isWatching ? "Unwatch" : "Watch"}
            <Badge variant="secondary" className="ml-1">
              {repository.watchers_count}
            </Badge>
          </Button>

          <Button variant="outline" size="sm" onClick={handleStar}>
            <Star className={`h-4 w-4 mr-1 ${isStarred ? "fill-current" : ""}`} />
            {isStarred ? "Starred" : "Star"}
            <Badge variant="secondary" className="ml-1">
              {repository.stars_count}
            </Badge>
          </Button>

          <Button variant="outline" size="sm" onClick={handleFork}>
            <GitFork className="h-4 w-4 mr-1" />
            Fork
            <Badge variant="secondary" className="ml-1">
              {repository.forks_count}
            </Badge>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Code className="h-4 w-4 mr-2" />
                Code
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-3">
                <h4 className="font-medium mb-2">Clone this repository</h4>
                <div className="space-y-2">
                  <div>
                    <label className="text-sm font-medium">HTTPS</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input
                        type="text"
                        value={cloneUrl}
                        readOnly
                        className="flex-1 px-2 py-1 text-sm border rounded"
                      />
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(cloneUrl)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">SSH</label>
                    <div className="flex items-center space-x-2 mt-1">
                      <input type="text" value={sshUrl} readOnly className="flex-1 px-2 py-1 text-sm border rounded" />
                      <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(sshUrl)}>
                        Copy
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <Download className="h-4 w-4 mr-2" />
                Download ZIP
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex items-center space-x-6 mt-4 text-sm">
        <div className="flex items-center space-x-1">
          <GitBranch className="h-4 w-4" />
          <span className="font-medium">{repository.default_branch}</span>
        </div>
        <div className="flex items-center space-x-1">
          <Bug className="h-4 w-4" />
          <span>{repository.open_issues_count} issues</span>
        </div>
      </div>
    </div>
  )
}
