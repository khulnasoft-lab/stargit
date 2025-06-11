"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Trash2, FileText, HardDrive } from "lucide-react"
import { formatBytes } from "@/lib/utils"

interface LFSObject {
  oid: string
  size: number
  filename: string
  uploadedAt: string
  downloadCount: number
}

interface LFSManagerProps {
  repositoryFullName: string
}

export function LFSManager({ repositoryFullName }: LFSManagerProps) {
  const [objects, setObjects] = useState<LFSObject[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    fetchLFSObjects()
  }, [repositoryFullName])

  const fetchLFSObjects = async () => {
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/lfs`)
      const data = await response.json()
      setObjects(data.objects || [])
    } catch (error) {
      console.error("Failed to fetch LFS objects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setUploadProgress(0)

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Simulate upload progress
        const progressInterval = setInterval(() => {
          setUploadProgress((prev) => Math.min(prev + 10, 90))
        }, 100)

        // Upload file logic would go here
        await new Promise((resolve) => setTimeout(resolve, 1000))

        clearInterval(progressInterval)
        setUploadProgress(100)
      }

      await fetchLFSObjects()
    } catch (error) {
      console.error("Upload failed:", error)
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const deleteObject = async (oid: string) => {
    try {
      await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/lfs/${oid}`, {
        method: "DELETE",
      })
      await fetchLFSObjects()
    } catch (error) {
      console.error("Failed to delete LFS object:", error)
    }
  }

  const totalSize = objects.reduce((sum, obj) => sum + obj.size, 0)

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading LFS objects...</div>
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Git LFS Storage
          </CardTitle>
          <CardDescription>Manage large files with Git Large File Storage</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{objects.length}</div>
              <div className="text-sm text-muted-foreground">Objects</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
              <div className="text-sm text-muted-foreground">Total Size</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{objects.reduce((sum, obj) => sum + obj.downloadCount, 0)}</div>
              <div className="text-sm text-muted-foreground">Downloads</div>
            </div>
          </div>

          <Tabs defaultValue="objects" className="w-full">
            <TabsList>
              <TabsTrigger value="objects">Objects</TabsTrigger>
              <TabsTrigger value="upload">Upload</TabsTrigger>
            </TabsList>

            <TabsContent value="objects" className="space-y-4">
              {objects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No LFS objects found</div>
              ) : (
                <div className="space-y-2">
                  {objects.map((object) => (
                    <div key={object.oid} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium">{object.filename}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatBytes(object.size)} • {object.downloadCount} downloads
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{object.oid.substring(0, 8)}</Badge>
                        <Button variant="ghost" size="sm" onClick={() => deleteObject(object.oid)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="file-upload">Upload Large Files</Label>
                  <Input
                    id="file-upload"
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="mt-2"
                  />
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} />
                  </div>
                )}

                <div className="text-sm text-muted-foreground">
                  Files larger than 100MB will be automatically tracked with Git LFS.
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
