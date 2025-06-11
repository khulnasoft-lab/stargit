"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface ActivityItem {
  id: string
  type: "commit" | "pull_request" | "issue" | "star" | "fork" | "merge"
  actor: {
    username: string
    avatar_url: string | null
  }
  repository: {
    name: string
    full_name: string
  }
  payload: any
  created_at: string
}

export function useActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchActivity()
  }, [])

  const fetchActivity = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch("/api/activity")
      if (!response.ok) {
        throw new Error("Failed to fetch activity")
      }

      const data = await response.json()
      setActivities(data.activities || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch activity"
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

  return {
    activities,
    loading,
    error,
    fetchActivity,
  }
}
