import { type NextRequest, NextResponse } from "next/server"
import { GitProtocolHandler } from "@/lib/git/protocol-handler"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { logger } from "@/lib/logging/structured-logger"

export async function POST(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  const startTime = Date.now()
  const { owner, repo } = params
  const repository = `${owner}/${repo}`

  try {
    // Authenticate request (optional for public repos)
    const auth = await AuthMiddleware.authenticate(request)

    // Check read permissions
    if (auth) {
      await AuthMiddleware.requireRepositoryPermission(request, repository, "read")
    }

    // Get request body
    const requestBody = Buffer.from(await request.arrayBuffer())

    // Initialize protocol handler
    const protocolHandler = new GitProtocolHandler(process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories")

    // Handle upload-pack operation
    const result = await protocolHandler.handleUploadPack(requestBody, repository, auth?.user?.username || "anonymous")

    // Log operation
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("upload-pack", repository, auth?.user?.username || "anonymous", duration, true, {
      objectCount: result.stats.objectCount,
      packSize: result.stats.packSize,
      compression: result.stats.compression,
    })

    return new NextResponse(result.data, {
      headers: {
        "Content-Type": "application/x-git-upload-pack-result",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("upload-pack", repository, "unknown", duration, false, {
      error: (error as Error).message,
    })

    return NextResponse.json({ error: "Upload pack operation failed" }, { status: 500 })
  }
}
