import { supabase } from "../supabase"
import type { Database } from "../database.types"

type User = Database["public"]["Tables"]["users"]["Row"]
type UserInsert = Database["public"]["Tables"]["users"]["Insert"]
type UserUpdate = Database["public"]["Tables"]["users"]["Update"]

export class AuthAPI {
  /**
   * Sign up a new user
   */
  static async signUp(email: string, password: string, userData: Omit<UserInsert, "id">) {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) throw authError
    if (!authData.user) throw new Error("User creation failed")

    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from("users")
      .insert({
        id: authData.user.id,
        ...userData,
      })
      .select()
      .single()

    if (profileError) throw profileError

    return { user: authData.user, profile: profileData }
  }

  /**
   * Sign in user
   */
  static async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error
    return data
  }

  /**
   * Sign out user
   */
  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  /**
   * Get current user session
   */
  static async getSession() {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()
    if (error) throw error
    return session
  }

  /**
   * Get current user profile
   */
  static async getCurrentUserProfile(): Promise<User | null> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return null

    const { data, error } = await supabase.from("users").select("*").eq("id", user.id).single()

    if (error) {
      if (error.code === "PGRST116") return null // No rows returned
      throw error
    }
    return data
  }

  /**
   * Update user profile
   */
  static async updateProfile(updates: UserUpdate): Promise<User> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    const { data, error } = await supabase.from("users").update(updates).eq("id", user.id).select().single()

    if (error) throw error
    return data
  }

  /**
   * Get user by username
   */
  static async getUserByUsername(username: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("username", username).single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase.from("users").select("*").eq("email", email).single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Check if username is available
   */
  static async isUsernameAvailable(username: string): Promise<boolean> {
    const { data, error } = await supabase.from("users").select("id").eq("username", username).single()

    if (error && error.code === "PGRST116") return true
    if (error) throw error
    return !data
  }
}
