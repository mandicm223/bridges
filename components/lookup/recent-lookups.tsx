"use client";

import type { RecentEntry } from "@/lib/recent-lookups";
import { LANGUAGE_BY_CODE } from "@/lib/languages";
import { cn } from "@/lib/utils";

type RecentLookupsProps = {
  entries: RecentEntry[];
  onSelect: (entry: RecentEntry) => void;
};

export function RecentLookups({ entries, onSelect }: RecentLookupsProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">Recent</h2>
      <ul
        className={cn(
          "flex gap-2 overflow-x-auto pb-1",
          "[scrollbar-width:thin]"
        )}
      >
        {entries.map((entry) => {
          const language = LANGUAGE_BY_CODE[entry.sourceLang];

          return (
            <li
              key={`${entry.timestamp}-${entry.word}-${entry.sourceLang}`}
              className="shrink-0"
            >
              <button
                type="button"
                onClick={() => onSelect(entry)}
                className="rounded-full border border-border bg-muted/50 px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-muted"
                aria-label={`Show result for ${entry.word}`}
              >
                <span aria-hidden>{language.flag}</span>{" "}
                <span>{entry.word}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
