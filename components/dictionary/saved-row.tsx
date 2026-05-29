"use client";

import { ArrowRight, Trash2 } from "lucide-react";
import { formatRelativeDate } from "@/lib/dictionary/format-relative-date";
import type { SavedWord } from "@/lib/dictionary/types";
import { LANGUAGE_BY_CODE } from "@/lib/languages";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type SavedRowProps = {
  entry: SavedWord;
  onOpen: (entry: SavedWord) => void;
  onDelete: (entry: SavedWord) => void;
};

export function SavedRow({ entry, onOpen, onDelete }: SavedRowProps) {
  const source = LANGUAGE_BY_CODE[entry.source_lang];
  const target = LANGUAGE_BY_CODE[entry.target_lang];

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border bg-card shadow-sm transition-colors",
        "hover:border-foreground/20"
      )}
    >
      <button
        type="button"
        onClick={() => onOpen(entry)}
        className="flex min-w-0 flex-1 items-center gap-3 px-4 py-4 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate font-serif text-xl tracking-tight text-foreground">
            {entry.word}
          </span>
          <span className="mt-1 flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
            <span aria-hidden>{source.flag}</span>
            <ArrowRight className="size-3.5" aria-hidden />
            <span aria-hidden>{target.flag}</span>
            <span className="text-muted-foreground/70">·</span>
            <span>{formatRelativeDate(entry.created_at)}</span>
          </span>
        </span>
      </button>

      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="mr-2 shrink-0 text-muted-foreground hover:text-destructive"
        aria-label={`Delete ${entry.word}`}
        onClick={(event) => {
          event.stopPropagation();
          onDelete(entry);
        }}
      >
        <Trash2 className="size-4" aria-hidden />
      </Button>
    </div>
  );
}
