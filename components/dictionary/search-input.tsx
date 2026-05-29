"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DictionaryFilters } from "@/lib/dictionary/filters";
import { toSearchString } from "@/lib/dictionary/filters";
import { Input } from "@/components/ui/input";

type SearchInputProps = {
  filters: DictionaryFilters;
};

export function SearchInput({ filters }: SearchInputProps) {
  const router = useRouter();
  const [value, setValue] = useState(filters.q ?? "");
  const filtersRef = useRef(filters);

  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  // Sync when the URL changes externally (back/forward, clear filters).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- URL is source of truth for shareable search state.
    setValue(filters.q ?? "");
  }, [filters.q]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      const trimmed = value.trim();
      const currentQ = filtersRef.current.q ?? "";

      if (trimmed === currentQ) {
        return;
      }

      router.replace(
        `/dictionary${toSearchString({ ...filtersRef.current, q: trimmed || undefined })}`,
        { scroll: false }
      );
    }, 300);

    return () => window.clearTimeout(timeout);
  }, [value, router]);

  return (
    <Input
      type="search"
      value={value}
      onChange={(event) => setValue(event.target.value)}
      placeholder="Search saved words…"
      aria-label="Search saved words"
      className="w-full"
    />
  );
}
