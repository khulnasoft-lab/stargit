import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { EventsTable } from "@/components/events-table"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Filter, RefreshCw } from "lucide-react"

export default function EventsPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Event Explorer" text="View and search all Git events across your repositories.">
        <Button variant="outline" size="icon">
          <RefreshCw className="h-4 w-4" />
          <span className="sr-only">Refresh</span>
        </Button>
      </DashboardHeader>

      <div className="space-y-4">
        <Card className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 flex flex-col md:flex-row gap-4">
              <Input placeholder="Search events..." className="md:max-w-sm" />
              <Select defaultValue="all">
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="pull_request">Pull Request</SelectItem>
                  <SelectItem value="issue">Issue</SelectItem>
                  <SelectItem value="release">Release</SelectItem>
                </SelectContent>
              </Select>
              <Select defaultValue="all">
                <SelectTrigger className="md:w-[180px]">
                  <SelectValue placeholder="Repository" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Repositories</SelectItem>
                  <SelectItem value="stargit">stargit</SelectItem>
                  <SelectItem value="webhook-proxy">webhook-proxy</SelectItem>
                  <SelectItem value="event-tracker">event-tracker</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                More Filters
              </Button>
            </div>
          </div>
        </Card>

        <EventsTable />
      </div>
    </DashboardShell>
  )
}
