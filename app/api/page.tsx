import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { ApiDocumentation } from "@/components/api-documentation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { CodeIcon } from "lucide-react"

export default function ApiPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="API Documentation" text="Integrate with the StarGit Event Tracker API.">
        <div className="flex items-center rounded-md bg-muted px-3 py-1 text-sm">
          <CodeIcon className="mr-2 h-4 w-4" />
          v1.0
        </div>
      </DashboardHeader>

      <Tabs defaultValue="rest" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rest">REST API</TabsTrigger>
          <TabsTrigger value="graphql">GraphQL API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Spec</TabsTrigger>
          <TabsTrigger value="sdks">SDKs</TabsTrigger>
        </TabsList>

        <TabsContent value="rest" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>REST API Reference</CardTitle>
              <CardDescription>Complete reference for the StarGit REST API endpoints.</CardDescription>
            </CardHeader>
            <CardContent>
              <ApiDocumentation />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="graphql" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>GraphQL API</CardTitle>
              <CardDescription>Query exactly what you need with our GraphQL API.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  This section would contain the GraphQL schema explorer and documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webhooks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Specification</CardTitle>
              <CardDescription>Details on webhook payloads and signature verification.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-10">
                <p className="text-muted-foreground">
                  This section would contain the webhook specification documentation.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sdks" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Client Libraries</CardTitle>
              <CardDescription>Official SDKs for popular programming languages.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">TypeScript/JavaScript</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">Install via npm:</p>
                    <div className="bg-muted p-2 rounded-md font-mono text-sm">npm install @stargit/sdk</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Python</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">Install via pip:</p>
                    <div className="bg-muted p-2 rounded-md font-mono text-sm">pip install stargit-sdk</div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Go</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm mb-2">Install via go get:</p>
                    <div className="bg-muted p-2 rounded-md font-mono text-sm">go get github.com/stargit/sdk-go</div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </DashboardShell>
  )
}
