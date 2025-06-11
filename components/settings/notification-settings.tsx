"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Bell, Mail, Smartphone, Clock, Volume2 } from "lucide-react"

interface NotificationSettings {
  email_notifications: boolean
  web_notifications: boolean
  mobile_notifications: boolean
  marketing_emails: boolean
  security_alerts: boolean
  frequency: "immediate" | "hourly" | "daily" | "weekly"
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  notification_types: {
    push_events: boolean
    pull_requests: boolean
    issues: boolean
    releases: boolean
    security_alerts: boolean
    mentions: boolean
    team_discussions: boolean
    workflow_runs: boolean
  }
}

export function NotificationSettings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [settings, setSettings] = useState<NotificationSettings>({
    email_notifications: true,
    web_notifications: true,
    mobile_notifications: false,
    marketing_emails: false,
    security_alerts: true,
    frequency: "immediate",
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    notification_types: {
      push_events: true,
      pull_requests: true,
      issues: true,
      releases: true,
      security_alerts: true,
      mentions: true,
      team_discussions: false,
      workflow_runs: false,
    },
  })

  const handleSave = async () => {
    setLoading(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Settings saved",
        description: "Your notification preferences have been updated.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save notification settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const updateSetting = <K extends keyof NotificationSettings>(key: K, value: NotificationSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const updateNotificationType = (type: keyof NotificationSettings["notification_types"], enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      notification_types: {
        ...prev.notification_types,
        [type]: enabled,
      },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Delivery Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Delivery
          </CardTitle>
          <CardDescription>Choose how you want to receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications via email</p>
              </div>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => updateSetting("email_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="web-notifications">Web Notifications</Label>
                <p className="text-sm text-muted-foreground">Show browser notifications</p>
              </div>
            </div>
            <Switch
              id="web-notifications"
              checked={settings.web_notifications}
              onCheckedChange={(checked) => updateSetting("web_notifications", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label htmlFor="mobile-notifications">Mobile Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive push notifications on mobile devices</p>
              </div>
            </div>
            <Switch
              id="mobile-notifications"
              checked={settings.mobile_notifications}
              onCheckedChange={(checked) => updateSetting("mobile_notifications", checked)}
            />
          </div>

          <Separator />

          <div className="space-y-2">
            <Label htmlFor="frequency">Notification Frequency</Label>
            <Select value={settings.frequency} onValueChange={(value: any) => updateSetting("frequency", value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediate">Immediate</SelectItem>
                <SelectItem value="hourly">Hourly digest</SelectItem>
                <SelectItem value="daily">Daily digest</SelectItem>
                <SelectItem value="weekly">Weekly digest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Set times when you don't want to receive notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">Pause notifications during specified hours</p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.quiet_hours_enabled}
              onCheckedChange={(checked) => updateSetting("quiet_hours_enabled", checked)}
            />
          </div>

          {settings.quiet_hours_enabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="quiet-start">Start Time</Label>
                <Select
                  value={settings.quiet_hours_start}
                  onValueChange={(value) => updateSetting("quiet_hours_start", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0")
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="quiet-end">End Time</Label>
                <Select
                  value={settings.quiet_hours_end}
                  onValueChange={(value) => updateSetting("quiet_hours_end", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, "0")
                      return (
                        <SelectItem key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Types */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="h-5 w-5" />
            Notification Types
          </CardTitle>
          <CardDescription>Choose which events trigger notifications.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-events">Push Events</Label>
              <p className="text-sm text-muted-foreground">When commits are pushed to repositories</p>
            </div>
            <Switch
              id="push-events"
              checked={settings.notification_types.push_events}
              onCheckedChange={(checked) => updateNotificationType("push_events", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="pull-requests">Pull Requests</Label>
              <p className="text-sm text-muted-foreground">When pull requests are opened, closed, or updated</p>
            </div>
            <Switch
              id="pull-requests"
              checked={settings.notification_types.pull_requests}
              onCheckedChange={(checked) => updateNotificationType("pull_requests", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="issues">Issues</Label>
              <p className="text-sm text-muted-foreground">When issues are opened, closed, or commented on</p>
            </div>
            <Switch
              id="issues"
              checked={settings.notification_types.issues}
              onCheckedChange={(checked) => updateNotificationType("issues", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="releases">Releases</Label>
              <p className="text-sm text-muted-foreground">When new releases are published</p>
            </div>
            <Switch
              id="releases"
              checked={settings.notification_types.releases}
              onCheckedChange={(checked) => updateNotificationType("releases", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="security-alerts-type">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Security vulnerabilities and alerts</p>
            </div>
            <Switch
              id="security-alerts-type"
              checked={settings.notification_types.security_alerts}
              onCheckedChange={(checked) => updateNotificationType("security_alerts", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="mentions">Mentions</Label>
              <p className="text-sm text-muted-foreground">When you're mentioned in comments or discussions</p>
            </div>
            <Switch
              id="mentions"
              checked={settings.notification_types.mentions}
              onCheckedChange={(checked) => updateNotificationType("mentions", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="team-discussions">Team Discussions</Label>
              <p className="text-sm text-muted-foreground">Updates from team discussions and announcements</p>
            </div>
            <Switch
              id="team-discussions"
              checked={settings.notification_types.team_discussions}
              onCheckedChange={(checked) => updateNotificationType("team_discussions", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="workflow-runs">Workflow Runs</Label>
              <p className="text-sm text-muted-foreground">CI/CD workflow completion and failures</p>
            </div>
            <Switch
              id="workflow-runs"
              checked={settings.notification_types.workflow_runs}
              onCheckedChange={(checked) => updateNotificationType("workflow_runs", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Marketing & Security */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Settings</CardTitle>
          <CardDescription>Marketing communications and security alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="marketing-emails">Marketing Emails</Label>
              <p className="text-sm text-muted-foreground">Product updates, tips, and promotional content</p>
            </div>
            <Switch
              id="marketing-emails"
              checked={settings.marketing_emails}
              onCheckedChange={(checked) => updateSetting("marketing_emails", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="security-alerts">Security Alerts</Label>
              <p className="text-sm text-muted-foreground">Critical security notifications (always enabled)</p>
            </div>
            <Switch id="security-alerts" checked={settings.security_alerts} disabled />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={loading}>
          {loading ? "Saving..." : "Save Notification Settings"}
        </Button>
      </div>
    </div>
  )
}
