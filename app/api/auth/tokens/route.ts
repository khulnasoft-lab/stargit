import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { TokenService } from "@/lib/auth/tokens"

export async function GET(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    const tokens = await TokenService.listUserTokens(auth.user.id)
    return NextResponse.json({ tokens })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 401 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)
    const { name, scopes, expiresInDays } = await request.json()

    if (!name) {
      return NextResponse.json({ error: "Token name is required" }, { status: 400 })
    }

    const { token, tokenData } = await TokenService.generateToken(
      auth.user.id,
      name,
      scopes || ["repo:read"],
      expiresInDays,
    )

    // Log token creation
    await AuthMiddleware.logAuthEvent(
      auth.user.id,
      "token_created",
      {
        token_id: tokenData.id,
        token_name: name,
        scopes,
      },
      request,
    )

    return NextResponse.json({ token, token_data: tokenData }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}
