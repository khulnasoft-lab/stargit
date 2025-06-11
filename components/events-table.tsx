"use client"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Eye, GitBranch, GitCommit, GitPullRequest, Bug } from "lucide-react"
import { useState, useEffect } from "react"

interface Event {
  id: string
  type: string
  repo: string
  branch: string | null
  author: string
  timestamp: string
  payload: any
  status: string
}

export function EventsTable() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data.events)
        setLoading(false)
      })
      .catch((err) => {
        console.error("Failed to fetch events:", err)
        setLoading(false)
      })
  }, [])

  const getEventIcon = (type: string) => {
    switch (type) {
      case "push":
        return <GitCommit className="h-4 w-4" />
      case "pull_request":
        return <GitPullRequest className="h-4 w-4" />
      case "issue":
        return <Bug className="h-4 w-4" />
      case "release":
        return <GitBranch className="h-4 w-4" />
      default:
        return <GitCommit className="h-4 w-4" />
    }
  }

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading events...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Events</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Timestamp</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>
                  <div className="flex items-center space-x-2">
                    {getEventIcon(event.type)}
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{event.repo}</TableCell>
                <TableCell>
                  {event.branch ? (
                    <Badge variant="secondary">{event.branch}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell>{event.author}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{formatTimestamp(event.timestamp)}</TableCell>
                <TableCell>
                  <Badge variant={event.status === "delivered" ? "default" : "destructive"}>{event.status}</Badge>
                </TableCell>
                <TableCell>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4" />
                        <span className="sr-only">View details</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[80vh]">
                      <DialogHeader>
                        <DialogTitle>Event Details</DialogTitle>
                        <DialogDescription>
                          {event.type} event from {event.repo}
                        </DialogDescription>
                      </DialogHeader>
                      <ScrollArea className="h-[60vh]">
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Event ID</h4>
                              <p className="text-sm text-muted-foreground">{event.id}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">Type</h4>
                              <p className="text-sm text-muted-foreground">{event.type}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">Repository</h4>
                              <p className="text-sm text-muted-foreground">{event.repo}</p>
                            </div>
                            <div>
                              <h4 className="font-medium">Author</h4>
                              <p className="text-sm text-muted-foreground">{event.author}</p>
                            </div>
                          </div>
                          <div>
                            <h4 className="font-medium mb-2">Payload</h4>
                            <pre className="json-view text-xs">{JSON.stringify(event.payload, null, 2)}</pre>
                          </div>
                        </div>
                      </ScrollArea>
                    </DialogContent>
                  </Dialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
