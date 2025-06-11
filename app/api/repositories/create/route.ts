import { type NextRequest, NextResponse } from "next/server"
import { GitOperationsAPI } from "@/lib/api/git-operations"

export async function POST(request: NextRequest) {
  try {
    const config = await request.json()
    const gitOps = new GitOperationsAPI()

    const repository = await gitOps.createRepository(config)

    return NextResponse.json({ repository }, { status: 201 })
  } catch (error) {
    console.error("Repository creation error:", error)
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
