import { type NextRequest, NextResponse } from "next/server"
import { GitProtocolHandler } from "@/lib/git/protocol-handler"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { logger } from "@/lib/logging/structured-logger"

export async function GET(request: NextRequest, { params }: { params: { owner: string; repo: string } }) {
  const startTime = Date.now()
  const { owner, repo } = params
  const repository = `${owner}/${repo}`

  try {
    // Get service parameter
    const service = request.nextUrl.searchParams.get("service")

    if (!service || !["git-upload-pack", "git-receive-pack"].includes(service)) {
      return NextResponse.json({ error: "Invalid service" }, { status: 400 })
    }

    // Authenticate request
    const auth = await AuthMiddleware.authenticate(request)

    if (!auth && service === "git-receive-pack") {
      return NextResponse.json({ error: "Authentication required for push operations" }, { status: 401 })
    }

    // Check permissions
    if (auth) {
      const requiredPermission = service === "git-receive-pack" ? "write" : "read"
      const hasPermission = await AuthMiddleware.requireRepositoryPermission(request, repository, requiredPermission)

      if (!hasPermission) {
        return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
      }
    }

    // Initialize protocol handler
    const protocolHandler = new GitProtocolHandler(process.env.GIT_REPOSITORIES_PATH || "/var/git/repositories")

    // Get repository references
    const { refs, capabilities } = await protocolHandler.getReferences(repository)

    // Format response according to Git protocol
    const responseLines: string[] = []

    // Add service advertisement
    responseLines.push(`# service=${service}`)
    responseLines.push("") // Flush packet

    // Add references with capabilities
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i]
      if (i === 0) {
        // First ref includes capabilities
        responseLines.push(`${ref.objectName} ${ref.refName}\0${capabilities.join(" ")}`)
      } else {
        responseLines.push(`${ref.objectName} ${ref.refName}`)
      }
    }

    // Convert to Git packet format
    const responseData = this.formatGitResponse(responseLines)

    // Log operation
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("info-refs", repository, auth?.user?.username || "anonymous", duration, true, {
      service,
      refCount: refs.length,
    })

    return new NextResponse(responseData, {
      headers: {
        "Content-Type": `application/x-${service}-advertisement`,
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    const duration = (Date.now() - startTime) / 1000
    logger.logGitOperation("info-refs", repository, "unknown", duration, false, {
      error: (error as Error).message,
    })

    return NextResponse.json({ error: "Failed to get repository references" }, { status: 500 })
  }
}

// Helper function to format Git protocol response
function formatGitResponse(lines: string[]): Buffer {
  const packets: Buffer[] = []

  for (const line of lines) {
    if (line === "") {
      // Flush packet
      packets.push(Buffer.from("0000"))
    } else {
      // Regular packet
      const content = line + "\n"
      const length = (content.length + 4).toString(16).padStart(4, "0")
      packets.push(Buffer.from(length + content))
    }
  }

  // Final flush packet
  packets.push(Buffer.from("0000"))

  return Buffer.concat(packets)
}
