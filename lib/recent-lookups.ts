import type { LookupResponse } from "@/lib/ai/schema";
import type { LanguageCode } from "@/lib/languages";

const STORAGE_KEY = "bridges.recents.v1";
const MAX_RECENTS = 10;

export type RecentEntry = {
  word: string;
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  result: LookupResponse;
  timestamp: string;
};

export function getRecent(): RecentEntry[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.slice(0, MAX_RECENTS) as RecentEntry[];
  } catch {
    return [];
  }
}

export function pushRecent(entry: RecentEntry): RecentEntry[] {
  const current = getRecent();
  const next = [entry, ...current].slice(0, MAX_RECENTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function clear(): void {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}
