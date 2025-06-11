import { supabase } from "../supabaseClient"

export default class RepositoriesAPI {
  static async list() {
    const { data, error } = await supabase.from("repositories").select("*")

    if (error) throw error
    return data
  }

  static async getById(id: string) {
    const { data, error } = await supabase.from("repositories").select("*").eq("id", id).single()

    if (error) throw error
    return data
  }

  static async create(values: any) {
    const { data, error } = await supabase.from("repositories").insert([values]).select().single()

    if (error) throw error
    return data
  }

  static async update(id: string, updates: any) {
    const { data, error } = await supabase.from("repositories").update(updates).eq("id", id).select().single()

    if (error) throw error
    return data
  }

  static async delete(id: string) {
    const { error } = await supabase.from("repositories").delete().eq("id", id)

    if (error) throw error
  }

  static async getByFullName(fullName: string) {
    const { data, error } = await supabase.from("repositories").select("*").eq("full_name", fullName).single()

    if (error) throw error
    return data
  }

  static async updateByFullName(fullName: string, updates: any) {
    const { data, error } = await supabase
      .from("repositories")
      .update(updates)
      .eq("full_name", fullName)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async deleteByFullName(fullName: string) {
    const { error } = await supabase.from("repositories").delete().eq("full_name", fullName)

    if (error) throw error
  }
}
