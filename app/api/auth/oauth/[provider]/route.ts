import { type NextRequest, NextResponse } from "next/server"
import { OAuthService } from "@/lib/auth/oauth"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
const supabase = createClient(supabaseUrl, supabaseKey)

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get("code")
    const state = searchParams.get("state")
    const error = searchParams.get("error")

    if (error) {
      return NextResponse.redirect(new URL(`/auth/error?error=${error}`, request.url))
    }

    if (!code || !state) {
      return NextResponse.json({ error: "Missing code or state parameter" }, { status: 400 })
    }

    // Verify state parameter (in production, validate against stored state)
    const redirectUri = `${request.nextUrl.origin}/api/auth/oauth/${params.provider}`

    // Handle OAuth callback
    const { user, isNewUser } = await OAuthService.handleCallback(params.provider, code, redirectUri)

    // Log authentication event
    await AuthMiddleware.logAuthEvent(
      user.id,
      "oauth_login",
      {
        provider: params.provider,
        is_new_user: isNewUser,
      },
      request,
    )

    // Create session (in production, use secure session management)
    const sessionToken = `session_${Date.now()}_${Math.random().toString(36)}`
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    await supabase.from("user_sessions").insert({
      user_id: user.id,
      session_token: sessionToken,
      expires_at: expiresAt.toISOString(),
      ip_address: request.ip || request.headers.get("x-forwarded-for"),
      user_agent: request.headers.get("user-agent"),
    })

    // Set session cookie and redirect
    const response = NextResponse.redirect(new URL("/dashboard", request.url))
    response.cookies.set("session-token", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      expires: expiresAt,
    })

    return response
  } catch (error) {
    console.error("OAuth callback error:", error)
    return NextResponse.redirect(new URL(`/auth/error?error=oauth_failed`, request.url))
  }
}
