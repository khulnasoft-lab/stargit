"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Key, Plus, Trash2, Calendar, Shield } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

interface SSHKey {
  id: string
  title: string
  key_type: string
  fingerprint: string
  public_key: string
  created_at: string
  last_used_at?: string
}

export function SSHKeysSettings() {
  const [sshKeys, setSSHKeys] = useState<SSHKey[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchSSHKeys()
  }, [])

  const fetchSSHKeys = async () => {
    try {
      const response = await fetch("/api/user/ssh-keys")
      const data = await response.json()
      setSSHKeys(data.ssh_keys || [])
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch SSH keys", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const addSSHKey = async (title: string, publicKey: string) => {
    try {
      const response = await fetch("/api/user/ssh-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, public_key: publicKey }),
      })

      if (!response.ok) throw new Error("Failed to add SSH key")

      await fetchSSHKeys()
      toast({ title: "SSH key added successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const deleteSSHKey = async (keyId: string) => {
    try {
      const response = await fetch(`/api/user/ssh-keys/${keyId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to delete SSH key")

      await fetchSSHKeys()
      toast({ title: "SSH key deleted successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  const getKeyTypeColor = (keyType: string) => {
    switch (keyType) {
      case "rsa":
        return "bg-blue-100 text-blue-800"
      case "ed25519":
        return "bg-green-100 text-green-800"
      case "ecdsa":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>SSH Keys</span>
            </CardTitle>
            <CardDescription>Manage SSH keys for secure Git operations and repository access.</CardDescription>
          </div>
          <AddSSHKeyDialog onAddKey={addSSHKey} />
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-1/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : sshKeys.length === 0 ? (
          <div className="text-center py-8">
            <Key className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No SSH keys</h3>
            <p className="text-muted-foreground">Add an SSH key to enable secure Git operations.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sshKeys.map((key) => (
              <div key={key.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-medium">{key.title}</h3>
                      <Badge className={getKeyTypeColor(key.key_type)}>{key.key_type.toUpperCase()}</Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-2">
                        <Shield className="h-3 w-3" />
                        <span className="font-mono">{key.fingerprint}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-3 w-3" />
                        <span>Added {formatDate(key.created_at)}</span>
                        {key.last_used_at && <span>• Last used {formatDate(key.last_used_at)}</span>}
                      </div>
                    </div>
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                        View public key
                      </summary>
                      <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto">{key.public_key}</pre>
                    </details>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete SSH Key</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete the SSH key "{key.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteSSHKey(key.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function AddSSHKeyDialog({ onAddKey }: { onAddKey: (title: string, publicKey: string) => void }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState("")
  const [publicKey, setPublicKey] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!title.trim() || !publicKey.trim()) return

    setLoading(true)
    try {
      await onAddKey(title, publicKey)
      setTitle("")
      setPublicKey("")
      setOpen(false)
    } catch (error) {
      // Error handling is done in the parent component
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add SSH Key
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add SSH Key</DialogTitle>
          <DialogDescription>Add a new SSH key to your account for secure Git operations.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="key-title">Title</Label>
            <Input id="key-title" placeholder="My SSH Key" value={title} onChange={(e) => setTitle(e.target.value)} />
            <p className="text-xs text-muted-foreground mt-1">Choose a descriptive name for this key</p>
          </div>
          <div>
            <Label htmlFor="public-key">Public Key</Label>
            <Textarea
              id="public-key"
              placeholder="ssh-rsa AAAAB3NzaC1yc2EAAAA... user@example.com"
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              rows={6}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Paste your public key here. It should start with ssh-rsa, ssh-ed25519, or ssh-ecdsa.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !title.trim() || !publicKey.trim()}>
            {loading ? "Adding..." : "Add SSH Key"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
