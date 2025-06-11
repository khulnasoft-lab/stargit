"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Github, Gitlab, Chrome, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface OAuthProvider {
  id: string
  name: string
  enabled: boolean
}

export function OAuthProviders() {
  const [providers, setProviders] = useState<OAuthProvider[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    try {
      setError(null)
      const response = await fetch("/api/auth/oauth/providers")

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      setProviders(data.providers || [])
    } catch (error) {
      console.error("Failed to fetch OAuth providers:", error)
      setError(error instanceof Error ? error.message : "Failed to load authentication providers")
      toast({
        title: "Error",
        description: "Failed to load authentication providers",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOAuthLogin = (providerName: string) => {
    try {
      const redirectUrl = `/api/auth/oauth/authorize/${providerName}`
      window.location.href = redirectUrl
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initiate authentication",
        variant: "destructive",
      })
    }
  }

  const getProviderIcon = (name: string) => {
    switch (name.toLowerCase()) {
      case "github":
        return <Github className="h-5 w-5" />
      case "gitlab":
        return <Gitlab className="h-5 w-5" />
      case "google":
        return <Chrome className="h-5 w-5" />
      default:
        return null
    }
  }

  const getProviderLabel = (name: string) => {
    switch (name.toLowerCase()) {
      case "github":
        return "GitHub"
      case "gitlab":
        return "GitLab"
      case "google":
        return "Google"
      default:
        return name.charAt(0).toUpperCase() + name.slice(1)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Loading authentication options...</span>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            <p className="mb-4">{error}</p>
            <Button onClick={fetchProviders} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in with OAuth</CardTitle>
        <CardDescription>Choose your preferred authentication provider</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {providers.length > 0 ? (
          providers.map((provider) => (
            <Button
              key={provider.id}
              variant="outline"
              className="w-full justify-start"
              onClick={() => handleOAuthLogin(provider.name)}
            >
              {getProviderIcon(provider.name)}
              <span className="ml-2">Continue with {getProviderLabel(provider.name)}</span>
            </Button>
          ))
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">No OAuth providers configured</p>
        )}
      </CardContent>
    </Card>
  )
}
