"use client"

import type React from "react"

import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { ChevronLeft, Webhook } from "lucide-react"
import Link from "next/link"
import { useState } from "react"

export default function NewWebhookPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulate form submission
    setTimeout(() => {
      setLoading(false)
      toast({
        title: "Webhook created",
        description: "Your webhook endpoint has been created successfully.",
        variant: "default",
      })
    }, 1000)
  }

  return (
    <DashboardShell>
      <DashboardHeader heading="Create Webhook" text="Set up a new webhook endpoint to receive Git events.">
        <Button variant="outline" asChild>
          <Link href="/webhooks">
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Webhooks
          </Link>
        </Button>
      </DashboardHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Webhook Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input id="name" placeholder="Production API Webhook" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="provider">Git Provider</Label>
                  <Select defaultValue="github">
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="github">GitHub</SelectItem>
                      <SelectItem value="gitlab">GitLab</SelectItem>
                      <SelectItem value="bitbucket">Bitbucket</SelectItem>
                      <SelectItem value="gitea">Gitea</SelectItem>
                      <SelectItem value="custom">Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="url">Webhook URL</Label>
                <Input id="url" placeholder="https://api.example.com/webhooks/git" required />
              </div>

              <div className="space-y-2">
                <Label htmlFor="secret">Secret (optional)</Label>
                <Input id="secret" type="password" placeholder="••••••••••••••••" />
                <p className="text-sm text-muted-foreground">Used to verify the signature of incoming webhooks.</p>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="active" defaultChecked />
                <Label htmlFor="active">Enable this webhook</Label>
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="event-types">
            <TabsList className="grid grid-cols-3 mb-4">
              <TabsTrigger value="event-types">Event Types</TabsTrigger>
              <TabsTrigger value="filtering">Filtering Rules</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="event-types">
              <Card>
                <CardHeader>
                  <CardTitle>Select Event Types</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-2">
                    <Switch id="push" defaultChecked />
                    <Label htmlFor="push">Push</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="pr" defaultChecked />
                    <Label htmlFor="pr">Pull Requests</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="issues" defaultChecked />
                    <Label htmlFor="issues">Issues</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="release" />
                    <Label htmlFor="release">Releases</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="deployment" />
                    <Label htmlFor="deployment">Deployments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="comment" />
                    <Label htmlFor="comment">Comments</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="workflow" />
                    <Label htmlFor="workflow">Workflows</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="filtering">
              <Card>
                <CardHeader>
                  <CardTitle>Filtering Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="repo-filter">Repository Filter</Label>
                    <Input id="repo-filter" placeholder="owner/repo or owner/* for all repos" />
                    <p className="text-xs text-muted-foreground">
                      You can use * as a wildcard, e.g. "org/*" for all repos in org
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch-filter">Branch Filter</Label>
                    <Input id="branch-filter" placeholder="main, develop, feature/*" />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated branch names, or patterns with * wildcard
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="custom-filter">Custom Filter (JSONPath)</Label>
                    <Textarea id="custom-filter" placeholder="$.pull_request.labels[?(@.name == 'bug')]" rows={3} />
                    <p className="text-xs text-muted-foreground">
                      JSONPath expression to filter events based on payload content
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced">
              <Card>
                <CardHeader>
                  <CardTitle>Advanced Settings</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="retries">Retry Attempts</Label>
                      <span className="text-sm text-muted-foreground">3 attempts</span>
                    </div>
                    <Input id="retries" type="range" min="0" max="10" defaultValue="3" className="w-full" />
                    <p className="text-xs text-muted-foreground">
                      Number of retry attempts for failed webhook deliveries
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="transform">Payload Transformation</Label>
                    <Select defaultValue="none">
                      <SelectTrigger id="transform">
                        <SelectValue placeholder="Select transformation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No transformation</SelectItem>
                        <SelectItem value="minimal">Minimal (core fields only)</SelectItem>
                        <SelectItem value="custom">Custom script</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch id="ssl-verify" defaultChecked />
                      <Label htmlFor="ssl-verify">Verify SSL certificate</Label>
                    </div>
                    <p className="text-xs text-muted-foreground pl-6">Disable only in development environments</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch id="content-type" />
                    <Label htmlFor="content-type">Send as form instead of JSON</Label>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardFooter className="flex justify-between pt-6">
              <Button variant="outline" asChild>
                <Link href="/webhooks">Cancel</Link>
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <span className="animate-spin mr-2">●</span>
                    Creating...
                  </>
                ) : (
                  <>
                    <Webhook className="mr-2 h-4 w-4" />
                    Create Webhook
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </form>
    </DashboardShell>
  )
}
