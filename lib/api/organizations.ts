import { supabase } from "../supabase"
import type { Database } from "../database.types"

type Organization = Database["public"]["Tables"]["organizations"]["Row"]
type OrganizationInsert = Database["public"]["Tables"]["organizations"]["Insert"]
type OrganizationUpdate = Database["public"]["Tables"]["organizations"]["Update"]
type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"]
type OrganizationMemberInsert = Database["public"]["Tables"]["organization_members"]["Insert"]

export class OrganizationsAPI {
  /**
   * Create a new organization
   */
  static async create(orgData: OrganizationInsert): Promise<Organization> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Create organization
    const { data: org, error: orgError } = await supabase.from("organizations").insert(orgData).select().single()

    if (orgError) throw orgError

    // Add creator as owner
    const { error: memberError } = await supabase.from("organization_members").insert({
      organization_id: org.id,
      user_id: user.id,
      role: "owner",
    })

    if (memberError) throw memberError

    return org
  }

  /**
   * Get organization by name
   */
  static async getByName(name: string): Promise<Organization | null> {
    const { data, error } = await supabase.from("organizations").select("*").eq("name", name).single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Update organization
   */
  static async update(id: string, updates: OrganizationUpdate): Promise<Organization> {
    const { data, error } = await supabase.from("organizations").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  /**
   * Delete organization
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("organizations").delete().eq("id", id)

    if (error) throw error
  }

  /**
   * Get organization members
   */
  static async getMembers(organizationId: string) {
    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("organization_id", organizationId)

    if (error) throw error
    return data
  }

  /**
   * Add member to organization
   */
  static async addMember(
    organizationId: string,
    userId: string,
    role: "owner" | "admin" | "member" = "member",
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from("organization_members")
      .insert({
        organization_id: organizationId,
        user_id: userId,
        role,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update member role
   */
  static async updateMemberRole(
    organizationId: string,
    userId: string,
    role: "owner" | "admin" | "member",
  ): Promise<OrganizationMember> {
    const { data, error } = await supabase
      .from("organization_members")
      .update({ role })
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Remove member from organization
   */
  static async removeMember(organizationId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("organization_members")
      .delete()
      .eq("organization_id", organizationId)
      .eq("user_id", userId)

    if (error) throw error
  }

  /**
   * Get user's organizations
   */
  static async getUserOrganizations(userId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error("User ID required")

    const { data, error } = await supabase
      .from("organization_members")
      .select(`
        role,
        organizations (*)
      `)
      .eq("user_id", targetUserId)

    if (error) throw error
    return data
  }

  /**
   * Check if user is organization member
   */
  static async isMember(organizationId: string, userId?: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return false

    const { data, error } = await supabase
      .from("organization_members")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("user_id", targetUserId)
      .single()

    if (error && error.code === "PGRST116") return false
    if (error) throw error
    return !!data
  }
}
