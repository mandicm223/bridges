"use client";

import { useState } from "react";
import type { DictionaryFilters } from "@/lib/dictionary/filters";
import { hasActiveFilters } from "@/lib/dictionary/filters";
import type { SavedWord } from "@/lib/dictionary/types";
import { EmptyState } from "@/components/dictionary/empty-state";
import { FilterChips } from "@/components/dictionary/filter-chips";
import { SavedRow } from "@/components/dictionary/saved-row";
import { SavedSheet } from "@/components/dictionary/saved-sheet";
import { SearchInput } from "@/components/dictionary/search-input";
import { useDeferredDelete } from "@/components/dictionary/use-deferred-delete";

type DictionaryExperienceProps = {
  entries: SavedWord[];
  filters: DictionaryFilters;
  totalCount: number;
};

export function DictionaryExperience({
  entries,
  filters,
  totalCount,
}: DictionaryExperienceProps) {
  const { pendingIds, requestDelete } = useDeferredDelete();
  const [selectedEntry, setSelectedEntry] = useState<SavedWord | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const visibleEntries = entries.filter((entry) => !pendingIds.has(entry.id));

  function handleOpen(entry: SavedWord) {
    setSelectedEntry(entry);
    setSheetOpen(true);
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open);

    if (!open) {
      setSelectedEntry(null);
    }
  }

  const showTrueEmpty = totalCount === 0;
  const showNoMatches =
    !showTrueEmpty && visibleEntries.length === 0 && hasActiveFilters(filters);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <SearchInput filters={filters} />
        <FilterChips filters={filters} />
      </div>

      {showTrueEmpty ? (
        <EmptyState kind="true-empty" />
      ) : showNoMatches ? (
        <EmptyState kind="no-matches" />
      ) : (
        <ul className="flex flex-col gap-3">
          {visibleEntries.map((entry) => (
            <li key={entry.id}>
              <SavedRow
                entry={entry}
                onOpen={handleOpen}
                onDelete={requestDelete}
              />
            </li>
          ))}
        </ul>
      )}

      <SavedSheet
        entry={selectedEntry}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />
    </div>
  );
}
