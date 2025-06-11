"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  ActivitySquare,
  BarChart3,
  Code,
  Cog,
  FileJson,
  Home,
  History,
  LogOut,
  Webhook,
  GitPullRequestIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarProps {
  className?: string
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn("pb-12 w-64 border-r hidden md:block", className)}>
      <div className="space-y-4 py-4">
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Dashboard</h2>
          <div className="space-y-1">
            <Link
              href="/"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <Home className="mr-2 h-4 w-4" />
              Overview
            </Link>
            <Link
              href="/events"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/events" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <ActivitySquare className="mr-2 h-4 w-4" />
              Events
            </Link>
            <Link
              href="/webhooks"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/webhooks" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <Webhook className="mr-2 h-4 w-4" />
              Webhooks
            </Link>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Analytics</h2>
          <div className="space-y-1">
            <Link
              href="/analytics/activity"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/analytics/activity" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <BarChart3 className="mr-2 h-4 w-4" />
              Activity
            </Link>
            <Link
              href="/analytics/performance"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/analytics/performance" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <FileJson className="mr-2 h-4 w-4" />
              Performance
            </Link>
            <Link
              href="/analytics/history"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/analytics/history" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <History className="mr-2 h-4 w-4" />
              History
            </Link>
          </div>
        </div>
        <div className="px-4 py-2">
          <h2 className="mb-2 px-2 text-lg font-semibold tracking-tight">Tools</h2>
          <div className="space-y-1">
            <Link
              href="/api"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/api" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <Code className="mr-2 h-4 w-4" />
              API
            </Link>
            <Link
              href="/workflow"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/workflow" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <GitPullRequestIcon className="mr-2 h-4 w-4" />
              Workflows
            </Link>
            <Link
              href="/settings"
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === "/settings" ? "bg-accent text-accent-foreground" : "text-muted-foreground",
              )}
            >
              <Cog className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>
      <div className="px-4 absolute bottom-4 w-64">
        <div className="flex items-center border-t pt-4">
          <img src="/placeholder.svg?height=32&width=32" alt="User avatar" className="h-8 w-8 rounded-full mr-2" />
          <div className="text-sm">
            <div className="font-medium">Admin User</div>
            <div className="text-muted-foreground text-xs">admin@stargit.dev</div>
          </div>
          <button className="ml-auto">
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}
