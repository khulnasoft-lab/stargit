"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface Repository {
  id: string
  name: string
  full_name: string
  description: string | null
  visibility: "public" | "private" | "internal"
  default_branch: string
  stars_count: number
  forks_count: number
  updated_at: string
  language: string | null
  owner: {
    username: string
    avatar_url: string | null
  }
  organization?: {
    name: string
    avatar_url: string | null
  }
}

export function useRepositories() {
  const [repositories, setRepositories] = useState<Repository[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchRepositories()
  }, [])

  const fetchRepositories = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/repositories")
      if (!response.ok) {
        throw new Error("Failed to fetch repositories")
      }

      const data = await response.json()
      setRepositories(data.repositories || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch repositories"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const createRepository = async (repoData: {
    name: string
    description?: string
    visibility: "public" | "private" | "internal"
    initialize_with_readme?: boolean
  }) => {
    try {
      const response = await fetch("/api/repositories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(repoData),
      })

      if (!response.ok) {
        throw new Error("Failed to create repository")
      }

      const data = await response.json()
      setRepositories((prev) => [data.repository, ...prev])

      toast({
        title: "Repository created",
        description: `Successfully created ${data.repository.name}`,
      })

      return data.repository
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create repository"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    }
  }

  const deleteRepository = async (repositoryId: string) => {
    try {
      const response = await fetch(`/api/repositories/${repositoryId}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error("Failed to delete repository")
      }

      setRepositories((prev) => prev.filter((repo) => repo.id !== repositoryId))

      toast({
        title: "Repository deleted",
        description: "Repository has been successfully deleted",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete repository"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
      throw err
    }
  }

  return {
    repositories,
    loading,
    error,
    fetchRepositories,
    createRepository,
    deleteRepository,
  }
}
