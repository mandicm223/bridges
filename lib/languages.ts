export type LanguageCode = "sr" | "hu" | "de";

export type Language = {
  code: LanguageCode;
  name: string;
  flag: string;
  bcp47: string;
};

export const LANGUAGES: Language[] = [
  { code: "sr", name: "Serbian", flag: "🇷🇸", bcp47: "sr-RS" },
  { code: "hu", name: "Hungarian", flag: "🇭🇺", bcp47: "hu-HU" },
  { code: "de", name: "German", flag: "🇩🇪", bcp47: "de-DE" },
];

export const LANGUAGE_BY_CODE = Object.fromEntries(
  LANGUAGES.map((language) => [language.code, language])
) as Record<LanguageCode, Language>;

export function getLanguageLabel(code: LanguageCode): string {
  const language = LANGUAGE_BY_CODE[code];
  return `${language.flag} ${language.name}`;
}
