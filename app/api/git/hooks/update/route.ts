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
        branch_protection_rules
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

    // Check branch protection rules
    if (ref_type === "branch" && repo.branch_protection_rules) {
      const rules = repo.branch_protection_rules

      // Find matching rule for this branch
      const matchingRule = rules.find((rule: any) => {
        // Direct match
        if (rule.pattern === branch) return true

        // Wildcard match (e.g., "feature/*")
        if (rule.pattern.endsWith("*")) {
          const prefix = rule.pattern.slice(0, -1)
          return branch.startsWith(prefix)
        }

        return false
      })

      if (matchingRule) {
        // Check required status checks
        if (matchingRule.required_status_checks && matchingRule.required_status_checks.length > 0) {
          // In a real implementation, we would check if the commit has passed the required status checks
          // For this example, we'll just check if the user has admin permission to bypass this check
          const hasAdminPermission = await PermissionService.hasRepositoryPermission(
            userData.id,
            repo.id,
            "admin",
            "repo",
          )

          if (!hasAdminPermission) {
            return NextResponse.json({
              allowed: false,
              message: `Branch '${branch}' requires status checks before merging.`,
            })
          }
        }

        // Check required reviewers
        if (matchingRule.required_reviewers && matchingRule.required_reviewers > 0) {
          // In a real implementation, we would check if the PR has enough approvals
          // For this example, we'll just check if the user has admin permission to bypass this check
          const hasAdminPermission = await PermissionService.hasRepositoryPermission(
            userData.id,
            repo.id,
            "admin",
            "repo",
          )

          if (!hasAdminPermission) {
            return NextResponse.json({
              allowed: false,
              message: `Branch '${branch}' requires at least ${matchingRule.required_reviewers} reviewer approvals.`,
            })
          }
        }

        // Check if direct pushes are allowed
        if (matchingRule.disallow_direct_push) {
          const hasAdminPermission = await PermissionService.hasRepositoryPermission(
            userData.id,
            repo.id,
            "admin",
            "repo",
          )

          if (!hasAdminPermission) {
            return NextResponse.json({
              allowed: false,
              message: `Direct pushes to branch '${branch}' are not allowed. Please create a pull request.`,
            })
          }
        }
      }
    }

    // All checks passed
    return NextResponse.json({ allowed: true })
  } catch (error) {
    console.error("Update hook error:", error)
    return NextResponse.json(
      {
        allowed: false,
        message: "Internal server error",
      },
      { status: 500 },
    )
  }
}
