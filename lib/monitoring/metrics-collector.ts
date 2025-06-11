/**
 * Prometheus-compatible Metrics Collector
 *
 * Collects and exposes metrics in Prometheus format for monitoring:
 * - HTTP request metrics (duration, status codes, in-flight requests)
 * - Git operation metrics (clone, fetch, push performance)
 * - Database metrics (query performance, connection pooling)
 * - Authentication metrics (login attempts, token usage)
 * - Repository metrics (size, commits, clones)
 * - Webhook metrics (delivery success, response times)
 */
export class MetricsCollector {
  private static instance: MetricsCollector
  private metrics: Map<string, any> = new Map()
  private histograms: Map<string, number[]> = new Map()
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()

  private constructor() {
    this.initializeMetrics()
  }

  static getInstance(): MetricsCollector {
    if (!MetricsCollector.instance) {
      MetricsCollector.instance = new MetricsCollector()
    }
    return MetricsCollector.instance
  }

  private initializeMetrics(): void {
    // HTTP Metrics
    this.counters.set("http_requests_total", 0)
    this.histograms.set("http_request_duration_seconds", [])
    this.gauges.set("http_requests_in_flight", 0)

    // Git Operation Metrics
    this.counters.set("git_operations_total", 0)
    this.histograms.set("git_operation_duration_seconds", [])
    this.counters.set("git_clone_operations_total", 0)
    this.counters.set("git_fetch_operations_total", 0)
    this.counters.set("git_push_operations_total", 0)

    // Database Metrics
    this.histograms.set("database_query_duration_seconds", [])
    this.gauges.set("database_connections_active", 0)
    this.counters.set("database_queries_total", 0)

    // Authentication Metrics
    this.counters.set("auth_login_attempts_total", 0)
    this.counters.set("auth_login_success_total", 0)
    this.counters.set("auth_token_usage_total", 0)
    this.gauges.set("auth_active_sessions", 0)

    // Repository Metrics
    this.gauges.set("repositories_total", 0)
    this.histograms.set("repository_size_bytes", [])
    this.counters.set("repository_commits_total", 0)
    this.counters.set("repository_clones_total", 0)

    // Webhook Metrics
    this.counters.set("webhook_deliveries_total", 0)
    this.counters.set("webhook_delivery_success_total", 0)
    this.histograms.set("webhook_delivery_duration_seconds", [])
  }

  /**
   * Record HTTP request metrics
   */
  recordHTTPRequest(method: string, path: string, statusCode: number, duration: number): void {
    const labels = { method, path, status: statusCode.toString() }

    this.incrementCounter("http_requests_total", labels)
    this.recordHistogram("http_request_duration_seconds", duration, labels)
  }

  /**
   * Record Git operation metrics
   */
  recordGitOperation(
    operation: "clone" | "fetch" | "push",
    repository: string,
    duration: number,
    success: boolean,
  ): void {
    const labels = { operation, repository, success: success.toString() }

    this.incrementCounter("git_operations_total", labels)
    this.incrementCounter(`git_${operation}_operations_total`, { repository, success: success.toString() })
    this.recordHistogram("git_operation_duration_seconds", duration, labels)
  }

  /**
   * Record database query metrics
   */
  recordDatabaseQuery(query: string, duration: number, success: boolean): void {
    const labels = { query_type: this.extractQueryType(query), success: success.toString() }

    this.incrementCounter("database_queries_total", labels)
    this.recordHistogram("database_query_duration_seconds", duration, labels)
  }

  /**
   * Record authentication metrics
   */
  recordAuthAttempt(method: string, success: boolean): void {
    const labels = { method, success: success.toString() }

    this.incrementCounter("auth_login_attempts_total", labels)
    if (success) {
      this.incrementCounter("auth_login_success_total", { method })
    }
  }

