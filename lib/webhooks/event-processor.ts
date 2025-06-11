import { WebhooksAPI } from "../api/webhooks"
import { EventEmitter } from "events"
import { createHash, timingSafeEqual } from "crypto"
import { EventPayload } from '../../src';

interface WebhookEvent {
  id: string
  type: string
  repository: string
  payload: EventPayload
  signature?: string
  timestamp: number
}

interface WebhookDeliveryResult {
  id: string
  success: boolean
  statusCode?: number
  response?: EventPayload
  error?: string
  duration: number
}

/**
 * Webhook Event Processor
 *
 * Processes Git events and delivers them to configured webhooks:
 * - Validates webhook signatures
 * - Handles retries with exponential backoff
 * - Processes events asynchronously
 * - Provides event filtering
 */
export class WebhookEventProcessor extends EventEmitter {
  private queue: WebhookEvent[] = []
  private processing = false
  private maxConcurrent = 5
  private currentProcessing = 0
  private maxRetries = 3
  private retryDelays: number[] = [1000, 5000, 15000] // Retry delays in ms

  constructor() {
    super()
    // Set up event listeners
    this.on("delivery-success", this.handleDeliverySuccess.bind(this))
    this.on("delivery-failure", this.handleDeliveryFailure.bind(this))
  }

