import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/database.types";
import type { DictionaryFilters } from "@/lib/dictionary/filters";
import type { SavedWord } from "@/lib/dictionary/types";

function escapeIlikePattern(value: string): string {
  return value.replace(/[%_\\]/g, (char) => `\\${char}`);
}

export async function listSavedWords(
  supabase: SupabaseClient<Database>,
  filters: DictionaryFilters
): Promise<SavedWord[]> {
  let query = supabase
    .from("saved_words")
    .select("*")
    .order("created_at", { ascending: false });

  if (filters.q) {
    query = query.ilike("word", `%${escapeIlikePattern(filters.q)}%`);
  }

  if (filters.lang) {
    query = query.eq("source_lang", filters.lang);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return data ?? [];
}

export async function countSavedWords(
  supabase: SupabaseClient<Database>
): Promise<number> {
  const { count, error } = await supabase
    .from("saved_words")
    .select("*", { count: "exact", head: true });

  if (error) {
    throw error;
  }

  return count ?? 0;
}
