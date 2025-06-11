import { type NextRequest, NextResponse } from "next/server"
import { CIManager } from "@/lib/ci-cd/ci-manager"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    const pipelines = await CIManager.getPipelines(decodeURIComponent(params.fullName))
    return NextResponse.json({ pipelines })
  } catch (error) {
    console.error("Failed to fetch pipelines:", error)
    return NextResponse.json({ error: "Failed to fetch pipelines" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const body = await request.json()
    const { provider, config } = body

    const pipeline = await CIManager.createPipeline(decodeURIComponent(params.fullName), {
      provider,
      config,
      userId: auth.user.id,
    })

    return NextResponse.json({ pipeline })
  } catch (error) {
    console.error("Failed to create pipeline:", error)
    return NextResponse.json({ error: "Failed to create pipeline" }, { status: 500 })
  }
}
