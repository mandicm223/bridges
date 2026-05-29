"use client";

import { useRouter } from "next/navigation";
import type { LanguageCode } from "@/lib/languages";
import { LANGUAGES } from "@/lib/languages";
import type { DictionaryFilters } from "@/lib/dictionary/filters";
import { toSearchString } from "@/lib/dictionary/filters";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type FilterChipsProps = {
  filters: DictionaryFilters;
};

export function FilterChips({ filters }: FilterChipsProps) {
  const router = useRouter();

  function handleSelect(lang: LanguageCode) {
    const nextLang = filters.lang === lang ? undefined : lang;

    router.replace(
      `/dictionary${toSearchString({ ...filters, lang: nextLang })}`,
      { scroll: false }
    );
  }

  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by language">
      {LANGUAGES.map((language) => {
        const active = filters.lang === language.code;

        return (
          <Button
            key={language.code}
            type="button"
            size="sm"
            variant={active ? "default" : "outline"}
            className={cn("rounded-full", active && "shadow-sm")}
            aria-pressed={active}
            onClick={() => handleSelect(language.code)}
          >
            <span aria-hidden>{language.flag}</span> {language.name}
          </Button>
        );
      })}
    </div>
  );
}
