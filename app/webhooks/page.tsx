import { DashboardHeader } from "@/components/dashboard-header"
import { DashboardShell } from "@/components/dashboard-shell"
import { WebhooksTable } from "@/components/webhooks-table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Webhook } from "lucide-react"
import Link from "next/link"

export default function WebhooksPage() {
  return (
    <DashboardShell>
      <DashboardHeader heading="Webhooks" text="Manage your webhook endpoints and delivery settings.">
        <Button asChild>
          <Link href="/webhooks/new">
            <Webhook className="mr-2 h-4 w-4" />
            New Webhook
          </Link>
        </Button>
      </DashboardHeader>

      <div className="flex items-center py-4">
        <Input placeholder="Search webhooks..." className="max-w-sm" />
      </div>

      <WebhooksTable />
    </DashboardShell>
  )
}
