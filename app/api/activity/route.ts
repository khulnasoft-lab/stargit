import { type NextRequest, NextResponse } from "next/server"
import { AuthMiddleware } from "@/lib/auth/middleware"
import { supabase } from "@/lib/supabase"

export async function GET(request: NextRequest) {
  try {
    const auth = await AuthMiddleware.requireAuth(request)

    // Fetch recent activity for the user
    const { data: activities, error } = await supabase
      .from("activities")
      .select(`
        *,
        actor:users!activities_actor_id_fkey (
          username,
          avatar_url
        ),
        repository:repositories!activities_repository_id_fkey (
          name,
          full_name
        )
      `)
      .or(`actor_id.eq.${auth.user.id},repository_id.in.(${await getUserRepositoryIds(auth.user.id)})`)
      .order("created_at", { ascending: false })
      .limit(50)

    if (error) throw error

    return NextResponse.json({ activities: activities || [] })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 })
  }
}

async function getUserRepositoryIds(userId: string): Promise<string> {
  const { data: repos } = await supabase
    .from("repositories")
    .select("id")
    .or(`owner_id.eq.${userId},organization_id.in.(${await getUserOrganizationIds(userId)})`)

  return repos?.map((r) => r.id).join(",") || ""
}

async function getUserOrganizationIds(userId: string): Promise<string> {
  const { data: orgs } = await supabase.from("organization_members").select("organization_id").eq("user_id", userId)

  return orgs?.map((o) => o.organization_id).join(",") || ""
}
