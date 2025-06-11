import { type NextRequest, NextResponse } from "next/server"
import { RepositoriesAPI } from "@/lib/api/repositories"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    const repositories = await RepositoriesAPI.getUserRepositories(auth.user.id)

    return NextResponse.json({ repositories })
  } catch (error) {
    console.error("Error fetching repositories:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch repositories" },
      { status: error instanceof Error && error.message === "Authentication required" ? 401 : 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    const body = await request.json()

    // Validate required fields
    if (!body.name || typeof body.name !== "string") {
      return NextResponse.json({ error: "Repository name is required" }, { status: 400 })
    }

    const repository = await RepositoriesAPI.create({
      name: body.name,
      description: body.description || null,
      visibility: body.visibility || "private",
      owner_id: auth.user.id,
      has_issues: body.has_issues ?? true,
      has_wiki: body.has_wiki ?? true,
      has_projects: body.has_projects ?? true,
      default_branch: body.default_branch || "main",
    })

    return NextResponse.json({ repository }, { status: 201 })
  } catch (error) {
    console.error("Error creating repository:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create repository" },
      { status: error instanceof Error && error.message === "Authentication required" ? 401 : 500 },
    )
  }
}
