import type { LookupResponse } from "@/lib/ai/schema";
import type { SavedWord } from "@/lib/dictionary/types";

export function savedWordToLookupResponse(row: SavedWord): LookupResponse {
  return {
    word: row.word,
    sourceLang: row.source_lang,
    targetLang: row.target_lang,
    englishMeaning: row.english_meaning,
    culturalContext: row.cultural_context ?? undefined,
    exampleSentence: row.example_sentence,
    equivalent: {
      text: row.equivalent_text,
      note: row.equivalent_note ?? undefined,
    },
  };
}
