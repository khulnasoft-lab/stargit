import { type NextRequest, NextResponse } from "next/server"
import { MetricsCollector } from "@/lib/monitoring/metrics-collector"

export async function GET(request: NextRequest) {
  try {
    const metrics = MetricsCollector.getInstance()
    const format = request.nextUrl.searchParams.get("format") || "prometheus"

    if (format === "json") {
      return NextResponse.json(metrics.getMetricsJSON())
    } else {
      // Default to Prometheus format
      const prometheusMetrics = metrics.exportPrometheusMetrics()
      return new NextResponse(prometheusMetrics, {
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
        },
      })
    }
  } catch (error) {
    console.error("Error exporting metrics:", error)
    return NextResponse.json({ error: "Failed to export metrics" }, { status: 500 })
  }
}
