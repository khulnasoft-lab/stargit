"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitMerge, GitBranch, RotateCcw, Combine } from "lucide-react"

interface AdvancedOperationsProps {
  repositoryFullName: string
  branches: string[]
  commits: Array<{ sha: string; message: string }>
}

export function AdvancedOperations({ repositoryFullName, branches, commits }: AdvancedOperationsProps) {
  const [loading, setLoading] = useState(false)
  const [cherryPickData, setCherryPickData] = useState({
    commitSha: "",
    targetBranch: "",
  })
  const [rebaseData, setRebaseData] = useState({
    sourceBranch: "",
    targetBranch: "",
    interactive: false,
  })
  const [squashData, setSquashData] = useState({
    commits: [] as string[],
    message: "",
  })

  const performOperation = async (operation: string, data: any) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/repositories/${encodeURIComponent(repositoryFullName)}/operations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, ...data }),
      })

      if (response.ok) {
        // Show success message
        console.log(`${operation} completed successfully`)
      } else {
        throw new Error(`${operation} failed`)
      }
    } catch (error) {
      console.error(`${operation} failed:`, error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Advanced Git Operations</CardTitle>
          <CardDescription>
            Perform advanced Git operations like cherry-picking, rebasing, and squashing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cherry-pick" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="cherry-pick">Cherry Pick</TabsTrigger>
              <TabsTrigger value="rebase">Rebase</TabsTrigger>
              <TabsTrigger value="squash">Squash</TabsTrigger>
              <TabsTrigger value="revert">Revert</TabsTrigger>
            </TabsList>

            <TabsContent value="cherry-pick" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GitMerge className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Cherry Pick Commit</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="cherry-commit">Select Commit</Label>
                  <Select
                    value={cherryPickData.commitSha}
                    onValueChange={(value) => setCherryPickData({ ...cherryPickData, commitSha: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a commit" />
                    </SelectTrigger>
                    <SelectContent>
                      {commits.map((commit) => (
                        <SelectItem key={commit.sha} value={commit.sha}>
                          {commit.sha.substring(0, 8)} - {commit.message}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cherry-target">Target Branch</Label>
                  <Select
                    value={cherryPickData.targetBranch}
                    onValueChange={(value) => setCherryPickData({ ...cherryPickData, targetBranch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => performOperation("cherry-pick", cherryPickData)}
                  disabled={loading || !cherryPickData.commitSha || !cherryPickData.targetBranch}
                >
                  Cherry Pick Commit
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="rebase" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <GitBranch className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Rebase Branch</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="rebase-source">Source Branch</Label>
                  <Select
                    value={rebaseData.sourceBranch}
                    onValueChange={(value) => setRebaseData({ ...rebaseData, sourceBranch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose source branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="rebase-target">Target Branch</Label>
                  <Select
                    value={rebaseData.targetBranch}
                    onValueChange={(value) => setRebaseData({ ...rebaseData, targetBranch: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose target branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches.map((branch) => (
                        <SelectItem key={branch} value={branch}>
                          {branch}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={() => performOperation("rebase", rebaseData)}
                  disabled={loading || !rebaseData.sourceBranch || !rebaseData.targetBranch}
                >
                  Rebase Branch
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="squash" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Combine className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Squash Commits</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label>Select Commits to Squash</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {commits.slice(0, 10).map((commit) => (
                      <label key={commit.sha} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={squashData.commits.includes(commit.sha)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSquashData({
                                ...squashData,
                                commits: [...squashData.commits, commit.sha],
                              })
                            } else {
                              setSquashData({
                                ...squashData,
                                commits: squashData.commits.filter((sha) => sha !== commit.sha),
                              })
                            }
                          }}
                        />
                        <span className="text-sm">
                          {commit.sha.substring(0, 8)} - {commit.message}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <Label htmlFor="squash-message">Squash Commit Message</Label>
                  <Textarea
                    id="squash-message"
                    placeholder="Enter commit message for squashed commits"
                    value={squashData.message}
                    onChange={(e) => setSquashData({ ...squashData, message: e.target.value })}
                  />
                </div>
                <Button
                  onClick={() => performOperation("squash", squashData)}
                  disabled={loading || squashData.commits.length < 2 || !squashData.message}
                >
                  Squash Commits
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="revert" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <RotateCcw className="h-5 w-5" />
                <h3 className="text-lg font-semibold">Revert Commit</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="revert-commit">Select Commit to Revert</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a commit to revert" />
                    </SelectTrigger>
                    <SelectContent>
                      {commits.map((commit) => (
                        <SelectItem key={commit.sha} value={commit.sha}>
                          {commit.sha.substring(0, 8)} - {commit.message}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={() => performOperation("revert", { commitSha: "selected-commit" })} disabled={loading}>
                  Revert Commit
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
