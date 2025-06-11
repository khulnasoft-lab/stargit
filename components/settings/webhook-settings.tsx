"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Webhook, Plus, Trash2, Edit, Globe, AlertCircle, CheckCircle, XCircle } from "lucide-react"

interface WebhookConfig {
  id: string
  name: string
  url: string
  events: string[]
  is_active: boolean
  secret: string
  created_at: string
  last_delivery: string | null
  delivery_status: "success" | "failed" | "pending" | null
  delivery_count: number
}

const AVAILABLE_EVENTS = [
  { id: "push", name: "Push", description: "Any Git push to a repository" },
  { id: "pull_request", name: "Pull Request", description: "Pull request opened, closed, or synchronized" },
  { id: "issues", name: "Issues", description: "Issue opened, closed, or edited" },
  { id: "issue_comment", name: "Issue Comment", description: "Comment added to an issue" },
  { id: "create", name: "Create", description: "Branch or tag created" },
  { id: "delete", name: "Delete", description: "Branch or tag deleted" },
  { id: "release", name: "Release", description: "Release published" },
  { id: "repository", name: "Repository", description: "Repository created, deleted, or modified" },
  { id: "member", name: "Member", description: "Collaborator added or removed" },
  { id: "organization", name: "Organization", description: "Organization membership changes" },
]

