import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { TokenService } from "@/lib/auth/tokens"

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    await TokenService.revokeToken(auth.user.id, params.id)

    // Log token revocation
    await AuthMiddleware.logAuthEvent(
      auth.user.id,
      "token_revoked",
      {
        token_id: params.id,
      },
      request,
    )

    return NextResponse.json({ status: "revoked" })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
