import { type NextRequest, NextResponse } from "next/server"
import { RepositoriesAPI } from "@/lib/api/repositories"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const repository = await RepositoriesAPI.getByFullName(decodeURIComponent(params.fullName))

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    return NextResponse.json({ repository })
  } catch (error) {
    console.error("Failed to fetch repository:", error)
    return NextResponse.json({ error: "Failed to fetch repository" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    const body = await request.json()

    // Check if user has write access to repository
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const repository = await RepositoriesAPI.updateByFullName(decodeURIComponent(params.fullName), body)

    return NextResponse.json({ repository })
  } catch (error) {
    console.error("Failed to update repository:", error)
    return NextResponse.json({ error: "Failed to update repository" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)

    // Check if user has admin access to repository
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "admin")

    await RepositoriesAPI.deleteByFullName(decodeURIComponent(params.fullName))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to delete repository:", error)
    return NextResponse.json({ error: "Failed to delete repository" }, { status: 500 })
  }
}
