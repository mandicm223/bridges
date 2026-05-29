"use client";

import {
  getLanguageLabel,
  type LanguageCode,
} from "@/lib/languages";
import type { LanguagePair } from "@/lib/lookup/pair";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MicButton } from "@/components/lookup/mic-button";

type LookupFormProps = {
  pair: LanguagePair;
  sourceLang: LanguageCode;
  input: string;
  loading: boolean;
  onSourceLangChange: (lang: LanguageCode) => void;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

export function LookupForm({
  pair,
  sourceLang,
  input,
  loading,
  onSourceLangChange,
  onInputChange,
  onSubmit,
}: LookupFormProps) {
  const pairLanguages: LanguageCode[] = [pair.source, pair.target];

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Select
          value={sourceLang}
          onValueChange={(value) => onSourceLangChange(value as LanguageCode)}
          disabled={loading}
        >
          <SelectTrigger
            className="w-full sm:w-[11rem]"
            aria-label="Source language"
          >
            <SelectValue>{getLanguageLabel(sourceLang)}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {pairLanguages.map((code) => (
              <SelectItem key={code} value={code}>
                {getLanguageLabel(code)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex min-w-0 flex-1 gap-2">
          <Input
            value={input}
            onChange={(event) => onInputChange(event.target.value)}
            placeholder="Type a word or short phrase…"
            maxLength={300}
            disabled={loading}
            className="min-w-0 flex-1"
            aria-label="Word or phrase to look up"
          />
          <MicButton
            sourceLang={sourceLang}
            disabled={loading}
            onTranscript={onInputChange}
          />
        </div>

        <Button type="submit" disabled={loading} className="w-full sm:w-auto">
          {loading ? "Looking up…" : "Look up"}
        </Button>
      </div>
    </form>
  );
}
