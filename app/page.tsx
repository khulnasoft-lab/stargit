import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { EventOverview } from "@/components/event-overview"
import { RecentEvents } from "@/components/recent-events"
import { WebhookHealth } from "@/components/webhook-health"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ActivitySquare, ArrowUpRight, Router, Shield, Webhook } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Dashboard" text="Monitor your Git events and webhook activity.">
        <Button asChild>
          <Link href="/webhooks/new">
            <Webhook className="mr-2 h-4 w-4" />
            New Webhook
          </Link>
        </Button>
      </DashboardHeader>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Events</CardTitle>
                <ActivitySquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2,853</div>
                <p className="text-xs text-muted-foreground">+249 from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Webhooks</CardTitle>
                <Webhook className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 new this month</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">99.8%</div>
                <p className="text-xs text-muted-foreground">+0.2% from last week</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Rules</CardTitle>
                <Router className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24</div>
                <p className="text-xs text-muted-foreground">+5 since last month</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Event Activity</CardTitle>
                <CardDescription>Event volume across all sources in the past 30 days.</CardDescription>
              </CardHeader>
              <CardContent className="px-2">
                <EventOverview />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Webhook Health</CardTitle>
                <CardDescription>Status and health of your active webhooks.</CardDescription>
              </CardHeader>
              <CardContent>
                <WebhookHealth />
              </CardContent>
              <CardFooter>
                <Button size="sm" variant="ghost" asChild className="w-full">
                  <Link href="/webhooks" className="flex items-center justify-center">
                    View all webhooks
                    <ArrowUpRight className="ml-1 h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Recent Events</CardTitle>
              <CardDescription>Latest Git events received across all webhooks.</CardDescription>
            </CardHeader>
            <CardContent>
              <RecentEvents />
            </CardContent>
            <CardFooter>
              <Button size="sm" variant="ghost" asChild className="w-full">
                <Link href="/events" className="flex items-center justify-center">
                  View all events
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Events</CardTitle>
              <CardDescription>All Git events received across your webhooks.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  This tab would contain a full events explorer with advanced filtering.
                </p>
                <Button className="mt-4" asChild>
                  <Link href="/events">Go to Events Explorer</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhooks</CardTitle>
              <CardDescription>Manage your webhook endpoints and configurations.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">This tab would contain your webhook management interface.</p>
                <Button className="mt-4" asChild>
                  <Link href="/webhooks">Manage Webhooks</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
