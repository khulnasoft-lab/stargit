import { type NextRequest, NextResponse } from "next/server"
import { SecurityMiddleware } from "@/lib/security/security-middleware"
import { MetricsCollector } from "@/lib/monitoring/metrics-collector"
import { StructuredLogger } from "@/lib/logging/structured-logger"

export async function middleware(request: NextRequest) {
  const startTime = Date.now()
  const logger = StructuredLogger.getInstance()
  const metrics = MetricsCollector.getInstance()

  // Generate correlation ID for request tracking
  const correlationId = logger.generateCorrelationId()
  logger.setCorrelationId(correlationId)

  // Log incoming request
  logger.info("Incoming request", {
    method: request.method,
    url: request.url,
    userAgent: request.headers.get("user-agent"),
    ip: request.ip,
  })

  try {
    // Rate limiting
    const clientId = request.ip || "unknown"
    const rateLimit = await SecurityMiddleware.checkRateLimit(request, clientId)

    if (!rateLimit.allowed) {
      logger.logSecurityEvent("rate_limit_exceeded", {
        clientId,
        remaining: rateLimit.remaining,
        resetTime: rateLimit.resetTime,
      })

      return new NextResponse("Rate limit exceeded", {
        status: 429,
        headers: {
          "X-RateLimit-Remaining": rateLimit.remaining.toString(),
          "X-RateLimit-Reset": rateLimit.resetTime.toString(),
        },
      })
    }

    // Continue with request
    const response = NextResponse.next()

    // Apply security headers
    SecurityMiddleware.applySecurityHeaders(response)

    // Add correlation ID to response
    response.headers.set("X-Correlation-ID", correlationId)

    // Record metrics
    const duration = (Date.now() - startTime) / 1000
    const pathname = new URL(request.url).pathname

    metrics.recordHTTPRequest(request.method, pathname, response.status, duration)

    // Log response
    logger.info("Request completed", {
      method: request.method,
      url: request.url,
      status: response.status,
      duration,
    })

    return response
  } catch (error) {
    logger.error("Middleware error", error instanceof Error ? error : new Error(String(error)))

    return new NextResponse("Internal Server Error", {
      status: 500,
    })
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
