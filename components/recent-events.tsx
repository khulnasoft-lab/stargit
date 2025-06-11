import { Badge } from "@/components/ui/badge"
import { GitBranch, GitCommit, GitPullRequest, Bug } from "lucide-react"

const events = [
  {
    id: 1,
    type: "push",
    repo: "stargit",
    branch: "main",
    author: "johndoe",
    time: "2 minutes ago",
    message: "Fix bug in webhook handler",
  },
  {
    id: 2,
    type: "pull_request",
    repo: "stargit",
    branch: "feature/webhooks",
    author: "janedoe",
    time: "15 minutes ago",
    message: "Implement webhook filtering",
  },
  {
    id: 3,
    type: "issue",
    repo: "webhook-proxy",
    branch: null,
    author: "alicesmith",
    time: "1 hour ago",
    message: "Add support for custom headers",
  },
  {
    id: 4,
    type: "push",
    repo: "event-tracker",
    branch: "develop",
    author: "bobmartin",
    time: "2 hours ago",
    message: "Update dependencies",
  },
  {
    id: 5,
    type: "release",
    repo: "stargit",
    branch: null,
    author: "johndoe",
    time: "1 day ago",
    message: "v1.0.0 - First stable release",
  },
]

export function RecentEvents() {
  const getEventIcon = (type: string) => {
    switch (type) {
      case "push":
        return <GitCommit className="h-4 w-4" />
      case "pull_request":
        return <GitPullRequest className="h-4 w-4" />
      case "issue":
        return <Bug className="h-4 w-4" />
      case "release":
        return <GitBranch className="h-4 w-4" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  const getEventColor = (type: string) => {
    switch (type) {
      case "push":
        return "bg-blue-500"
      case "pull_request":
        return "bg-green-500"
      case "issue":
        return "bg-red-500"
      case "release":
        return "bg-purple-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id} className="flex items-start space-x-3">
          <div className={`p-1 rounded-full ${getEventColor(event.type)} text-white`}>{getEventIcon(event.type)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <Badge variant="outline" className="text-xs">
                {event.type}
              </Badge>
              <span className="text-sm font-medium">{event.repo}</span>
              {event.branch && <span className="text-xs text-muted-foreground">on {event.branch}</span>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
            <div className="flex items-center space-x-2 mt-1">
              <span className="text-xs text-muted-foreground">by {event.author}</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">{event.time}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
