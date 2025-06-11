import { type NextRequest, NextResponse } from "next/server"
import { SubmoduleManager } from "@/lib/git/submodule-manager"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    const submodules = await SubmoduleManager.listSubmodules(decodeURIComponent(params.fullName))
    return NextResponse.json({ submodules })
  } catch (error) {
    console.error("Failed to list submodules:", error)
    return NextResponse.json({ error: "Failed to list submodules" }, { status: 500 })
  }
}

export async function POST(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const body = await request.json()
    const { url, path, branch } = body

    const result = await SubmoduleManager.addSubmodule(decodeURIComponent(params.fullName), {
      url,
      path,
      branch,
      userId: auth.user.id,
    })

    return NextResponse.json({ submodule: result })
  } catch (error) {
    console.error("Failed to add submodule:", error)
    return NextResponse.json({ error: "Failed to add submodule" }, { status: 500 })
  }
}
