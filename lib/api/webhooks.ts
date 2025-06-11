import { supabase } from "../supabase"
import type { Database } from "../database.types"

type Webhook = Database["public"]["Tables"]["webhooks"]["Row"]
type WebhookInsert = Database["public"]["Tables"]["webhooks"]["Insert"]
type WebhookUpdate = Database["public"]["Tables"]["webhooks"]["Update"]
type WebhookDelivery = Database["public"]["Tables"]["webhook_deliveries"]["Row"]
type WebhookDeliveryInsert = Database["public"]["Tables"]["webhook_deliveries"]["Insert"]

export class WebhooksAPI {
  /**
   * Create webhook
   */
  static async create(webhookData: WebhookInsert): Promise<Webhook> {
    const { data, error } = await supabase.from("webhooks").insert(webhookData).select().single()

    if (error) throw error
    return data
  }

  /**
   * List repository webhooks
   */
  static async listByRepository(repositoryId: string): Promise<Webhook[]> {
    const { data, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get webhook by ID
   */
  static async getById(id: string): Promise<Webhook | null> {
    const { data, error } = await supabase.from("webhooks").select("*").eq("id", id).single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Update webhook
   */
  static async update(id: string, updates: WebhookUpdate): Promise<Webhook> {
    const { data, error } = await supabase.from("webhooks").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  /**
   * Delete webhook
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("webhooks").delete().eq("id", id)

    if (error) throw error
  }

  /**
   * Trigger webhook delivery
   */
  static async triggerDelivery(
    webhookId: string,
    eventType: "push" | "pull_request" | "issue" | "release" | "deployment",
    payload: any,
  ): Promise<WebhookDelivery> {
    // Get webhook details
    const webhook = await this.getById(webhookId)
    if (!webhook) throw new Error("Webhook not found")
    if (webhook.status !== "active") throw new Error("Webhook is not active")
    if (!webhook.events.includes(eventType)) throw new Error("Event type not configured for webhook")

    const startTime = Date.now()
    let success = false
    let responseCode: number | null = null
    let responseHeaders: any = null
    let responseBody: string | null = null

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": webhook.content_type,
        "User-Agent": "GitPlatform-Webhook/1.0",
        "X-Event-Type": eventType,
      }

      // Add signature if secret is provided
      if (webhook.secret) {
        const crypto = await import("crypto")
        const signature = crypto.createHmac("sha256", webhook.secret).update(JSON.stringify(payload)).digest("hex")
        headers["X-Hub-Signature-256"] = `sha256=${signature}`
      }

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      })

      responseCode = response.status
      responseHeaders = Object.fromEntries(response.headers.entries())
      responseBody = await response.text()
      success = response.ok

      // Update webhook status
      await this.update(webhookId, {
        last_response_code: responseCode,
        last_response_message: success ? "Success" : `HTTP ${responseCode}`,
        last_delivery_at: new Date().toISOString(),
        status: success ? "active" : "failed",
      })
    } catch (error) {
      responseBody = error instanceof Error ? error.message : "Unknown error"

      // Update webhook status
      await this.update(webhookId, {
        last_response_code: null,
        last_response_message: responseBody,
        last_delivery_at: new Date().toISOString(),
        status: "failed",
      })
    }

    const duration = Date.now() - startTime

    // Record delivery attempt
    const deliveryData: WebhookDeliveryInsert = {
      webhook_id: webhookId,
      event_type: eventType,
      payload,
      response_code: responseCode,
      response_headers: responseHeaders,
      response_body: responseBody,
      duration_ms: duration,
      success,
    }

    const { data: delivery, error } = await supabase.from("webhook_deliveries").insert(deliveryData).select().single()

    if (error) throw error
    return delivery
  }

  /**
   * Get webhook deliveries
   */
  static async getDeliveries(webhookId: string, limit = 50): Promise<WebhookDelivery[]> {
    const { data, error } = await supabase
      .from("webhook_deliveries")
      .select("*")
      .eq("webhook_id", webhookId)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (error) throw error
    return data
  }

  /**
   * Trigger webhooks for repository event
   */
  static async triggerRepositoryWebhooks(
    repositoryId: string,
    eventType: "push" | "pull_request" | "issue" | "release" | "deployment",
    payload: any,
  ): Promise<WebhookDelivery[]> {
    // Get active webhooks for repository that listen to this event
    const { data: webhooks, error } = await supabase
      .from("webhooks")
      .select("*")
      .eq("repository_id", repositoryId)
      .eq("status", "active")
      .contains("events", [eventType])

    if (error) throw error

    // Trigger all matching webhooks
    const deliveries = await Promise.allSettled(
      webhooks.map((webhook) => this.triggerDelivery(webhook.id, eventType, payload)),
    )

    // Return successful deliveries
    return deliveries
      .filter((result): result is PromiseFulfilledResult<WebhookDelivery> => result.status === "fulfilled")
      .map((result) => result.value)
  }

  /**
   * Test webhook
   */
  static async test(webhookId: string): Promise<WebhookDelivery> {
    const testPayload = {
      test: true,
      timestamp: new Date().toISOString(),
      message: "This is a test webhook delivery",
    }

    return this.triggerDelivery(webhookId, "push", testPayload)
  }
}
