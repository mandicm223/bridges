"use client";

import type { LookupResponse } from "@/lib/ai/schema";
import { formatRelativeDate } from "@/lib/dictionary/format-relative-date";
import { LANGUAGE_BY_CODE } from "@/lib/languages";
import { PlayButton } from "@/components/lookup/play-button";
import { SaveButton } from "@/components/lookup/save-button";
import { Badge } from "@/components/ui/badge";

type ResultCardProps =
  | { result: LookupResponse; variant?: "home" }
  | { result: LookupResponse; variant: "saved"; savedAt: string };

export function ResultCard(props: ResultCardProps) {
  const { result } = props;
  const variant = props.variant ?? "home";
  const source = LANGUAGE_BY_CODE[result.sourceLang];
  const target = LANGUAGE_BY_CODE[result.targetLang];

  return (
    <article
      className="rounded-xl border border-border bg-card p-6 shadow-sm"
      aria-live={variant === "home" ? "polite" : undefined}
    >
      <div className="space-y-6">
        <header className="space-y-2">
          <div className="flex flex-wrap items-start gap-2">
            <h2 className="font-serif text-4xl tracking-tight text-foreground">
              {result.word}
            </h2>
            <PlayButton
              text={result.word}
              lang={source.bcp47}
              label={`Pronounce ${result.word}`}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {source.flag} {source.name}
          </p>
        </header>

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">In English</h3>
          <p className="leading-relaxed text-foreground">
            {result.englishMeaning}
          </p>
        </section>

        {result.culturalContext ? (
          <section className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">
              Cultural context
            </h3>
            <p className="leading-relaxed text-muted-foreground">
              {result.culturalContext}
            </p>
          </section>
        ) : null}

        <section className="space-y-2">
          <h3 className="text-sm font-medium text-foreground">Example</h3>
          <p className="font-serif text-lg italic text-foreground">
            {result.exampleSentence}
          </p>
        </section>

        <section className="space-y-2 border-t border-border pt-6">
          <h3 className="text-sm font-medium text-foreground">
            Closest in {target.name}
          </h3>
          <div className="flex flex-wrap items-start gap-2">
            <p className="font-serif text-2xl text-foreground">
              {result.equivalent.text}
            </p>
            <PlayButton
              text={result.equivalent.text}
              lang={target.bcp47}
              label={`Pronounce ${result.equivalent.text}`}
            />
          </div>
          <p className="text-sm text-muted-foreground">
            {target.flag} {target.name}
          </p>
          {result.equivalent.note ? (
            <p className="text-sm text-muted-foreground italic">
              {result.equivalent.note}
            </p>
          ) : null}
        </section>

        <div className="pt-2">
          {props.variant === "saved" ? (
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary">Saved</Badge>
              <span className="text-sm text-muted-foreground">
                Added {formatRelativeDate(props.savedAt)}
              </span>
            </div>
          ) : (
            <SaveButton result={result} />
          )}
        </div>
      </div>
    </article>
  );
}
