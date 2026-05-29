import type { LanguageCode } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";

export type LanguagePair = {
  source: LanguageCode;
  target: LanguageCode;
};

export function defaultPair(nativeLanguage: LanguageCode): LanguagePair {
  const other =
    LANGUAGES.find((language) => language.code !== nativeLanguage)?.code ?? "hu";

  return { source: nativeLanguage, target: other };
}

export function parsePendingPair(
  value: string | undefined
): LanguagePair | null {
  if (!value) {
    return null;
  }

  const [source, target] = value.split(",");
  const codes = new Set(LANGUAGES.map((language) => language.code));

  if (
    !source ||
    !target ||
    source === target ||
    !codes.has(source as LanguageCode) ||
    !codes.has(target as LanguageCode)
  ) {
    return null;
  }

  return { source: source as LanguageCode, target: target as LanguageCode };
}

export function defaultSourceLang(
  pair: LanguagePair,
  nativeLanguage: LanguageCode
): LanguageCode {
  if (pair.source === nativeLanguage || pair.target === nativeLanguage) {
    return nativeLanguage;
  }

  return pair.source;
}

export function targetLangForSource(
  pair: LanguagePair,
  sourceLang: LanguageCode
): LanguageCode {
  return sourceLang === pair.source ? pair.target : pair.source;
}
