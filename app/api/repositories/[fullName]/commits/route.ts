import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const ref = searchParams.get("ref") || "main"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const perPage = Number.parseInt(searchParams.get("per_page") || "30")
    const search = searchParams.get("search")

    // Check read access
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    // Mock commit data - in production, this would fetch from Git
    const mockCommits = Array.from({ length: perPage }, (_, i) => ({
      sha: `${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`,
      message: `Commit message ${(page - 1) * perPage + i + 1}`,
      author: {
        name: "John Doe",
        email: "john@example.com",
        avatar_url: "/placeholder.svg?height=40&width=40",
      },
      committer: {
        name: "John Doe",
        email: "john@example.com",
        date: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      stats: {
        additions: Math.floor(Math.random() * 100),
        deletions: Math.floor(Math.random() * 50),
        total: Math.floor(Math.random() * 150),
      },
      parents: [],
      verified: Math.random() > 0.5,
    }))

    return NextResponse.json({
      commits: mockCommits,
      has_more: page < 5, // Mock pagination
      total_count: 150,
    })
  } catch (error) {
    console.error("Failed to fetch commits:", error)
    return NextResponse.json({ error: "Failed to fetch commits" }, { status: 500 })
  }
}
