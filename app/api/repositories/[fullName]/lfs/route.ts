import { type NextRequest, NextResponse } from "next/server"
import { LFSManager } from "@/lib/git/lfs-manager"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function POST(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const body = await request.json()
    const { operation, objects } = body

    if (operation === "upload") {
      const uploadUrls = await LFSManager.generateUploadUrls(decodeURIComponent(params.fullName), objects)
      return NextResponse.json({ objects: uploadUrls })
    } else if (operation === "download") {
      const downloadUrls = await LFSManager.generateDownloadUrls(decodeURIComponent(params.fullName), objects)
      return NextResponse.json({ objects: downloadUrls })
    }

    return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
  } catch (error) {
    console.error("LFS operation failed:", error)
    return NextResponse.json({ error: "LFS operation failed" }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "read")

    const lfsObjects = await LFSManager.listObjects(decodeURIComponent(params.fullName))
    return NextResponse.json({ objects: lfsObjects })
  } catch (error) {
    console.error("Failed to list LFS objects:", error)
    return NextResponse.json({ error: "Failed to list LFS objects" }, { status: 500 })
  }
}
