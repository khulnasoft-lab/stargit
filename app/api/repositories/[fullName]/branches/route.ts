import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    // Check read access
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    // Mock branch data
    const mockBranches = [
      {
        name: "main",
        commit: {
          sha: "abc123def456",
          message: "Initial commit",
          author: "John Doe",
          date: "2024-01-01T00:00:00Z",
        },
        protected: true,
      },
      {
        name: "develop",
        commit: {
          sha: "def456ghi789",
          message: "Add development features",
          author: "Jane Doe",
          date: "2024-01-15T10:30:00Z",
        },
        protected: false,
      },
      {
        name: "feature/auth-system",
        commit: {
          sha: "ghi789jkl012",
          message: "Implement OAuth authentication",
          author: "John Doe",
          date: "2024-01-20T14:22:00Z",
        },
        protected: false,
      },
    ]

    return NextResponse.json({
      branches: mockBranches,
      total_count: mockBranches.length,
    })
  } catch (error) {
    console.error("Failed to fetch branches:", error)
    return NextResponse.json({ error: "Failed to fetch branches" }, { status: 500 })
  }
}
