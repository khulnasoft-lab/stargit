"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
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
import { Key, Plus, Trash2, Copy, Calendar, Shield } from "lucide-react"

interface PersonalAccessToken {
  id: string
  name: string
  token: string
  scopes: string[]
  created_at: string
  last_used: string | null
  expires_at: string | null
  is_active: boolean
}

const AVAILABLE_SCOPES = [
  { id: "repo", name: "Repository Access", description: "Full control of private repositories" },
  { id: "repo:status", name: "Repository Status", description: "Access commit status" },
  { id: "repo_deployment", name: "Repository Deployment", description: "Access deployment status" },
  { id: "public_repo", name: "Public Repository", description: "Access public repositories" },
  { id: "repo:invite", name: "Repository Invitations", description: "Access repository invitations" },
  { id: "user", name: "User Profile", description: "Update user profile information" },
  { id: "user:email", name: "User Email", description: "Access user email addresses" },
  { id: "user:follow", name: "User Follow", description: "Follow and unfollow users" },
  { id: "admin:org", name: "Organization Admin", description: "Full control of organizations" },
  { id: "admin:org_hook", name: "Organization Hooks", description: "Manage organization webhooks" },
]

export function PersonalAccessTokens() {
  const { toast } = useToast()
  const [tokens, setTokens] = useState<PersonalAccessToken[]>([
    {
      id: "1",
      name: "Development Token",
      token: "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      scopes: ["repo", "user"],
      created_at: "2024-01-15T10:30:00Z",
      last_used: "2024-01-20T14:22:00Z",
      expires_at: "2024-12-31T23:59:59Z",
      is_active: true,
    },
    {
      id: "2",
      name: "CI/CD Pipeline",
      token: "ghp_yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy",
      scopes: ["repo", "repo:status"],
      created_at: "2024-01-10T08:15:00Z",
      last_used: null,
      expires_at: null,
      is_active: true,
    },
  ])

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [newTokenName, setNewTokenName] = useState("")
  const [selectedScopes, setSelectedScopes] = useState<string[]>([])
  const [expirationDays, setExpirationDays] = useState("30")
  const [isCreating, setIsCreating] = useState(false)
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<string | null>(null)

  const handleCreateToken = async () => {
    if (!newTokenName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token name.",
        variant: "destructive",
      })
      return
    }

    if (selectedScopes.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one scope.",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const newToken = `ghp_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`
      const expiresAt =
        expirationDays === "never"
          ? null
          : new Date(Date.now() + Number.parseInt(expirationDays) * 24 * 60 * 60 * 1000).toISOString()

      const token: PersonalAccessToken = {
        id: Date.now().toString(),
        name: newTokenName,
        token: newToken,
        scopes: selectedScopes,
        created_at: new Date().toISOString(),
        last_used: null,
        expires_at: expiresAt,
        is_active: true,
      }

      setTokens((prev) => [token, ...prev])
      setNewlyCreatedToken(newToken)
      setNewTokenName("")
      setSelectedScopes([])
      setExpirationDays("30")

      toast({
        title: "Token created",
        description: "Your personal access token has been created successfully.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create token. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteToken = async (tokenId: string) => {
    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 500))

      setTokens((prev) => prev.filter((token) => token.id !== tokenId))

      toast({
        title: "Token deleted",
        description: "The personal access token has been deleted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete token. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token)
    toast({
      title: "Copied",
      description: "Token copied to clipboard.",
    })
  }

  const handleScopeChange = (scopeId: string, checked: boolean) => {
    if (checked) {
      setSelectedScopes((prev) => [...prev, scopeId])
    } else {
      setSelectedScopes((prev) => prev.filter((id) => id !== scopeId))
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  }

  const isTokenExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false
    return new Date(expiresAt) < new Date()
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Personal Access Tokens
              </CardTitle>
              <CardDescription>Manage your personal access tokens for API and Git operations.</CardDescription>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate New Token
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Create Personal Access Token</DialogTitle>
                  <DialogDescription>
                    Generate a new personal access token for API access and Git operations.
                  </DialogDescription>
                </DialogHeader>

                {newlyCreatedToken ? (
                  <div className="space-y-4">
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center gap-2 text-green-800 font-medium mb-2">
                        <Shield className="h-4 w-4" />
                        Token Created Successfully
                      </div>
                      <p className="text-sm text-green-700 mb-3">
                        Make sure to copy your personal access token now. You won't be able to see it again!
                      </p>
                      <div className="flex items-center gap-2">
                        <Input value={newlyCreatedToken} readOnly className="font-mono text-sm" />
                        <Button size="sm" variant="outline" onClick={() => handleCopyToken(newlyCreatedToken)}>
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="token-name">Token Name</Label>
                      <Input
                        id="token-name"
                        value={newTokenName}
                        onChange={(e) => setNewTokenName(e.target.value)}
                        placeholder="Enter a descriptive name for your token"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="expiration">Expiration</Label>
                      <select
                        id="expiration"
                        value={expirationDays}
                        onChange={(e) => setExpirationDays(e.target.value)}
                        className="w-full px-3 py-2 border border-input bg-background rounded-md"
                      >
                        <option value="7">7 days</option>
                        <option value="30">30 days</option>
                        <option value="60">60 days</option>
                        <option value="90">90 days</option>
                        <option value="never">No expiration</option>
                      </select>
                    </div>

                    <div className="space-y-3">
                      <Label>Select Scopes</Label>
                      <div className="space-y-3 max-h-60 overflow-y-auto">
                        {AVAILABLE_SCOPES.map((scope) => (
                          <div key={scope.id} className="flex items-start space-x-3">
                            <Checkbox
                              id={scope.id}
                              checked={selectedScopes.includes(scope.id)}
                              onCheckedChange={(checked) => handleScopeChange(scope.id, checked as boolean)}
                            />
                            <div className="space-y-1">
                              <Label htmlFor={scope.id} className="text-sm font-medium cursor-pointer">
                                {scope.name}
                              </Label>
                              <p className="text-xs text-muted-foreground">{scope.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <DialogFooter>
                  {newlyCreatedToken ? (
                    <Button
                      onClick={() => {
                        setNewlyCreatedToken(null)
                        setIsCreateDialogOpen(false)
                      }}
                    >
                      Done
                    </Button>
                  ) : (
                    <>
                      <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateToken} disabled={isCreating}>
                        {isCreating ? "Creating..." : "Generate Token"}
                      </Button>
                    </>
                  )}
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {tokens.length === 0 ? (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No personal access tokens</h3>
              <p className="text-muted-foreground mb-4">You haven't created any personal access tokens yet.</p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Generate Your First Token
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {tokens.map((token) => (
                <div key={token.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <h3 className="font-medium">{token.name}</h3>
                      {isTokenExpired(token.expires_at) ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : (
                        <Badge variant="secondary">Active</Badge>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteToken(token.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        Created {formatDate(token.created_at)}
                      </span>
                      {token.expires_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Expires {formatDate(token.expires_at)}
                        </span>
                      )}
                      {token.last_used && <span>Last used {formatDate(token.last_used)}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span>Scopes:</span>
                      <div className="flex gap-1">
                        {token.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">
                            {scope}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="flex items-center gap-2">
                    <Input
                      value={`${token.token.substring(0, 7)}${"*".repeat(32)}`}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button size="sm" variant="outline" onClick={() => handleCopyToken(token.token)}>
                      <Copy className="h-4 w-4" />
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
