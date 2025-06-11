import { type NextRequest, NextResponse } from "next/server"
import { AdvancedGitOperations } from "@/lib/git/advanced-operations"
import { AuthMiddleware } from "@/lib/auth/middleware"

export async function POST(request: NextRequest, { params }: { params: { fullName: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await AuthMiddleware.requireRepositoryPermission(request, decodeURIComponent(params.fullName), "write")

    const body = await request.json()
    const { operation, ...operationData } = body

    let result

    switch (operation) {
      case "cherry-pick":
        result = await AdvancedGitOperations.cherryPick(decodeURIComponent(params.fullName), {
          commitSha: operationData.commitSha,
          targetBranch: operationData.targetBranch,
          userId: auth.user.id,
        })
        break

      case "rebase":
        result = await AdvancedGitOperations.rebase(decodeURIComponent(params.fullName), {
          sourceBranch: operationData.sourceBranch,
          targetBranch: operationData.targetBranch,
          interactive: operationData.interactive,
          userId: auth.user.id,
        })
        break

      case "squash":
        result = await AdvancedGitOperations.squashCommits(decodeURIComponent(params.fullName), {
          commits: operationData.commits,
          message: operationData.message,
          userId: auth.user.id,
        })
        break

      case "revert":
        result = await AdvancedGitOperations.revertCommit(decodeURIComponent(params.fullName), {
          commitSha: operationData.commitSha,
          userId: auth.user.id,
        })
        break

      default:
        return NextResponse.json({ error: "Invalid operation" }, { status: 400 })
    }

    return NextResponse.json({ result })
  } catch (error) {
    console.error("Git operation failed:", error)
    return NextResponse.json({ error: "Git operation failed" }, { status: 500 })
  }
}
