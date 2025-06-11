import { type NextRequest, NextResponse } from "next/server"
import { gitSmartHTTPServer } from "@/lib/git/smart-http-server"

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGitRequest(request)
}

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  return handleGitRequest(request)
}

async function handleGitRequest(request: NextRequest) {
  try {
    // Convert NextRequest to Node.js IncomingMessage format
    const req = {
      url: request.url.replace(request.nextUrl.origin, "").replace("/api/git/smart-http", ""),
      method: request.method,
      headers: Object.fromEntries(request.headers.entries()),
      pipe: (destination: any) => {
        // Handle request body streaming
        if (request.body) {
          const reader = request.body.getReader()
          const pump = async () => {
            try {
              while (true) {
                const { done, value } = await reader.read()
                if (done) break
                destination.write(value)
              }
              destination.end()
            } catch (error) {
              destination.destroy(error)
            }
          }
          pump()
        } else {
          destination.end()
        }
      },
    } as any

    // Create response stream
    const responseStream = new ReadableStream({
      start(controller) {
        const res = {
          statusCode: 200,
          headers: {} as Record<string, string>,
          setHeader: (name: string, value: string) => {
            res.headers[name] = value
          },
          write: (chunk: any) => {
            controller.enqueue(new Uint8Array(chunk))
          },
          end: (chunk?: any) => {
            if (chunk) {
              controller.enqueue(new Uint8Array(chunk))
            }
            controller.close()
          },
        } as any

        // Handle the Git request
        gitSmartHTTPServer.handleRequest(req, res).catch((error) => {
          console.error("Git Smart HTTP error:", error)
          controller.error(error)
        })
      },
    })

    return new Response(responseStream, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Cache-Control": "no-cache",
      },
    })
  } catch (error) {
    console.error("Git Smart HTTP route error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
