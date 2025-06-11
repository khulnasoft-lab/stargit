"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"
import { GitFork, Trash2, Edit, Archive, BarChart3 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  visibility: "public" | "private" | "internal"
  default_branch: string
  has_issues: boolean
  has_wiki: boolean
  has_projects: boolean
}

interface RepositoryOperationsProps {
  repository: Repository
  onUpdate: (repository: Repository) => void
  onDelete: () => void
}

export function RepositoryOperations({ repository, onUpdate, onDelete }: RepositoryOperationsProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleRename = async (newName: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "rename", newName }),
      })

      if (!response.ok) throw new Error("Failed to rename repository")

      const { repository: updatedRepo } = await response.json()
      onUpdate(updatedRepo)
      toast({ title: "Repository renamed successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleFork = async (targetName?: string, targetOrganizationId?: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "fork", targetName, targetOrganizationId }),
      })

      if (!response.ok) throw new Error("Failed to fork repository")

      const { repository: forkedRepo } = await response.json()
      toast({ title: "Repository forked successfully", description: `Created ${forkedRepo.full_name}` })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateMetadata = async (updates: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "update_metadata", updates }),
      })

      if (!response.ok) throw new Error("Failed to update repository")

      const { repository: updatedRepo } = await response.json()
      onUpdate(updatedRepo)
      toast({ title: "Repository updated successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete repository")

      onDelete()
      toast({ title: "Repository deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Repository Operations</CardTitle>
          <CardDescription>Manage your repository settings and perform operations.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <RenameDialog repository={repository} onRename={handleRename} loading={loading} />
            <ForkDialog repository={repository} onFork={handleFork} loading={loading} />
            <EditDialog repository={repository} onUpdate={handleUpdateMetadata} loading={loading} />
            <StatisticsDialog repository={repository} />
            <ArchiveDialog repository={repository} />
            <DeleteDialog repository={repository} onDelete={handleDelete} loading={loading} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function RenameDialog({
  repository,
  onRename,
  loading,
}: {
  repository: Repository
  onRename: (name: string) => void
  loading: boolean
}) {
  const [newName, setNewName] = useState(repository.name)
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    onRename(newName)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Rename
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rename Repository</DialogTitle>
          <DialogDescription>Change the name of your repository.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="new-name">New Name</Label>
            <Input id="new-name" value={newName} onChange={(e) => setNewName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !newName || newName === repository.name}>
            Rename Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function ForkDialog({
  repository,
  onFork,
  loading,
}: {
  repository: Repository
  onFork: (targetName?: string, targetOrganizationId?: string) => void
  loading: boolean
}) {
  const [targetName, setTargetName] = useState(repository.name)
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    onFork(targetName !== repository.name ? targetName : undefined)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <GitFork className="h-4 w-4 mr-2" />
          Fork
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fork Repository</DialogTitle>
          <DialogDescription>Create a copy of this repository.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="fork-name">Repository Name</Label>
            <Input id="fork-name" value={targetName} onChange={(e) => setTargetName(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !targetName}>
            Fork Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function EditDialog({
  repository,
  onUpdate,
  loading,
}: {
  repository: Repository
  onUpdate: (updates: any) => void
  loading: boolean
}) {
  const [description, setDescription] = useState(repository.description || "")
  const [visibility, setVisibility] = useState(repository.visibility)
  const [defaultBranch, setDefaultBranch] = useState(repository.default_branch)
  const [hasIssues, setHasIssues] = useState(repository.has_issues)
  const [hasWiki, setHasWiki] = useState(repository.has_wiki)
  const [hasProjects, setHasProjects] = useState(repository.has_projects)
  const [open, setOpen] = useState(false)

  const handleSubmit = () => {
    onUpdate({
      description,
      visibility,
      defaultBranch,
      hasIssues,
      hasWiki,
      hasProjects,
    })
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Repository</DialogTitle>
          <DialogDescription>Update repository settings and metadata.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="visibility">Visibility</Label>
              <Select value={visibility} onValueChange={(value: any) => setVisibility(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="public">Public</SelectItem>
                  <SelectItem value="private">Private</SelectItem>
                  <SelectItem value="internal">Internal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="default-branch">Default Branch</Label>
              <Input id="default-branch" value={defaultBranch} onChange={(e) => setDefaultBranch(e.target.value)} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Features</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch id="has-issues" checked={hasIssues} onCheckedChange={setHasIssues} />
                <Label htmlFor="has-issues">Issues</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="has-wiki" checked={hasWiki} onCheckedChange={setHasWiki} />
                <Label htmlFor="has-wiki">Wiki</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="has-projects" checked={hasProjects} onCheckedChange={setHasProjects} />
                <Label htmlFor="has-projects">Projects</Label>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            Update Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function StatisticsDialog({ repository }: { repository: Repository }) {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)

  const loadStatistics = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation: "get_statistics" }),
      })

      if (!response.ok) throw new Error("Failed to load statistics")

      const { statistics } = await response.json()
      setStats(statistics)
    } catch (error) {
      console.error("Failed to load statistics:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" onClick={loadStatistics}>
          <BarChart3 className="h-4 w-4 mr-2" />
          Statistics
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Repository Statistics</DialogTitle>
          <DialogDescription>Detailed information about your repository.</DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="text-center py-4">Loading statistics...</div>
        ) : stats ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Size</Label>
                <p className="text-sm text-muted-foreground">{(stats.size_kb / 1024).toFixed(2)} MB</p>
              </div>
              <div>
                <Label>Branches</Label>
                <p className="text-sm text-muted-foreground">{stats.branches_count}</p>
              </div>
              <div>
                <Label>Tags</Label>
                <p className="text-sm text-muted-foreground">{stats.tags_count}</p>
              </div>
              <div>
                <Label>Last Push</Label>
                <p className="text-sm text-muted-foreground">
                  {stats.pushed_at ? new Date(stats.pushed_at).toLocaleDateString() : "Never"}
                </p>
              </div>
            </div>
            {stats.git_info?.lastCommit && (
              <div>
                <Label>Last Commit</Label>
                <div className="text-sm text-muted-foreground">
                  <p>{stats.git_info.lastCommit.message}</p>
                  <p>
                    by {stats.git_info.lastCommit.author} on{" "}
                    {new Date(stats.git_info.lastCommit.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-4">No statistics available</div>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ArchiveDialog({ repository }: { repository: Repository }) {
  const [open, setOpen] = useState(false)
  const { toast } = useToast()

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/repositories/${repository.id}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          operation: "archive",
          outputPath: `/tmp/${repository.full_name.replace("/", "-")}-${Date.now()}.tar.gz`,
        }),
      })

      if (!response.ok) throw new Error("Failed to archive repository")

      toast({ title: "Repository archived successfully" })
      setOpen(false)
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Archive className="h-4 w-4 mr-2" />
          Archive
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Archive Repository</DialogTitle>
          <DialogDescription>Create a backup archive of this repository.</DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This will create a compressed archive of the repository that can be used for backup or migration purposes.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleArchive}>Create Archive</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function DeleteDialog({
  repository,
  onDelete,
  loading,
}: {
  repository: Repository
  onDelete: () => void
  loading: boolean
}) {
  const [confirmName, setConfirmName] = useState("")
  const [open, setOpen] = useState(false)

  const handleDelete = () => {
    onDelete()
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Repository</DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete the repository.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm">
            Please type <strong>{repository.name}</strong> to confirm deletion.
          </p>
          <Input placeholder={repository.name} value={confirmName} onChange={(e) => setConfirmName(e.target.value)} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={loading || confirmName !== repository.name}>
            Delete Repository
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
