"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { GitCommit, GitPullRequest, GitMerge, Bug, Star, GitFork } from "lucide-react"
import Link from "next/link"
import { useActivity } from "@/hooks/use-activity"

interface ActivityItem {
  id: string
  type: "commit" | "pull_request" | "issue" | "star" | "fork" | "merge"
  actor: {
    username: string
    avatar_url: string | null
  }
  repository: {
    name: string
    full_name: string
  }
  payload: any
  created_at: string
}

export function ActivityFeed() {
  const { activities, loading, error } = useActivity()

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "commit":
        return <GitCommit className="h-4 w-4" />
      case "pull_request":
        return <GitPullRequest className="h-4 w-4" />
      case "merge":
        return <GitMerge className="h-4 w-4" />
      case "issue":
        return <Bug className="h-4 w-4" />
      case "star":
        return <Star className="h-4 w-4" />
      case "fork":
        return <GitFork className="h-4 w-4" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case "commit":
        return "text-green-600"
      case "pull_request":
        return "text-blue-600"
      case "merge":
        return "text-purple-600"
      case "issue":
        return "text-red-600"
      case "star":
        return "text-yellow-600"
      case "fork":
        return "text-gray-600"
      default:
        return "text-gray-600"
    }
  }

  const formatActivityMessage = (activity: ActivityItem) => {
    switch (activity.type) {
      case "commit":
        return `pushed ${activity.payload.commits?.length || 1} commit${activity.payload.commits?.length > 1 ? "s" : ""} to`
      case "pull_request":
        return activity.payload.action === "opened" ? "opened pull request in" : "updated pull request in"
      case "issue":
        return activity.payload.action === "opened" ? "opened issue in" : "updated issue in"
      case "star":
        return "starred"
      case "fork":
        return "forked"
      case "merge":
        return "merged pull request in"
      default:
        return "updated"
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-muted rounded w-3/4 mb-1"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Failed to load activity</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={activity.actor.avatar_url || undefined} />
                <AvatarFallback>{activity.actor.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <span className={`${getActivityColor(activity.type)}`}>{getActivityIcon(activity.type)}</span>
                  <p className="text-sm">
                    <Link href={`/${activity.actor.username}`} className="font-medium hover:underline">
                      {activity.actor.username}
                    </Link>{" "}
                    {formatActivityMessage(activity)}{" "}
                    <Link href={`/${activity.repository.full_name}`} className="font-medium hover:underline">
                      {activity.repository.name}
                    </Link>
                  </p>
                </div>
                {activity.payload.message && (
                  <p className="text-sm text-muted-foreground mt-1 truncate">{activity.payload.message}</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{new Date(activity.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
