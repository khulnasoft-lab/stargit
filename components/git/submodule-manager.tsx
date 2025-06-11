"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { GitBranch, Plus, ExternalLink, Trash2, RefreshCw } from "lucide-react"

interface Submodule {
  path: string
  url: string
  branch: string
  commit: string
  status: "up-to-date" | "behind" | "ahead" | "diverged"
}

interface SubmoduleManagerProps {
  repositoryFullName: string
}

export function SubmoduleManager({ repositoryFullName }: SubmoduleManagerProps) {
  const [submodules, setSubmodules] = useState<Submodule[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [newSubmodule, setNewSubmodule] = useState({
    url: "",
    path: "",
    branch: "main",
  })

  useEffect(() => {
    fetchSubmodules()
  }, [repositoryFullName])

  const fetchSubmodules = async () => {
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/submodules`)
      const data = await response.json()
      setSubmodules(data.submodules || [])
    } catch (error) {
      console.error("Failed to fetch submodules:", error)
    } finally {
      setLoading(false)
    }
  }

  const addSubmodule = async () => {
    try {
      await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/submodules`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newSubmodule),
      })

      setShowAddDialog(false)
      setNewSubmodule({ url: "", path: "", branch: "main" })
      await fetchSubmodules()
    } catch (error) {
      console.error("Failed to add submodule:", error)
    }
  }

  const updateSubmodule = async (path: string) => {
    try {
      await fetch(
        `/api/repositories/${encodeURIComponent(repositoryFullName)}/submodules/${encodeURIComponent(path)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "update" }),
        },
      )
      await fetchSubmodules()
    } catch (error) {
      console.error("Failed to update submodule:", error)
    }
  }

  const removeSubmodule = async (path: string) => {
    try {
      await fetch(
        `/api/repositories/${encodeURIComponent(repositoryFullName)}/submodules/${encodeURIComponent(path)}`,
        {
          method: "DELETE",
        },
      )
      await fetchSubmodules()
    } catch (error) {
      console.error("Failed to remove submodule:", error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "up-to-date":
        return "bg-green-500"
      case "behind":
        return "bg-yellow-500"
      case "ahead":
        return "bg-blue-500"
      case "diverged":
        return "bg-red-500"
      default:
        return "bg-gray-500"
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading submodules...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitBranch className="h-5 w-5" />
                Git Submodules
              </CardTitle>
              <CardDescription>Manage Git submodules for this repository</CardDescription>
            </div>
            <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Submodule
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Git Submodule</DialogTitle>
                  <DialogDescription>Add a new Git submodule to this repository</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="submodule-url">Repository URL</Label>
                    <Input
                      id="submodule-url"
                      placeholder="https://github.com/user/repo.git"
                      value={newSubmodule.url}
                      onChange={(e) => setNewSubmodule({ ...newSubmodule, url: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="submodule-path">Local Path</Label>
                    <Input
                      id="submodule-path"
                      placeholder="libs/external-lib"
                      value={newSubmodule.path}
                      onChange={(e) => setNewSubmodule({ ...newSubmodule, path: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="submodule-branch">Branch</Label>
                    <Select
                      value={newSubmodule.branch}
                      onValueChange={(value) => setNewSubmodule({ ...newSubmodule, branch: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">main</SelectItem>
                        <SelectItem value="master">master</SelectItem>
                        <SelectItem value="develop">develop</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={addSubmodule}>Add Submodule</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {submodules.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No submodules found in this repository</div>
          ) : (
            <div className="space-y-4">
              {submodules.map((submodule) => (
                <div key={submodule.path} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getStatusColor(submodule.status)}`} />
                    <div>
                      <div className="font-medium">{submodule.path}</div>
                      <div className="text-sm text-muted-foreground">
                        {submodule.url} • {submodule.branch}
                      </div>
                      <div className="text-xs text-muted-foreground">{submodule.commit.substring(0, 8)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{submodule.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => updateSubmodule(submodule.path)}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(submodule.url, "_blank")}>
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => removeSubmodule(submodule.path)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
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