  /**
   * Add event to processing queue
   */
  async queueEvent(event: WebhookEvent): Promise<string> {
    // Generate event ID if not provided
    if (!event.id) {
      event.id = `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    }

    // Add timestamp if not provided
    if (!event.timestamp) {
      event.timestamp = Date.now()
    }

    // Add to queue
    this.queue.push(event)

    // Start processing if not already
    if (!this.processing) {
      this.processQueue()
    }

    return event.id
  }

  /**
   * Process the event queue
   */
  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false
      return
    }

    this.processing = true

    // Process up to maxConcurrent events
    while (this.queue.length > 0 && this.currentProcessing < this.maxConcurrent) {
      const event = this.queue.shift()
      if (event) {
        this.currentProcessing++
        this.processEvent(event).finally(() => {
          this.currentProcessing--
        })
      }
    }

    // Check again after a short delay
    setTimeout(() => this.processQueue(), 100)
  }

  /**
   * Process a single event
   */
  private async processEvent(event: WebhookEvent, retryCount = 0): Promise<void> {
    try {
      console.log(`Processing webhook event ${event.id} (${event.type}) for ${event.repository}`)

      // Get webhooks for this repository and event type
      const [owner, repo] = event.repository.split("/")
      const { data: repository } = await WebhooksAPI.getRepositoryByName(owner, repo)

      if (!repository) {
        console.error(`Repository not found: ${event.repository}`)
        return
      }

      // Get active webhooks for this repository that listen to this event type
      const webhooks = await WebhooksAPI.getActiveWebhooksForEvent(repository.id, event.type)

      // Deliver to each webhook
      const deliveryPromises = webhooks.map((webhook) => this.deliverToWebhook(webhook, event, retryCount))
      await Promise.all(deliveryPromises)
    } catch (error) {
      console.error(`Error processing webhook event ${event.id}:`, error)
    }
  }

  /**
   * Deliver event to a specific webhook
   */
  private async deliverToWebhook(webhook: any, event: WebhookEvent, retryCount: number): Promise<void> {
    const startTime = Date.now()

    try {
      // Prepare headers
      const headers: Record<string, string> = {
        "Content-Type": webhook.content_type || "application/json",
        "User-Agent": "StarGit-Webhook/1.0",
        "X-GitHub-Event": event.type,
        "X-GitHub-Delivery": event.id,
      }

      // Add signature if secret is provided
      if (webhook.secret) {
        const signature = this.generateSignature(event.payload, webhook.secret)
        headers["X-Hub-Signature-256"] = signature
      }

      // Make HTTP request
      const response = await fetch(webhook.url, {
        method: "POST",
        headers,
        body: JSON.stringify(event.payload),
      })

      const responseData = await this.parseResponse(response)
      const duration = Date.now() - startTime

      // Record delivery result
      const deliveryResult: WebhookDeliveryResult = {
        id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        success: response.ok,
        statusCode: response.status,
        response: responseData,
        duration,
      }

      if (response.ok) {
        this.emit("delivery-success", webhook, event, deliveryResult)
      } else {
        this.emit("delivery-failure", webhook, event, deliveryResult, retryCount)
      }
    } catch (error) {
      const duration = Date.now() - startTime

      // Record delivery failure
      const deliveryResult: WebhookDeliveryResult = {
        id: `del_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
        success: false,
        error: (error as Error).message,
        duration,
      }

      this.emit("delivery-failure", webhook, event, deliveryResult, retryCount)
    }
  }

  /**
   * Parse response based on content type
   */
  private async parseResponse(response: Response): Promise<EventPayload> {
    const contentType = response.headers.get("content-type") || ""

    if (contentType.includes("application/json")) {
      try {
        return await response.json()
      } catch {
        return await response.text()
      }
    }

    return await response.text()
  }

  /**
   * Generate signature for webhook payload
   */
  private generateSignature(payload: EventPayload, secret: string): string {
    const hmac = createHash("sha256").update(secret)
    const signature = hmac.update(JSON.stringify(payload)).digest("hex")
    return `sha256=${signature}`
  }

  /**
   * Verify webhook signature
   */
  verifySignature(payload: EventPayload, signature: string, secret: string): boolean {
    if (!signature || !signature.startsWith("sha256=")) {
      return false
    }

    const providedSignature = Buffer.from(signature.substring(7), "hex")
    const expectedSignature = createHash("sha256").update(secret).update(JSON.stringify(payload)).digest()

    try {
      return timingSafeEqual(providedSignature, expectedSignature)
    } catch {
      return false
    }
  }

  /**
   * Handle successful delivery
   */
  private async handleDeliverySuccess(webhook: any, event: WebhookEvent, result: WebhookDeliveryResult): Promise<void> {
    try {
      // Update webhook stats
      await WebhooksAPI.recordDelivery(webhook.id, {
        event_type: event.type,
        payload: event.payload,
        response_code: result.statusCode,
        response_headers: result.response,
        duration_ms: result.duration,
        success: true,
      })

      // Update webhook last delivery info
      await WebhooksAPI.updateWebhook(webhook.id, {
        last_response_code: result.statusCode,
        last_response_message: "Success",
        last_delivery_at: new Date().toISOString(),
      })
    } catch (error) {
      console.error(`Error recording successful delivery for webhook ${webhook.id}:`, error)
    }
  }

  /**
   * Handle failed delivery
   */
  private async handleDeliveryFailure(
    webhook: any,
    event: WebhookEvent,
    result: WebhookDeliveryResult,
    retryCount: number,
  ): Promise<void> {
    try {
      // Record failed delivery
      await WebhooksAPI.recordDelivery(webhook.id, {
        event_type: event.type,
        payload: event.payload,
        response_code: result.statusCode,
        response_headers: result.response,
        response_body: result.error,
        duration_ms: result.duration,
        success: false,
      })

      // Update webhook last delivery info
      await WebhooksAPI.updateWebhook(webhook.id, {
        last_response_code: result.statusCode || 0,
        last_response_message: result.error || `HTTP ${result.statusCode}`,
        last_delivery_at: new Date().toISOString(),
      })

      // Retry if needed
      if (retryCount < this.maxRetries) {
        const delay = this.retryDelays[retryCount] || 30000

        console.log(`Scheduling retry ${retryCount + 1}/${this.maxRetries} for webhook ${webhook.id} in ${delay}ms`)

        setTimeout(() => {
          this.processEvent(event, retryCount + 1)
        }, delay)
      } else if (webhook.status === "active" && webhook.failure_count >= 5) {
        // Disable webhook after multiple failures
        console.log(`Disabling webhook ${webhook.id} after multiple failures`)

        await WebhooksAPI.updateWebhook(webhook.id, {
          status: "failed",
        })
      }
    } catch (error) {
      console.error(`Error recording failed delivery for webhook ${webhook.id}:`, error)
    }
  }
}

// Create singleton instance
export const webhookProcessor = new WebhookEventProcessor()
