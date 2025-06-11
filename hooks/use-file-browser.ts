"use client"

import { useState, useEffect } from "react"
import { useToast } from "@/hooks/use-toast"

interface FileItem {
  name: string
  type: "file" | "directory"
  size?: number
  last_commit: {
    message: string
    author: string
    date: string
    sha: string
  }
}

export function useFileBrowser(repositoryFullName: string, path: string, ref: string) {
  const [files, setFiles] = useState<FileItem[]>([])
  const [readme, setReadme] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    fetchFiles()
  }, [repositoryFullName, path, ref])

  const fetchFiles = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        path: path || "",
        ref: ref || "main",
      })

      const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/contents?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch repository contents")
      }

      const data = await response.json()
      setFiles(data.files || [])
      setReadme(data.readme || null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch repository contents"
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
    files,
    readme,
    loading,
    error,
    fetchFiles,
  }
}
