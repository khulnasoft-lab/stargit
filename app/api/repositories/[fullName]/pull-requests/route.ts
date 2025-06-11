import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const state = searchParams.get("state") || "open"
    const sort = searchParams.get("sort") || "created"
    const search = searchParams.get("search")

    // Check read access
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    // Mock pull request data
    const mockPullRequests = [
      {
        id: "1",
        number: 1,
        title: "Add new authentication system",
        body: "This PR implements a new authentication system with OAuth support.",
        state: "open",
        author: {
          username: "johndoe",
          avatar_url: "/placeholder.svg?height=40&width=40",
        },
        created_at: "2024-01-15T10:30:00Z",
        updated_at: "2024-01-20T14:22:00Z",
        head_branch: "feature/auth-system",
        base_branch: "main",
        comments_count: 5,
        commits_count: 12,
        additions: 245,
        deletions: 89,
        changed_files: 8,
        mergeable: true,
        draft: false,
        labels: [
          { name: "enhancement", color: "84cc16" },
          { name: "security", color: "dc2626" },
        ],
        assignees: [
          {
            username: "janedoe",
            avatar_url: "/placeholder.svg?height=40&width=40",
          },
        ],
        reviewers: [
          {
            username: "reviewer1",
            avatar_url: "/placeholder.svg?height=40&width=40",
            state: "approved",
          },
        ],
      },
      {
        id: "2",
        number: 2,
        title: "Fix bug in user registration",
        body: "Fixes the validation issue in user registration form.",
        state: "open",
        author: {
          username: "janedoe",
          avatar_url: "/placeholder.svg?height=40&width=40",
        },
        created_at: "2024-01-18T09:15:00Z",
        updated_at: "2024-01-19T16:45:00Z",
        head_branch: "bugfix/registration",
        base_branch: "main",
        comments_count: 2,
        commits_count: 3,
        additions: 45,
        deletions: 12,
        changed_files: 2,
        mergeable: true,
        draft: true,
        labels: [{ name: "bug", color: "dc2626" }],
        assignees: [],
        reviewers: [],
      },
    ].filter((pr) => state === "all" || pr.state === state)

    return NextResponse.json({
      pull_requests: mockPullRequests,
      total_count: mockPullRequests.length,
    })
  } catch (error) {
    console.error("Failed to fetch pull requests:", error)
    return NextResponse.json({ error: "Failed to fetch pull requests" }, { status: 500 })
  }
}
