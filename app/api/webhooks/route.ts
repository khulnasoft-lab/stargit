import { type NextRequest, NextResponse } from "next/server"

// This would be stored in a database in a real application
const webhooks = [
  {
    id: "wh_1",
    name: "Production API",
    url: "https://api.example.com/webhooks/git",
    provider: "github",
    active: true,
    events: ["push", "pull_request"],
    createdAt: "2023-05-15T10:30:00Z",
    lastDelivery: "2023-06-10T14:22:15Z",
    successRate: 0.998,
  },
  {
    id: "wh_2",
    name: "Staging Environment",
    url: "https://staging.example.com/webhooks/git",
    provider: "github",
    active: true,
    events: ["push", "pull_request", "issue"],
    createdAt: "2023-05-20T09:15:00Z",
    lastDelivery: "2023-06-10T13:45:30Z",
    successRate: 0.985,
  },
  {
    id: "wh_3",
    name: "CI/CD Pipeline",
    url: "https://jenkins.example.com/github-webhook/",
    provider: "github",
    active: true,
    events: ["push", "workflow_run"],
    createdAt: "2023-04-10T11:20:00Z",
    lastDelivery: "2023-06-10T14:30:00Z",
    successRate: 1.0,
  },
  {
    id: "wh_4",
    name: "Analytics System",
    url: "https://analytics.example.com/ingest/git",
    provider: "github",
    active: false,
    events: ["push", "pull_request", "issue", "release"],
    createdAt: "2023-03-05T16:40:00Z",
    lastDelivery: "2023-05-01T09:22:15Z",
    successRate: 0.75,
  },
  {
    id: "wh_5",
    name: "Documentation Generator",
    url: "https://docs.example.com/triggers/git",
    provider: "gitlab",
    active: true,
    events: ["push", "merge_request", "tag"],
    createdAt: "2023-06-01T08:30:00Z",
    lastDelivery: "2023-06-09T11:12:45Z",
    successRate: 0.95,
  },
]

export async function GET(request: NextRequest) {
  return NextResponse.json({ webhooks })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    if (!body.name || !body.url || !body.provider || !body.events || !Array.isArray(body.events)) {
      return NextResponse.json({ error: "Invalid webhook data" }, { status: 400 })
    }

    // Create a new webhook
    const newWebhook = {
      id: `wh_${Date.now().toString(36)}`,
      name: body.name,
      url: body.url,
      provider: body.provider,
      active: body.active ?? true,
      events: body.events,
      createdAt: new Date().toISOString(),
      lastDelivery: null,
      successRate: 0,
    }

    // In a real app, we would save this to a database

    return NextResponse.json({ webhook: newWebhook }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process request" }, { status: 500 })
  }
}
