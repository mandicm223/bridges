"use client";

import {
  LANGUAGES,
  getLanguageLabel,
  type LanguageCode,
} from "@/lib/languages";
import type { LanguagePair } from "@/lib/lookup/pair";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PairSelectorProps = {
  pair: LanguagePair;
  onPairChange: (pair: LanguagePair) => void;
};

export function PairSelector({ pair, onPairChange }: PairSelectorProps) {
  function updateSide(side: "source" | "target", value: LanguageCode) {
    if (side === "source") {
      if (value === pair.target) {
        onPairChange({ source: value, target: pair.source });
        return;
      }

      onPairChange({ source: value, target: pair.target });
      return;
    }

    if (value === pair.source) {
      onPairChange({ source: pair.target, target: value });
      return;
    }

    onPairChange({ source: pair.source, target: value });
  }

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <Select
        value={pair.source}
        onValueChange={(value) => updateSide("source", value as LanguageCode)}
      >
        <SelectTrigger className="w-full min-w-[10rem] sm:w-auto" aria-label="First language in pair">
          <SelectValue>{getLanguageLabel(pair.source)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.flag} {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <span className="text-muted-foreground" aria-hidden>
        ↔
      </span>

      <Select
        value={pair.target}
        onValueChange={(value) => updateSide("target", value as LanguageCode)}
      >
        <SelectTrigger className="w-full min-w-[10rem] sm:w-auto" aria-label="Second language in pair">
          <SelectValue>{getLanguageLabel(pair.target)}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              {language.flag} {language.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
