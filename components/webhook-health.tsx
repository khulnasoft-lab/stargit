import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, AlertCircle } from "lucide-react"

const webhooks = [
  { name: "Production API", status: "healthy", lastPing: "2 min ago" },
  { name: "Staging Environment", status: "healthy", lastPing: "5 min ago" },
  { name: "CI/CD Pipeline", status: "healthy", lastPing: "1 min ago" },
  { name: "Analytics System", status: "error", lastPing: "2 hours ago" },
  { name: "Documentation", status: "warning", lastPing: "15 min ago" },
]

export function WebhookHealth() {
  return (
    <div className="space-y-4">
      {webhooks.map((webhook) => (
        <div key={webhook.name} className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {webhook.status === "healthy" && <CheckCircle className="h-4 w-4 text-green-500" />}
            {webhook.status === "error" && <XCircle className="h-4 w-4 text-red-500" />}
            {webhook.status === "warning" && <AlertCircle className="h-4 w-4 text-yellow-500" />}
            <div>
              <p className="text-sm font-medium">{webhook.name}</p>
              <p className="text-xs text-muted-foreground">{webhook.lastPing}</p>
            </div>
          </div>
          <Badge
            variant={
              webhook.status === "healthy" ? "default" : webhook.status === "error" ? "destructive" : "secondary"
            }
          >
            {webhook.status}
          </Badge>
        </div>
      ))}
    </div>
  )
}
