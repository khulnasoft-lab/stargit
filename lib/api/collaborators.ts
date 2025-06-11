import { supabase } from "../supabase"
import type { Database } from "../database.types"

type RepositoryCollaborator = Database["public"]["Tables"]["repository_collaborators"]["Row"]
type RepositoryCollaboratorInsert = Database["public"]["Tables"]["repository_collaborators"]["Insert"]

export class CollaboratorsAPI {
  /**
   * Add collaborator to repository
   */
  static async add(
    repositoryId: string,
    userId: string,
    permission: "read" | "write" | "admin" = "read",
  ): Promise<RepositoryCollaborator> {
    const { data, error } = await supabase
      .from("repository_collaborators")
      .insert({
        repository_id: repositoryId,
        user_id: userId,
        permission,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Update collaborator permission
   */
  static async updatePermission(
    repositoryId: string,
    userId: string,
    permission: "read" | "write" | "admin",
  ): Promise<RepositoryCollaborator> {
    const { data, error } = await supabase
      .from("repository_collaborators")
      .update({ permission })
      .eq("repository_id", repositoryId)
      .eq("user_id", userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  /**
   * Remove collaborator from repository
   */
  static async remove(repositoryId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from("repository_collaborators")
      .delete()
      .eq("repository_id", repositoryId)
      .eq("user_id", userId)

    if (error) throw error
  }

  /**
   * List repository collaborators
   */
  static async list(repositoryId: string) {
    const { data, error } = await supabase
      .from("repository_collaborators")
      .select(`
        *,
        users (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq("repository_id", repositoryId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Check if user is collaborator
   */
  static async isCollaborator(repositoryId: string, userId?: string): Promise<boolean> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) return false

    const { data, error } = await supabase
      .from("repository_collaborators")
      .select("id")
      .eq("repository_id", repositoryId)
      .eq("user_id", targetUserId)
      .single()

    if (error && error.code === "PGRST116") return false
    if (error) throw error
    return !!data
  }

  /**
   * Get user's collaboration repositories
   */
  static async getUserCollaborations(userId?: string) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error("User ID required")

    const { data, error } = await supabase
      .from("repository_collaborators")
      .select(`
        permission,
        repositories (
          *,
          users (
            id,
            username,
            full_name,
            avatar_url
          ),
          organizations (
            id,
            name,
            display_name,
            avatar_url
          )
        )
      `)
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }
}
