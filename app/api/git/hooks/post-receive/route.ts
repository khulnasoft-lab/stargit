import { type NextRequest, NextResponse } from "next/server"
import { GitOperationsAPI } from "@/lib/api/git-operations"
import { supabase } from "@/lib/supabase"
import { webhookProcessor } from "@/lib/webhooks/event-processor"
import type { PushEvent } from "@/lib/webhooks/event-types"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repository, ref, branch, oldrev, newrev, user } = body

    // Parse repository owner and name
    const [owner, name] = repository.split("/")

    // Get repository from database
    const { data: repo, error } = await supabase.from("repositories").select("id").eq("full_name", repository).single()

    if (error || !repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 })
    }

    // Get commit information
    const gitOps = new GitOperationsAPI()
    const commitInfo = await gitOps.getCommitInfo(owner, name, newrev)

    // Create webhook payload
    const webhookPayload: PushEvent = {
      ref,
      before: oldrev,
      after: newrev,
      repository: {
        id: repo.id,
        name,
        full_name: repository,
        owner: {
          id: "", // Will be filled by webhook processor
          name: owner,
          type: owner.includes("/") ? "organization" : "user",
        },
        private: true, // Will be updated by webhook processor
        default_branch: "main", // Will be updated by webhook processor
      },
      sender: {
        id: "", // Will be filled by webhook processor
        name: user || "unknown",
      },
      created_at: new Date().toISOString(),
      commits: commitInfo.commits || [],
      head_commit: commitInfo.head_commit || {
        id: newrev,
        message: "No commit message",
        timestamp: new Date().toISOString(),
        author: {
          name: user || "unknown",
          email: "",
        },
        url: "",
      },
    }

    // Queue webhook event for processing
    const eventId = await webhookProcessor.queueEvent({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`,
      type: "push",
      repository,
      payload: webhookPayload,
      timestamp: Date.now(),
    })

    // Update repository metadata
    await gitOps.updateRepositoryMetadata(repo.id, {
      lastPushedAt: new Date().toISOString(),
      lastCommitId: newrev,
      lastCommitMessage: webhookPayload.head_commit?.message || "",
      lastCommitAuthor: webhookPayload.head_commit?.author?.name || "",
    })

    return NextResponse.json({ status: "success", event_id: eventId })
  } catch (error) {
    console.error("Post-receive hook error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
