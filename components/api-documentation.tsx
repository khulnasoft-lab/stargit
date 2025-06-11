"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Copy } from "lucide-react"

export function ApiDocumentation() {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication</CardTitle>
          <CardDescription>All API requests require authentication using an API key.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">API Key Header</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-sm flex items-center justify-between">
                <span>Authorization: Bearer YOUR_API_KEY</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("Authorization: Bearer YOUR_API_KEY")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2">Base URL</h4>
              <div className="bg-muted p-3 rounded-md font-mono text-sm flex items-center justify-between">
                <span>https://api.stargit.dev/v1</span>
                <Button variant="ghost" size="sm" onClick={() => copyToClipboard("https://api.stargit.dev/v1")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  GET
                </Badge>
                /events
              </CardTitle>
              <CardDescription>Retrieve a list of Git events with optional filtering.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Query Parameters</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">type</code>
                    <span className="text-muted-foreground">
                      Filter by event type (push, pull_request, issue, etc.)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">repo</code>
                    <span className="text-muted-foreground">Filter by repository name</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">limit</code>
                    <span className="text-muted-foreground">Number of events to return (default: 50, max: 1000)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">since</code>
                    <span className="text-muted-foreground">ISO 8601 timestamp to filter events after</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Request</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span>curl -H "Authorization: Bearer YOUR_API_KEY" \</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  "https://api.stargit.dev/v1/events?type=push&limit=10"`)
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <span> "https://api.stargit.dev/v1/events?type=push&limit=10"</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  POST
                </Badge>
                /events/webhook
              </CardTitle>
              <CardDescription>Receive webhook events from Git providers.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Headers</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">X-GitHub-Event</code>
                    <span className="text-muted-foreground">GitHub event type</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">X-Hub-Signature-256</code>
                    <span className="text-muted-foreground">GitHub webhook signature</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium mb-2">Example Response</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <pre>{`{
  "event": {
    "id": "evt_abc123",
    "type": "push",
    "status": "received",
    "timestamp": "2023-06-10T14:22:15Z"
  }
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  GET
                </Badge>
                /webhooks
              </CardTitle>
              <CardDescription>List all configured webhook endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2">Example Response</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <pre>{`{
  "webhooks": [
    {
      "id": "wh_abc123",
      "name": "Production API",
      "url": "https://api.example.com/webhooks/git",
      "provider": "github",
      "active": true,
      "events": ["push", "pull_request"],
      "created_at": "2023-05-15T10:30:00Z"
    }
  ]
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  POST
                </Badge>
                /webhooks
              </CardTitle>
              <CardDescription>Create a new webhook endpoint.</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2">Request Body</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <pre>{`{
  "name": "My Webhook",
  "url": "https://api.example.com/webhooks/git",
  "provider": "github",
  "events": ["push", "pull_request"],
  "active": true,
  "secret": "optional_secret_key"
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                  GET
                </Badge>
                /analytics/summary
              </CardTitle>
              <CardDescription>Get analytics summary for your events and webhooks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div>
                <h4 className="font-medium mb-2">Example Response</h4>
                <div className="bg-muted p-3 rounded-md font-mono text-sm">
                  <pre>{`{
  "summary": {
    "total_events": 2853,
    "active_webhooks": 12,
    "success_rate": 0.998,
    "events_last_24h": 249,
    "top_repositories": [
      {"name": "stargit", "events": 1205},
      {"name": "webhook-proxy", "events": 892}
    ]
  }
}`}</pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
