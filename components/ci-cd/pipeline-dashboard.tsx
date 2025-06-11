"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Play, Square, RefreshCw, Settings, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react"

interface Build {
  id: string
  number: number
  status: "pending" | "running" | "success" | "failure" | "cancelled"
  branch: string
  commit: {
    sha: string
    message: string
    author: string
  }
  startedAt: string
  finishedAt?: string
  duration?: number
  pipeline: {
    id: string
    name: string
    provider: string
  }
}

interface Pipeline {
  id: string
  name: string
  provider: "github-actions" | "gitlab-ci" | "jenkins" | "circleci"
  status: "active" | "inactive"
  lastRun?: string
  successRate: number
}

interface PipelineDashboardProps {
  repositoryFullName: string
}

export function PipelineDashboard({ repositoryFullName }: PipelineDashboardProps) {
  const [builds, setBuilds] = useState<Build[]>([])
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBranch, setSelectedBranch] = useState("all")

  useEffect(() => {
    fetchData()
  }, [repositoryFullName, selectedBranch])

  const fetchData = async () => {
    try {
      const [buildsResponse, pipelinesResponse] = await Promise.all([
        fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/builds?branch=${selectedBranch}`),
        fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/ci-cd`),
      ])

      const buildsData = await buildsResponse.json()
      const pipelinesData = await pipelinesResponse.json()

      setBuilds(buildsData.builds || [])
      setPipelines(pipelinesData.pipelines || [])
    } catch (error) {
      console.error("Failed to fetch CI/CD data:", error)
    } finally {
      setLoading(false)
    }
  }

  const triggerBuild = async (pipelineId: string, branch = "main") => {
    try {
      await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/builds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pipelineId, branch }),
      })
      await fetchData()
    } catch (error) {
      console.error("Failed to trigger build:", error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failure":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "running":
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      case "cancelled":
        return <Square className="h-4 w-4 text-gray-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "failure":
        return "bg-red-500"
      case "running":
        return "bg-blue-500"
      case "pending":
        return "bg-yellow-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading CI/CD data...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CI/CD Dashboard</h2>
          <p className="text-muted-foreground">Monitor builds and deployments</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All branches</SelectItem>
              <SelectItem value="main">main</SelectItem>
              <SelectItem value="develop">develop</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">{builds.length}</div>
            <div className="text-sm text-muted-foreground">Total Builds</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">
              {builds.filter((b) => b.status === "success").length}
            </div>
            <div className="text-sm text-muted-foreground">Successful</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{builds.filter((b) => b.status === "failure").length}</div>
            <div className="text-sm text-muted-foreground">Failed</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">
              {builds.filter((b) => b.status === "running").length}
            </div>
            <div className="text-sm text-muted-foreground">Running</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="builds" className="w-full">
        <TabsList>
          <TabsTrigger value="builds">Recent Builds</TabsTrigger>
          <TabsTrigger value="pipelines">Pipelines</TabsTrigger>
        </TabsList>

        <TabsContent value="builds" className="space-y-4">
          {builds.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">No builds found</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {builds.map((build) => (
                <Card key={build.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(build.status)}
                        <div>
                          <div className="font-medium">
                            Build #{build.number} • {build.branch}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {build.commit.message} by {build.commit.author}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {build.commit.sha.substring(0, 8)} • {build.pipeline.name}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{build.status}</Badge>
                        {build.duration && <Badge variant="outline">{formatDuration(build.duration)}</Badge>}
                        {build.status === "running" && (
                          <div className="w-20">
                            <Progress value={65} className="h-2" />
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="pipelines" className="space-y-4">
          {pipelines.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center text-muted-foreground">No pipelines configured</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {pipelines.map((pipeline) => (
                <Card key={pipeline.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${pipeline.status === "active" ? "bg-green-500" : "bg-gray-500"}`}
                        />
                        <div>
                          <div className="font-medium">{pipeline.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {pipeline.provider} • {pipeline.successRate}% success rate
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={pipeline.status === "active" ? "default" : "secondary"}>
                          {pipeline.status}
                        </Badge>
                        <Button variant="outline" size="sm" onClick={() => triggerBuild(pipeline.id)}>
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