export function WebhookSettings() {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([
    {
      id: "1",
      name: "CI/CD Pipeline",
      url: "https://api.example.com/webhooks/ci-cd",
      events: ["push", "pull_request"],
      is_active: true,
      secret: "whsec_1234567890abcdef",
      created_at: "2024-01-15T10:30:00Z",
      last_delivery: "2024-01-20T14:22:00Z",
      delivery_status: "success",
      delivery_count: 156,
    },
    {
      id: "2",
      name: "Slack Notifications",
      url: "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX",
      events: ["issues", "pull_request", "release"],
      is_active: false,
      secret: "whsec_abcdef1234567890",
      created_at: "2024-01-10T08:15:00Z",
      last_delivery: null,
      delivery_status: null,
      delivery_count: 0,
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [webhookForm, setWebhookForm] = useState({
    name: "",
    url: "",
    events: [] as string[],
    secret: "",
    is_active: true,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const resetForm = () => {
    setWebhookForm({
      name: "",
      url: "",
      events: [],
      secret: "",
      is_active: true,
    })
    setEditingWebhook(null)
  }

  const handleCreateWebhook = () => {
    setIsCreateDialogOpen(true)
    resetForm()
  }

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook)
    setWebhookForm({
      name: webhook.name,
      url: webhook.url,
      events: webhook.events,
      secret: webhook.secret,
      is_active: webhook.is_active,
    })
    setIsCreateDialogOpen(true)
  }

  const handleSubmitWebhook = async () => {
    if (!webhookForm.name.trim() || !webhookForm.url.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    if (webhookForm.events.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one event.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      if (editingWebhook) {
        // Update existing webhook
        setWebhooks((prev) =>
          prev.map((webhook) => (webhook.id === editingWebhook.id ? { ...webhook, ...webhookForm } : webhook)),
        )
        toast({
          title: "Webhook updated",
          description: "Your webhook has been successfully updated.",
        })
      } else {
        // Create new webhook
        const newWebhook: WebhookConfig = {
          id: Date.now().toString(),
          ...webhookForm,
          secret: webhookForm.secret || `whsec_${Math.random().toString(36).substring(2, 15)}`,
          created_at: new Date().toISOString(),
          last_delivery: null,
          delivery_status: null,
          delivery_count: 0,
        }
        setWebhooks((prev) => [newWebhook, ...prev])
        toast({
          title: "Webhook created",
          description: "Your webhook has been successfully created.",
        })
      }

      setIsCreateDialogOpen(false)
      resetForm()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save webhook. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteWebhook = async (webhookId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setWebhooks((prev) => prev.filter((webhook) => webhook.id !== webhookId))

      toast({
        title: "Webhook deleted",
        description: "The webhook has been deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete webhook. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleWebhook = async (webhookId: string, isActive: boolean) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 300))

      setWebhooks((prev) =>
        prev.map((webhook) => (webhook.id === webhookId ? { ...webhook, is_active: isActive } : webhook)),
      )

      toast({
        title: isActive ? "Webhook enabled" : "Webhook disabled",
        description: `The webhook has been ${isActive ? "enabled" : "disabled"}.`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update webhook status. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleEventChange = (eventId: string, checked: boolean) => {
    if (checked) {
      setWebhookForm((prev) => ({
        ...prev,
        events: [...prev.events, eventId],
      }))
    } else {
      setWebhookForm((prev) => ({
        ...prev,
        events: prev.events.filter((id) => id !== eventId),
      }))
    }
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <AlertCircle className="h-4 w-4 text-yellow-500" />
      default:
        return <Globe className="h-4 w-4 text-muted-foreground" />
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhook Settings
              </CardTitle>
              <CardDescription>Manage webhooks to receive HTTP notifications when events occur.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleCreateWebhook}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingWebhook ? "Edit Webhook" : "Add Webhook"}</DialogTitle>
                  <DialogDescription>
                    Configure a webhook to receive HTTP POST requests when events occur.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="webhook-name">Name</Label>
                    <Input
                      id="webhook-name"
                      value={webhookForm.name}
                      onChange={(e) => setWebhookForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter a descriptive name for your webhook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-url">Payload URL</Label>
                    <Input
                      id="webhook-url"
                      type="url"
                      value={webhookForm.url}
                      onChange={(e) => setWebhookForm((prev) => ({ ...prev, url: e.target.value }))}
                      placeholder="https://example.com/webhook"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="webhook-secret">Secret (Optional)</Label>
                    <Input
                      id="webhook-secret"
                      value={webhookForm.secret}
                      onChange={(e) => setWebhookForm((prev) => ({ ...prev, secret: e.target.value }))}
                      placeholder="Leave empty to auto-generate"
                    />
                    <p className="text-xs text-muted-foreground">
                      Used to validate webhook payloads. Will be auto-generated if left empty.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <Label>Which events would you like to trigger this webhook?</Label>
                    <div className="space-y-3 max-h-60 overflow-y-auto">
                      {AVAILABLE_EVENTS.map((event) => (
                        <div key={event.id} className="flex items-start space-x-3">
                          <Checkbox
                            id={event.id}
                            checked={webhookForm.events.includes(event.id)}
                            onCheckedChange={(checked) => handleEventChange(event.id, checked as boolean)}
                          />
                          <div className="space-y-1">
                            <Label htmlFor={event.id} className="text-sm font-medium cursor-pointer">
                              {event.name}
                            </Label>
                            <p className="text-xs text-muted-foreground">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="webhook-active"
                      checked={webhookForm.is_active}
                      onCheckedChange={(checked) => setWebhookForm((prev) => ({ ...prev, is_active: checked }))}
                    />
                    <Label htmlFor="webhook-active">Active</Label>
                  </div>
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmitWebhook} disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : editingWebhook ? "Update Webhook" : "Create Webhook"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {webhooks.length === 0 ? (
            <div className="text-center py-8">
              <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground mb-4">
                Set up webhooks to receive notifications when events occur in your repositories.
              </p>
              <Button onClick={handleCreateWebhook}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Webhook
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(webhook.delivery_status)}
                        <h3 className="font-medium">{webhook.name}</h3>
                      </div>
                      <Badge variant={webhook.is_active ? "secondary" : "outline"}>
                        {webhook.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={webhook.is_active}
                        onCheckedChange={(checked) => handleToggleWebhook(webhook.id, checked)}
                      />
                      <Button variant="ghost" size="sm" onClick={() => handleEditWebhook(webhook)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWebhook(webhook.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="font-mono text-xs bg-muted p-2 rounded">{webhook.url}</div>
                    <div className="flex items-center gap-4">
                      <span>Created {formatDate(webhook.created_at)}</span>
                      {webhook.last_delivery && <span>Last delivery {formatDate(webhook.last_delivery)}</span>}
                      <span>{webhook.delivery_count} deliveries</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Events:</span>
                      <div className="flex gap-1">
                        {webhook.events.map((event) => (
                          <Badge key={event} variant="outline" className="text-xs">
                            {event}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
