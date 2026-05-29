"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { languageCodeSchema, type LookupResponse } from "@/lib/ai/schema";
import { createClient } from "@/utils/supabase/server";

const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    if (!value) {
      return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  });

const SaveLookupSchema = z
  .object({
    word: z.string().trim().min(1).max(300),
    sourceLang: languageCodeSchema,
    targetLang: languageCodeSchema,
    englishMeaning: z.string().trim().min(1),
    culturalContext: optionalText,
    exampleSentence: z.string().trim().min(1),
    equivalent: z.object({
      text: z.string().trim().min(1),
      note: optionalText,
    }),
  })
  .refine((data) => data.sourceLang !== data.targetLang, {
    message: "sourceLang and targetLang must be different.",
    path: ["targetLang"],
  });

export type SaveLookupInput = LookupResponse;

export type SaveLookupResult =
  | { ok: true; id: number }
  | { ok: false; error: string };

export type DeleteSavedWordResult =
  | { ok: true }
  | { ok: false; error: string };

async function getAuthenticatedSupabase() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabase, user };
}

export async function saveLookupAction(
  input: LookupResponse
): Promise<SaveLookupResult> {
  const parsed = SaveLookupSchema.safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "That save request doesn't look right." };
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const data = parsed.data;

  const { data: inserted, error } = await supabase
    .from("saved_words")
    .insert({
      user_id: user.id,
      word: data.word,
      source_lang: data.sourceLang,
      target_lang: data.targetLang,
      english_meaning: data.englishMeaning,
      cultural_context: data.culturalContext,
      example_sentence: data.exampleSentence,
      equivalent_text: data.equivalent.text,
      equivalent_note: data.equivalent.note,
    })
    .select("id")
    .single();

  if (error || !inserted) {
    return {
      ok: false,
      error: "We couldn't save that word. Please try again.",
    };
  }

  revalidatePath("/dictionary");

  return { ok: true, id: inserted.id };
}

export async function deleteSavedWordAction(
  id: number
): Promise<DeleteSavedWordResult> {
  if (!Number.isFinite(id) || id <= 0) {
    return { ok: false, error: "That entry couldn't be deleted." };
  }

  const { supabase, user } = await getAuthenticatedSupabase();

  if (!user) {
    return { ok: false, error: "Sign in required." };
  }

  const { error } = await supabase.from("saved_words").delete().eq("id", id);

  if (error) {
    return {
      ok: false,
      error: "We couldn't delete that entry. Please try again.",
    };
  }

  revalidatePath("/dictionary");

  return { ok: true };
}
