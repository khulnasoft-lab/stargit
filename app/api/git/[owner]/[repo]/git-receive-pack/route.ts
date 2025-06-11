import { type NextRequest, NextResponse } from "next/server"
import { GitProtocolHandler } from "@/lib/git/protocol-handler"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { logger } from "@/lib/logging/structured-logger"

export async function POST(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  const startTime = Date.now()
  const { owner, repo } = params
  const repository = `${owner}/${repo}`

  try {
    // Authenticate request (required for push operations)
    const auth = await AuthMiddleware.requireAuth(request)

    // Check write permissions
    await AuthMiddleware.requireRepositoryPermission(request, repository, "write")

    // Get request body
    const requestBody = Buffer.from(await request.arrayBuffer())

    // Initialize protocol handler
    const protocolHandler = new GitProtocolHandler(process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories")

    // Handle receive-pack operation
    const result = await protocolHandler.handleReceivePack(requestBody, repository, auth.user.username)

    // Format response according to Git protocol
    const responseLines: string[] = []

    for (const update of result.updates) {
      if (update.success) {
        responseLines.push(`ok ${update.ref}`)
      } else {
        responseLines.push(`ng ${update.ref} ${update.error}`)
      }
    }

    const responseData = this.formatGitResponse(responseLines)

    // Log operation
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("receive-pack", repository, auth.user.username, duration, result.success, {
      objectCount: result.stats.objectCount,
      packSize: result.stats.packSize,
      updatedRefs: result.stats.updatedRefs,
    })

    return new NextResponse(responseData, {
      headers: {
        "Content-Type": "application/x-git-receive-pack-result",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("receive-pack", repository, "unknown", duration, false, {
      error: (error as Error).message,
    })

    return NextResponse.json({ error: "Receive pack operation failed" }, { status: 500 })
  }
}

// Helper function to format Git protocol response
function formatGitResponse(lines: string[]): Buffer {
  const packets: Buffer[] = []

  for (const line of lines) {
    const content = line + "\n"
    const length = (content.length + 4).toString(16).padStart(4, "0")
    packets.push(Buffer.from(length + content))
  }

  // Final flush packet
  packets.push(Buffer.from("0000"))

  return Buffer.concat(packets)
}
