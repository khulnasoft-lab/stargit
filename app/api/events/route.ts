import { type NextRequest, NextResponse } from "next/server"

// This would be stored in a database in a real application
const events = [
  {
    id: "evt_1",
    type: "push",
    repo: "stargit",
    branch: "main",
    author: "johndoe",
    timestamp: "2023-06-10T14:22:15Z",
    payload: {
      repository: {
        name: "stargit",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      ref: "refs/heads/main",
      commits: [
        {
          id: "abcdef123456",
          message: "Fix bug in webhook handler",
          author: {
            name: "John Doe",
            email: "john@example.com",
          },
        },
      ],
    },
    status: "delivered",
  },
  {
    id: "evt_2",
    type: "pull_request",
    repo: "stargit",
    branch: "feature/webhooks",
    author: "janedoe",
    timestamp: "2023-06-10T13:10:32Z",
    payload: {
      action: "opened",
      repository: {
        name: "stargit",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      pull_request: {
        number: 42,
        title: "Implement webhook filtering",
        user: {
          login: "janedoe",
        },
        base: {
          ref: "main",
        },
        head: {
          ref: "feature/webhooks",
        },
      },
    },
    status: "delivered",
  },
  {
    id: "evt_3",
    type: "issue",
    repo: "webhook-proxy",
    branch: null,
    author: "alicesmith",
    timestamp: "2023-06-10T12:05:18Z",
    payload: {
      action: "opened",
      repository: {
        name: "webhook-proxy",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      issue: {
        number: 15,
        title: "Add support for custom headers",
        user: {
          login: "alicesmith",
        },
      },
    },
    status: "delivered",
  },
  {
    id: "evt_4",
    type: "push",
    repo: "event-tracker",
    branch: "develop",
    author: "bobmartin",
    timestamp: "2023-06-10T10:45:21Z",
    payload: {
      repository: {
        name: "event-tracker",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      ref: "refs/heads/develop",
      commits: [
        {
          id: "12345abcdef",
          message: "Update dependencies",
          author: {
            name: "Bob Martin",
            email: "bob@example.com",
          },
        },
      ],
    },
    status: "delivered",
  },
  {
    id: "evt_5",
    type: "release",
    repo: "stargit",
    branch: null,
    author: "johndoe",
    timestamp: "2023-06-09T16:30:40Z",
    payload: {
      action: "published",
      repository: {
        name: "stargit",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      release: {
        tag_name: "v1.0.0",
        name: "First stable release",
        body: "This release includes all the core features.",
      },
    },
    status: "delivered",
  },
  {
    id: "evt_6",
    type: "pull_request",
    repo: "webhook-proxy",
    branch: "fix/retry-logic",
    author: "janedoe",
    timestamp: "2023-06-09T14:12:55Z",
    payload: {
      action: "closed",
      repository: {
        name: "webhook-proxy",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      pull_request: {
        number: 38,
        title: "Fix webhook retry logic",
        user: {
          login: "janedoe",
        },
        base: {
          ref: "main",
        },
        head: {
          ref: "fix/retry-logic",
        },
        merged: true,
      },
    },
    status: "delivered",
  },
  {
    id: "evt_7",
    type: "push",
    repo: "stargit",
    branch: "feature/api",
    author: "alicesmith",
    timestamp: "2023-06-09T11:05:02Z",
    payload: {
      repository: {
        name: "stargit",
        owner: {
          login: "khulnasoft-lab",
        },
      },
      ref: "refs/heads/feature/api",
      commits: [
        {
          id: "defabc456789",
          message: "Implement GraphQL API",
          author: {
            name: "Alice Smith",
            email: "alice@example.com",
          },
        },
      ],
    },
    status: "failed",
  },
]

export async function GET(request: NextRequest) {
  // Get query parameters for filtering
  const url = new URL(request.url)
  const type = url.searchParams.get("type")
  const repo = url.searchParams.get("repo")
  const status = url.searchParams.get("status")

  // Apply filters if provided
  let filteredEvents = [...events]

  if (type) {
    filteredEvents = filteredEvents.filter((event) => event.type === type)
  }

  if (repo) {
    filteredEvents = filteredEvents.filter((event) => event.repo === repo)
  }

  if (status) {
    filteredEvents = filteredEvents.filter((event) => event.status === status)
  }

  return NextResponse.json({ events: filteredEvents })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Process the incoming webhook
    const eventType = request.headers.get("x-github-event") || body.type || "unknown"

    const newEvent = {
      id: `evt_${Date.now().toString(36)}`,
      type: eventType,
      repo: body.repository?.name || "unknown",
      branch: body.ref?.replace("refs/heads/", "") || null,
      author: body.sender?.login || body.pusher?.name || "unknown",
      timestamp: new Date().toISOString(),
      payload: body,
      status: "received",
    }

    // In a real app, we would save this to a database and process it

    return NextResponse.json({ event: newEvent }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 })
  }
}
