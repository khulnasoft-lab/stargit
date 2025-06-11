import { supabase } from "../supabase"
import type { Database } from "../database.types"
import { createHash } from "crypto"

type SSHKey = Database["public"]["Tables"]["ssh_keys"]["Row"]
type SSHKeyInsert = Database["public"]["Tables"]["ssh_keys"]["Insert"]

export class SSHKeysAPI {
  /**
   * Generate SSH key fingerprint
   */
  private static generateFingerprint(keyContent: string): string {
    // Remove SSH key prefix and suffix, decode base64, and create MD5 hash
    const keyData = keyContent.split(" ")[1]
    const buffer = Buffer.from(keyData, "base64")
    return createHash("md5").update(buffer).digest("hex").match(/.{2}/g)!.join(":")
  }

  /**
   * Parse SSH key to extract type
   */
  private static parseKeyType(keyContent: string): string {
    const keyType = keyContent.split(" ")[0]
    switch (keyType) {
      case "ssh-rsa":
        return "rsa"
      case "ssh-ed25519":
        return "ed25519"
      case "ssh-ecdsa":
        return "ecdsa"
      default:
        return "unknown"
    }
  }

  /**
   * Add SSH key for user
   */
  static async add(title: string, keyContent: string): Promise<SSHKey> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) throw new Error("Not authenticated")

    // Validate and parse key
    const trimmedKey = keyContent.trim()
    if (!trimmedKey.match(/^ssh-(rsa|ed25519|ecdsa)/)) {
      throw new Error("Invalid SSH key format")
    }

    const keyType = this.parseKeyType(trimmedKey)
    const fingerprint = this.generateFingerprint(trimmedKey)

    const keyData: SSHKeyInsert = {
      user_id: user.id,
      title,
      key_content: trimmedKey,
      key_type: keyType,
      fingerprint,
    }

    const { data, error } = await supabase.from("ssh_keys").insert(keyData).select().single()

    if (error) throw error
    return data
  }

  /**
   * List user's SSH keys
   */
  static async list(userId?: string): Promise<SSHKey[]> {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    const targetUserId = userId || user?.id
    if (!targetUserId) throw new Error("User ID required")

    const { data, error } = await supabase
      .from("ssh_keys")
      .select("*")
      .eq("user_id", targetUserId)
      .order("created_at", { ascending: false })

    if (error) throw error
    return data
  }

  /**
   * Get SSH key by ID
   */
  static async getById(id: string): Promise<SSHKey | null> {
    const { data, error } = await supabase.from("ssh_keys").select("*").eq("id", id).single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }

  /**
   * Update SSH key
   */
  static async update(id: string, title: string): Promise<SSHKey> {
    const { data, error } = await supabase.from("ssh_keys").update({ title }).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  /**
   * Delete SSH key
   */
  static async delete(id: string): Promise<void> {
    const { error } = await supabase.from("ssh_keys").delete().eq("id", id)

    if (error) throw error
  }

  /**
   * Update last used timestamp
   */
  static async updateLastUsed(id: string): Promise<void> {
    const { error } = await supabase.from("ssh_keys").update({ last_used_at: new Date().toISOString() }).eq("id", id)

    if (error) throw error
  }

  /**
   * Find SSH key by fingerprint
   */
  static async findByFingerprint(fingerprint: string): Promise<SSHKey | null> {
    const { data, error } = await supabase
      .from("ssh_keys")
      .select(`
        *,
        users (
          id,
          username,
          full_name
        )
      `)
      .eq("fingerprint", fingerprint)
      .single()

    if (error && error.code !== "PGRST116") throw error
    return data || null
  }
}