  /**
   * Record webhook delivery metrics
   */
  recordWebhookDelivery(url: string, event: string, statusCode: number, duration: number): void {
    const success = statusCode >= 200 && statusCode < 300
    const labels = { event, success: success.toString() }

    this.incrementCounter("webhook_deliveries_total", labels)
    if (success) {
      this.incrementCounter("webhook_delivery_success_total", { event })
    }
    this.recordHistogram("webhook_delivery_duration_seconds", duration, labels)
  }

  /**
   * Update gauge metrics
   */
  setGauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createMetricKey(name, labels)
    this.gauges.set(key, value)
  }

  /**
   * Increment counter metrics
   */
  incrementCounter(name: string, labels?: Record<string, string>, value = 1): void {
    const key = this.createMetricKey(name, labels)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + value)
  }

  /**
   * Record histogram metrics
   */
  recordHistogram(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.createMetricKey(name, labels)
    const values = this.histograms.get(key) || []
    values.push(value)
    this.histograms.set(key, values)
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    let output = ""

    // Export counters
    for (const [key, value] of this.counters.entries()) {
      const { name, labels } = this.parseMetricKey(key)
      output += `# TYPE ${name} counter\n`
      output += `${name}${this.formatLabels(labels)} ${value}\n`
    }

    // Export gauges
    for (const [key, value] of this.gauges.entries()) {
      const { name, labels } = this.parseMetricKey(key)
      output += `# TYPE ${name} gauge\n`
      output += `${name}${this.formatLabels(labels)} ${value}\n`
    }

    // Export histograms
    for (const [key, values] of this.histograms.entries()) {
      const { name, labels } = this.parseMetricKey(key)
      const buckets = this.calculateHistogramBuckets(values)

      output += `# TYPE ${name} histogram\n`

      for (const bucket of buckets) {
        const bucketLabels = { ...labels, le: bucket.le.toString() }
        output += `${name}_bucket${this.formatLabels(bucketLabels)} ${bucket.count}\n`
      }

      output += `${name}_sum${this.formatLabels(labels)} ${values.reduce((a, b) => a + b, 0)}\n`
      output += `${name}_count${this.formatLabels(labels)} ${values.length}\n`
    }

    return output
  }

  /**
   * Get current metrics as JSON
   */
  getMetricsJSON(): any {
    return {
      counters: Object.fromEntries(this.counters),
      gauges: Object.fromEntries(this.gauges),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => [
          key,
          {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            avg: values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0,
            min: values.length > 0 ? Math.min(...values) : 0,
            max: values.length > 0 ? Math.max(...values) : 0,
          },
        ]),
      ),
    }
  }

  /**
   * Helper methods
   */
  private createMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name
    }
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(",")
    return `${name}{${labelString}}`
  }

  private parseMetricKey(key: string): { name: string; labels: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/)
    if (!match) {
      return { name: key, labels: {} }
    }

    const name = match[1]
    const labelsString = match[2]
    const labels: Record<string, string> = {}

    if (labelsString) {
      const labelPairs = labelsString.split(",")
      for (const pair of labelPairs) {
        const [key, value] = pair.split("=")
        labels[key] = value.replace(/"/g, "")
      }
    }

    return { name, labels }
  }

  private formatLabels(labels: Record<string, string>): string {
    if (!labels || Object.keys(labels).length === 0) {
      return ""
    }
    const labelString = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, value]) => `${key}="${value}"`)
      .join(",")
    return `{${labelString}}`
  }

  private calculateHistogramBuckets(values: number[]): Array<{ le: number; count: number }> {
    const buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, Number.POSITIVE_INFINITY]
    return buckets.map((le) => ({
      le,
      count: values.filter((v) => v <= le).length,
    }))
  }

  private extractQueryType(query: string): string {
    const trimmed = query.trim().toLowerCase()
    if (trimmed.startsWith("select")) return "select"
    if (trimmed.startsWith("insert")) return "insert"
    if (trimmed.startsWith("update")) return "update"
    if (trimmed.startsWith("delete")) return "delete"
    if (trimmed.startsWith("create")) return "create"
    if (trimmed.startsWith("alter")) return "alter"
    if (trimmed.startsWith("drop")) return "drop"
    return "other"
  }
}
