"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { Settings, Trash2, Shield, Users, Webhook, GitBranch, AlertTriangle, Lock, Globe, Eye } from "lucide-react"

interface Repository {
  id: string
  name: string
  full_name: string
  description?: string
  visibility: "public" | "private" | "internal"
  default_branch: string
  has_issues: boolean
  has_projects: boolean
  has_wiki: boolean
  allow_merge_commit: boolean
  allow_squash_merge: boolean
  allow_rebase_merge: boolean
  delete_branch_on_merge: boolean
}

interface SettingsTabProps {
  repository: Repository
}

export function SettingsTab({ repository }: SettingsTabProps) {
  const [settings, setSettings] = useState(repository)
  const [loading, setLoading] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const { toast } = useToast()

  const handleSaveGeneral = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: settings.name,
          description: settings.description,
          visibility: settings.visibility,
          has_issues: settings.has_issues,
          has_projects: settings.has_projects,
          has_wiki: settings.has_wiki,
        }),
      })

      if (!response.ok) throw new Error("Failed to update repository")

      toast({
        title: "Settings updated",
        description: "Repository settings have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update repository settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveMergeSettings = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/merge-settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          allow_merge_commit: settings.allow_merge_commit,
          allow_squash_merge: settings.allow_squash_merge,
          allow_rebase_merge: settings.allow_rebase_merge,
          delete_branch_on_merge: settings.delete_branch_on_merge,
        }),
      })

      if (!response.ok) throw new Error("Failed to update merge settings")

      toast({
        title: "Merge settings updated",
        description: "Repository merge settings have been saved successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update merge settings.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteRepository = async () => {
    if (deleteConfirmation !== repository.name) {
      toast({
        title: "Error",
        description: "Please type the repository name to confirm deletion.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete repository")

      toast({
        title: "Repository deleted",
        description: "The repository has been permanently deleted.",
      })

      // Redirect to dashboard
      window.location.href = "/dashboard"
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete repository.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getVisibilityIcon = (visibility: string) => {
    switch (visibility) {
      case "public":
        return <Globe className="h-4 w-4" />
      case "private":
        return <Lock className="h-4 w-4" />
      case "internal":
        return <Eye className="h-4 w-4" />
      default:
        return <Globe className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Repository Settings
          </CardTitle>
          <CardDescription>Manage your repository configuration and preferences.</CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="access">Access</TabsTrigger>
          <TabsTrigger value="branches">Branches</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="danger">Danger Zone</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic repository information and features.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repo-name">Repository Name</Label>
                  <Input
                    id="repo-name"
                    value={settings.name}
                    onChange={(e) => setSettings((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="visibility">Visibility</Label>
                  <Select
                    value={settings.visibility}
                    onValueChange={(value: any) => setSettings((prev) => ({ ...prev, visibility: value }))}
                  >
                    <SelectTrigger>
                      <div className="flex items-center gap-2">
                        {getVisibilityIcon(settings.visibility)}
                        <SelectValue />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4" />
                          Public
                        </div>
                      </SelectItem>
                      <SelectItem value="private">
                        <div className="flex items-center gap-2">
                          <Lock className="h-4 w-4" />
                          Private
                        </div>
                      </SelectItem>
                      <SelectItem value="internal">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          Internal
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={settings.description || ""}
                  onChange={(e) => setSettings((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="A short description of your repository"
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Features</h4>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="has-issues">Issues</Label>
                    <p className="text-sm text-muted-foreground">Track bugs and feature requests</p>
                  </div>
                  <Switch
                    id="has-issues"
                    checked={settings.has_issues}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, has_issues: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="has-projects">Projects</Label>
                    <p className="text-sm text-muted-foreground">Organize and track work with project boards</p>
                  </div>
                  <Switch
                    id="has-projects"
                    checked={settings.has_projects}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, has_projects: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="has-wiki">Wiki</Label>
                    <p className="text-sm text-muted-foreground">Document your project with a wiki</p>
                  </div>
                  <Switch
                    id="has-wiki"
                    checked={settings.has_wiki}
                    onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, has_wiki: checked }))}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveGeneral} disabled={loading}>
                  {loading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Merge Settings</CardTitle>
              <CardDescription>Configure how pull requests can be merged.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-merge">Allow merge commits</Label>
                  <p className="text-sm text-muted-foreground">
                    Add all commits from the head branch to the base branch
                  </p>
                </div>
                <Switch
                  id="allow-merge"
                  checked={settings.allow_merge_commit}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allow_merge_commit: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-squash">Allow squash merging</Label>
                  <p className="text-sm text-muted-foreground">
                    Combine all commits from the head branch into a single commit
                  </p>
                </div>
                <Switch
                  id="allow-squash"
                  checked={settings.allow_squash_merge}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allow_squash_merge: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="allow-rebase">Allow rebase merging</Label>
                  <p className="text-sm text-muted-foreground">Rebase and merge all commits from the head branch</p>
                </div>
                <Switch
                  id="allow-rebase"
                  checked={settings.allow_rebase_merge}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, allow_rebase_merge: checked }))}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="delete-branch">Automatically delete head branches</Label>
                  <p className="text-sm text-muted-foreground">Delete the head branch after pull requests are merged</p>
                </div>
                <Switch
                  id="delete-branch"
                  checked={settings.delete_branch_on_merge}
                  onCheckedChange={(checked) => setSettings((prev) => ({ ...prev, delete_branch_on_merge: checked }))}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveMergeSettings} disabled={loading}>
                  {loading ? "Saving..." : "Save Merge Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Manage Access
              </CardTitle>
              <CardDescription>Control who can access this repository.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Collaborator Management</h3>
                <p className="text-muted-foreground mb-4">Add collaborators and manage repository permissions.</p>
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Collaborators
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="branches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Branch Protection
              </CardTitle>
              <CardDescription>Configure branch protection rules and policies.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <GitBranch className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Branch Protection Rules</h3>
                <p className="text-muted-foreground mb-4">
                  Protect important branches with status checks and restrictions.
                </p>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Add Protection Rule
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5" />
                Webhooks
              </CardTitle>
              <CardDescription>Manage webhook endpoints for this repository.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Webhook className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Repository Webhooks</h3>
                <p className="text-muted-foreground mb-4">
                  Configure webhooks to receive HTTP notifications when events occur.
                </p>
                <Button>
                  <Webhook className="h-4 w-4 mr-2" />
                  Add Webhook
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security & Analysis
              </CardTitle>
              <CardDescription>Configure security features and vulnerability scanning.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Security Features</h3>
                <p className="text-muted-foreground mb-4">Enable security scanning and vulnerability alerts.</p>
                <Button>
                  <Shield className="h-4 w-4 mr-2" />
                  Configure Security
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="danger" className="space-y-4">
          <Card className="border-red-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Danger Zone
              </CardTitle>
              <CardDescription>Irreversible and destructive actions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border border-red-200 rounded-lg p-4 bg-red-50">
                <h4 className="font-medium text-red-800 mb-2">Delete this repository</h4>
                <p className="text-sm text-red-700 mb-4">
                  Once you delete a repository, there is no going back. Please be certain.
                </p>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="delete-confirmation" className="text-red-800">
                      Type <code className="bg-red-100 px-1 rounded">{repository.name}</code> to confirm:
                    </Label>
                    <Input
                      id="delete-confirmation"
                      value={deleteConfirmation}
                      onChange={(e) => setDeleteConfirmation(e.target.value)}
                      placeholder={repository.name}
                      className="border-red-300 focus:border-red-500"
                    />
                  </div>

                  <Button
                    variant="destructive"
                    onClick={handleDeleteRepository}
                    disabled={loading || deleteConfirmation !== repository.name}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {loading ? "Deleting..." : "Delete Repository"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
