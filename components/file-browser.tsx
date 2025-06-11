"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { File, Folder, GitCommit, Calendar, User, Download, Plus, Upload } from "lucide-react"
import Link from "next/link"
import { useFileBrowser } from "@/hooks/use-file-browser"

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

interface Repository {
  id: string
  name: string
  full_name: string
  default_branch: string
}

interface FileBrowserProps {
  repository: Repository
  path: string
  gitRef: string
}

export function FileBrowser({ repository, path, gitRef }: FileBrowserProps) {
  const { files, loading, error, readme } = useFileBrowser(repository.full_name, path, gitRef)

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 B"
    const k = 1024
    const sizes = ["B", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i]
  }

  const getFileIcon = (name: string, type: string) => {
    if (type === "directory") {
      return <Folder className="h-4 w-4 text-blue-500" />
    }

    const ext = name.split(".").pop()?.toLowerCase()
    switch (ext) {
      case "js":
      case "ts":
      case "jsx":
      case "tsx":
        return <File className="h-4 w-4 text-yellow-500" />
      case "py":
        return <File className="h-4 w-4 text-green-500" />
      case "md":
        return <File className="h-4 w-4 text-blue-500" />
      case "json":
        return <File className="h-4 w-4 text-orange-500" />
      default:
        return <File className="h-4 w-4 text-gray-500" />
    }
  }

  const breadcrumbs = path ? path.split("/").filter(Boolean) : []

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-muted rounded"></div>
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-1/6"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Failed to load repository contents</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <GitCommit className="h-4 w-4" />
              <span className="text-sm text-muted-foreground">Latest commit on {gitRef}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Button size="sm" variant="outline">
                <Plus className="h-4 w-4 mr-1" />
                Add file
              </Button>
              <Button size="sm" variant="outline">
                <Upload className="h-4 w-4 mr-1" />
                Upload files
              </Button>
              <Button size="sm" variant="outline">
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>

          {breadcrumbs.length > 0 && (
            <div className="flex items-center space-x-1 text-sm">
              <Link href={`/${repository.full_name}?tab=code`} className="hover:underline">
                {repository.name}
              </Link>
              {breadcrumbs.map((crumb, index) => (
                <span key={index}>
                  <span className="mx-1">/</span>
                  <Link
                    href={`/${repository.full_name}?tab=code&path=${breadcrumbs.slice(0, index + 1).join("/")}`}
                    className="hover:underline"
                  >
                    {crumb}
                  </Link>
                </span>
              ))}
            </div>
          )}
        </CardHeader>

        <CardContent className="p-0">
          <div className="border-t">
            {files.map((file, index) => (
              <div
                key={file.name}
                className={`flex items-center justify-between p-3 hover:bg-muted/50 ${
                  index !== files.length - 1 ? "border-b" : ""
                }`}
              >
                <div className="flex items-center space-x-3 flex-1 min-w-0">
                  {getFileIcon(file.name, file.type)}
                  <Link
                    href={
                      file.type === "directory"
                        ? `/${repository.full_name}?tab=code&path=${path ? `${path}/${file.name}` : file.name}`
                        : `/${repository.full_name}/blob/${gitRef}/${path ? `${path}/${file.name}` : file.name}`
                    }
                    className="font-medium hover:underline truncate"
                  >
                    {file.name}
                  </Link>
                </div>

                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="hidden md:block max-w-xs truncate">
                    <Link href={`/${repository.full_name}/commit/${file.last_commit.sha}`} className="hover:underline">
                      {file.last_commit.message}
                    </Link>
                  </div>
                  <div className="flex items-center space-x-1">
                    <User className="h-3 w-3" />
                    <span>{file.last_commit.author}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{new Date(file.last_commit.date).toLocaleDateString()}</span>
                  </div>
                  {file.size && <span className="text-xs">{formatFileSize(file.size)}</span>}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {readme && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <File className="h-5 w-5" />
              <span>README.md</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: readme }} />
          </CardContent>
        </Card>
      )}
    </div>
  )
}
