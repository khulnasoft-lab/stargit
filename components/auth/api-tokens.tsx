"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Plus, Trash2, Copy } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface ApiToken {
  id: string
  name: string
  token_prefix: string
  scopes: string[]
  last_used_at?: string
  expires_at?: string
  created_at: string
}

export function ApiTokens() {
  const [tokens, setTokens] = useState<ApiToken[]>([])
  const [loading, setLoading] = useState(true)
  const [newToken, setNewToken] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchTokens()
  }, [])

  const fetchTokens = async () => {
    try {
      const response = await fetch("/api/auth/tokens")
      const data = await response.json()
      setTokens(data.tokens || [])
    } catch (error) {
      toast({ title: "Error", description: "Failed to fetch API tokens", variant: "destructive" })
    } finally {
      setLoading(false)
    }
  }

  const createToken = async (name: string, scopes: string[], expiresInDays?: number) => {
    try {
      const response = await fetch("/api/auth/tokens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, scopes, expiresInDays }),
      })

      if (!response.ok) throw new Error("Failed to create token")

      const data = await response.json()
      setNewToken(data.token)
      await fetchTokens()
      toast({ title: "API token created successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const revokeToken = async (tokenId: string) => {
    try {
      const response = await fetch(`/api/auth/tokens/${tokenId}`, {
        method: "DELETE",
      })

      if (!response.ok) throw new Error("Failed to revoke token")

      await fetchTokens()
      toast({ title: "API token revoked successfully" })
    } catch (error) {
      toast({ title: "Error", description: (error as Error).message, variant: "destructive" })
    }
  }

  const copyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast({ title: "Token copied to clipboard" })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            API Tokens
            <CreateTokenDialog onCreateToken={createToken} />
          </CardTitle>
          <CardDescription>Manage your API tokens for programmatic access to repositories</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading tokens...</div>
          ) : tokens.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No API tokens created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Token</TableHead>
                  <TableHead>Scopes</TableHead>
                  <TableHead>Last Used</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((token) => (
                  <TableRow key={token.id}>
                    <TableCell className="font-medium">{token.name}</TableCell>
                    <TableCell>
                      <code className="text-sm bg-muted px-2 py-1 rounded">{token.token_prefix}...</code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="secondary" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.last_used_at ? formatDate(token.last_used_at) : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {token.expires_at ? formatDate(token.expires_at) : "Never"}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => revokeToken(token.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {newToken && (
        <Card className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
          <CardHeader>
            <CardTitle className="text-green-800 dark:text-green-200">New API Token Created</CardTitle>
            <CardDescription className="text-green-700 dark:text-green-300">
              Make sure to copy your token now. You won't be able to see it again!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Input value={newToken} readOnly className="font-mono text-sm" />
              <Button size="sm" onClick={() => copyToken(newToken)}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewToken(null)}>
              I've saved my token
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function CreateTokenDialog({
  onCreateToken,
}: { onCreateToken: (name: string, scopes: string[], expiresInDays?: number) => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>(["repo:read"])
  const [expiresInDays, setExpiresInDays] = useState<string>("")

  const availableScopes = {
    "*": "Full access",
    "repo:read": "Read repositories",
    "repo:write": "Write repositories",
    "repo:admin": "Admin repositories",
    "user:read": "Read user profile",
    "user:write": "Write user profile",
    "org:read": "Read organizations",
    "org:write": "Write organizations",
    "org:admin": "Admin organizations",
  }

  const handleSubmit = () => {
    if (!name.trim()) return

    const expires = expiresInDays ? Number.parseInt(expiresInDays) : undefined
    onCreateToken(name, selectedScopes, expires)

    // Reset form
    setName("")
    setSelectedScopes(["repo:read"])
    setExpiresInDays("")
    setOpen(false)
  }

  const toggleScope = (scope: string) => {
    setSelectedScopes((prev) => (prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Token
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create API Token</DialogTitle>
          <DialogDescription>Generate a new API token for programmatic access</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="token-name">Token Name</Label>
            <Input id="token-name" placeholder="My API Token" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <Label>Scopes</Label>
            <div className="space-y-2 mt-2">
              {Object.entries(availableScopes).map(([scope, description]) => (
                <div key={scope} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={scope}
                    checked={selectedScopes.includes(scope)}
                    onChange={() => toggleScope(scope)}
                    className="rounded"
                  />
                  <Label htmlFor={scope} className="text-sm">
                    <code className="text-xs bg-muted px-1 rounded">{scope}</code> - {description}
                  </Label>
                </div>
              ))}
            </div>
          </div>
          <div>
            <Label htmlFor="expires">Expires in (days)</Label>
            <Input
              id="expires"
              type="number"
              placeholder="30 (leave empty for no expiration)"
              value={expiresInDays}
              onChange={(e) => setExpiresInDays(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!name.trim() || selectedScopes.length === 0}>
            Create Token
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
