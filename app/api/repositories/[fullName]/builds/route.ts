import { type NextRequest, NextResponse } from "next/server"
import { CIManager } from "@/lib/ci-cd/ci-manager"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    const { searchParams } = new URL(request.url)
    const branch = searchParams.get("branch")
    const status = searchParams.get("status")
    const page = Number.parseInt(searchParams.get("page") || "1")

    const builds = await CIManager.getBuilds(decodeURIComponent(params.fullName), {
      branch,
      status,
      page,
      perPage: 20,
    })

    return NextResponse.json({ builds })
  } catch (error) {
    console.error("Failed to fetch builds:", error)
    return NextResponse.json({ error: "Failed to fetch builds" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const body = await request.json()
    const { branch, commitSha, pipelineId } = body

    const build = await CIManager.triggerBuild(decodeURIComponent(params.fullName), {
      branch,
      commitSha,
      pipelineId,
      userId: auth.user.id,
    })

    return NextResponse.json({ build })
  } catch (error) {
    console.error("Failed to trigger build:", error)
    return NextResponse.json({ error: "Failed to trigger build" }, { status: 500 })
  }
}
