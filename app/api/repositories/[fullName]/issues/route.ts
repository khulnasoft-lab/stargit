import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get("state") || "open"
    const sort = searchParams.get("sort") || "created"
    const labels = searchParams.get("labels")
    const search = searchParams.get("search")

    // Check read access
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    // Mock issue data
    const mockIssues = [
      {
        id: "1",
        number: 1,
        title: "Application crashes on startup",
        body: "The application crashes immediately after startup with a null pointer exception.",
        state: "open",
        author: {
          username: "user1",
          avatar_url: "/placeholder.svg?height=40&width=40",
        },
        created_at: "2024-01-10T08:30:00Z",
        updated_at: "2024-01-15T12:45:00Z",
        comments_count: 8,
        labels: [
          { name: "bug", color: "dc2626", description: "Something isn't working" },
          { name: "critical", color: "7c2d12", description: "Critical priority" },
        ],
        assignees: [
          {
            username: "developer1",
            avatar_url: "/placeholder.svg?height=40&width=40",
          },
        ],
        milestone: {
          title: "v1.0.0",
          due_on: "2024-02-01T00:00:00Z",
        },
        priority: "critical",
        type: "bug",
      },
      {
        id: "2",
        number: 2,
        title: "Add dark mode support",
        body: "Users have requested dark mode support for better accessibility.",
        state: "open",
        author: {
          username: "user2",
          avatar_url: "/placeholder.svg?height=40&width=40",
        },
        created_at: "2024-01-12T14:20:00Z",
        updated_at: "2024-01-18T09:30:00Z",
        comments_count: 3,
        labels: [
          { name: "enhancement", color: "84cc16", description: "New feature or request" },
          { name: "ui", color: "3b82f6", description: "User interface" },
        ],
        assignees: [],
        priority: "medium",
        type: "feature",
      },
      {
        id: "3",
        number: 3,
        title: "Update documentation",
        body: "The API documentation needs to be updated with the latest changes.",
        state: "closed",
        author: {
          username: "user3",
          avatar_url: "/placeholder.svg?height=40&width=40",
        },
        created_at: "2024-01-05T11:15:00Z",
        updated_at: "2024-01-16T16:20:00Z",
        closed_at: "2024-01-16T16:20:00Z",
        comments_count: 1,
        labels: [{ name: "documentation", color: "6366f1", description: "Improvements or additions to documentation" }],
        assignees: [
          {
            username: "writer1",
            avatar_url: "/placeholder.svg?height=40&width=40",
          },
        ],
        priority: "low",
        type: "documentation",
      },
    ].filter((issue) => {
      if (state !== "all" && issue.state !== state) return false
      if (labels && labels !== "all" && !issue.labels.some((label) => label.name === labels)) return false
      if (search && !issue.title.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })

    return NextResponse.json({
      issues: mockIssues,
      total_count: mockIssues.length,
    })
  } catch (error) {
    console.error("Failed to fetch issues:", error)
    return NextResponse.json({ error: "Failed to fetch issues" }, { status: 500 })
  }
}
