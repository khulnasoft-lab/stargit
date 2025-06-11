import { type NextRequest, NextResponse } from "next/server"
import { OAuthService } from "@/lib/auth/oauth"

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const provider = await OAuthService.getProvider(params.provider)
    if (!provider) {
      return NextResponse.json({ error: "OAuth provider not found" }, { status: 404 })
    }

    const redirectUri = `${request.nextUrl.origin}/api/auth/oauth/${params.provider}`
    const state = `state_${Date.now()}_${Math.random().toString(36)}`

    // In production, store state in session/database for validation
    const authUrl = OAuthService.generateAuthUrl(provider, redirectUri, state)

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error("OAuth authorization error:", error)
    return NextResponse.json({ error: "Failed to initiate OAuth flow" }, { status: 500 })
  }
}
