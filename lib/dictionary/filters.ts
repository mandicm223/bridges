import type { LanguageCode } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";

export type DictionaryFilters = {
  q?: string;
  lang?: LanguageCode;
};

const languageCodes = new Set(LANGUAGES.map((language) => language.code));

export function parseFiltersFromSearchParams(
  searchParams: Record<string, string | string[] | undefined>
): DictionaryFilters {
  const rawQ = searchParams.q;
  const rawLang = searchParams.lang;

  const q =
    typeof rawQ === "string" && rawQ.trim().length > 0
      ? rawQ.trim()
      : undefined;

  const langValue = typeof rawLang === "string" ? rawLang : undefined;
  const lang =
    langValue && languageCodes.has(langValue as LanguageCode)
      ? (langValue as LanguageCode)
      : undefined;

  return { q, lang };
}

export function toSearchString(filters: DictionaryFilters): string {
  const params = new URLSearchParams();

  if (filters.q) {
    params.set("q", filters.q);
  }

  if (filters.lang) {
    params.set("lang", filters.lang);
  }

  const value = params.toString();
  return value.length > 0 ? `?${value}` : "";
}

export function hasActiveFilters(filters: DictionaryFilters): boolean {
  return Boolean(filters.q || filters.lang);
}
