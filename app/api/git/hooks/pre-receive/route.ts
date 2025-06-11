import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib/supabase"
import { PermissionService } from "@/lib/auth/permissions"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { repository, ref, ref_type, branch, oldrev, newrev, user } = body

    // Parse repository owner and name
    const [owner, name] = repository.split("/")

    // Get repository from database
    const { data: repo, error } = await supabase
      .from("repositories")
      .select(`
        id,
        owner_id,
        organization_id,
        visibility,
        default_branch,
        protected_branches
      `)
      .eq("full_name", repository)
      .single()

    if (error || !repo) {
      return NextResponse.json(
        {
          allowed: false,
          message: "Repository not found",
        },
        { status: 404 },
      )
    }

    // Get user from database
    const { data: userData } = await supabase.from("users").select("id").eq("username", user).single()

    if (!userData) {
      return NextResponse.json(
        {
          allowed: false,
          message: "User not found",
        },
        { status: 404 },
      )
    }

    // Check if branch is protected
    if (
      ref_type === "branch" &&
      repo.protected_branches &&
      Array.isArray(repo.protected_branches) &&
      repo.protected_branches.includes(branch)
    ) {
      // Check if user has admin permission
      const hasAdminPermission = await PermissionService.hasRepositoryPermission(userData.id, repo.id, "admin", "repo")

      if (!hasAdminPermission) {
        return NextResponse.json({
          allowed: false,
          message: `Branch '${branch}' is protected. You need admin permission to push to this branch.`,
        })
      }

      // For protected branches, check if it's a force push
      if (
        oldrev !== "0000000000000000000000000000000000000000" &&
        newrev !== "0000000000000000000000000000000000000000"
      ) {
        // Check if this is a force push by verifying if newrev contains oldrev
        const { data: containsCommit } = await supabase.rpc("git_commit_contains", {
          repo_path: `${owner}/${name}`,
          base_commit: newrev,
          target_commit: oldrev,
        })

        if (!containsCommit) {
          return NextResponse.json({
            allowed: false,
            message: `Force pushing to protected branch '${branch}' is not allowed.`,
          })
        }
      }
    }

    // Check if user has write permission
    const hasWritePermission = await PermissionService.hasRepositoryPermission(userData.id, repo.id, "write", "repo")

    if (!hasWritePermission) {
      return NextResponse.json({
        allowed: false,
        message: "You don't have write permission to this repository.",
      })
    }

    // Log the push attempt
    await supabase.from("git_operations_log").insert({
      repository_id: repo.id,
      user_id: userData.id,
      operation: "push",
      ref: ref,
      ref_type: ref_type,
      branch: branch,
      old_rev: oldrev,
      new_rev: newrev,
      status: "allowed",
    })

    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Pre-receive hook error:", error)
    return NextResponse.json(
      {
        allowed: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
