import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    // Check read access
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    // Mock label data
    const mockLabels = [
      { name: "bug", color: "dc2626", description: "Something isn't working" },
      { name: "enhancement", color: "84cc16", description: "New feature or request" },
      { name: "documentation", color: "6366f1", description: "Improvements or additions to documentation" },
      { name: "critical", color: "7c2d12", description: "Critical priority" },
      { name: "ui", color: "3b82f6", description: "User interface" },
      { name: "security", color: "dc2626", description: "Security related" },
    ]

    return NextResponse.json({
      labels: mockLabels,
      total_count: mockLabels.length,
    })
  } catch (error) {
    console.error("Failed to fetch labels:", error)
    return NextResponse.json({ error: "Failed to fetch labels" }, { status: 500 })
  }
}
