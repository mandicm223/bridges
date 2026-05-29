"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  LookupErrorCode,
  LookupErrorResponse,
  LookupResponse,
} from "@/lib/ai/schema";
import { LOOKUP_ERROR_MESSAGES } from "@/lib/lookup-messages";
import type { LanguageCode } from "@/lib/languages";
import {
  defaultSourceLang,
  targetLangForSource,
  type LanguagePair,
} from "@/lib/lookup/pair";
import { getRecent, pushRecent, type RecentEntry } from "@/lib/recent-lookups";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PairSelector } from "@/components/lookup/pair-selector";
import { LookupForm } from "@/components/lookup/lookup-form";
import { ResultCard } from "@/components/lookup/result-card";
import { LoadingCard } from "@/components/lookup/loading-card";
import { ErrorCard } from "@/components/lookup/error-card";
import { RecentLookups } from "@/components/lookup/recent-lookups";

type LookupStatus =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; result: LookupResponse }
  | { kind: "error"; code: LookupErrorCode; message: string };

type LookupExperienceProps = {
  initialNativeLanguage: LanguageCode;
  initialPair: LanguagePair;
};

export function LookupExperience({
  initialNativeLanguage,
  initialPair,
}: LookupExperienceProps) {
  const [pair, setPair] = useState<LanguagePair>(initialPair);
  const [sourceLang, setSourceLang] = useState<LanguageCode>(() =>
    defaultSourceLang(initialPair, initialNativeLanguage)
  );
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<LookupStatus>({ kind: "idle" });
  const [recents, setRecents] = useState<RecentEntry[]>([]);
  const [resultKey, setResultKey] = useState<string | null>(null);
  const lastRequestRef = useRef<{
    word: string;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
  } | null>(null);

  useEffect(() => {
    setRecents(getRecent());
  }, []);

  const handlePairChange = useCallback(
    (nextPair: LanguagePair) => {
      setPair(nextPair);
      setSourceLang((current) => {
        if (current === nextPair.source || current === nextPair.target) {
          return current;
        }

        return defaultSourceLang(nextPair, initialNativeLanguage);
      });
    },
    [initialNativeLanguage]
  );

  const runLookup = useCallback(
    async (word: string, lookupSourceLang: LanguageCode) => {
      const trimmed = word.trim();

      if (trimmed.length < 1 || trimmed.length > 300) {
        setStatus({
          kind: "error",
          code: "INVALID_INPUT",
          message: LOOKUP_ERROR_MESSAGES.INVALID_INPUT,
        });
        return;
      }

      const targetLang = targetLangForSource(pair, lookupSourceLang);
      lastRequestRef.current = {
        word: trimmed,
        sourceLang: lookupSourceLang,
        targetLang,
      };

      setStatus({ kind: "loading" });

      try {
        const response = await fetch("/api/lookup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            word: trimmed,
            sourceLang: lookupSourceLang,
            targetLang,
          }),
        });

        if (!response.ok) {
          const payload = (await response.json()) as LookupErrorResponse;
          const code = payload.error?.code ?? "INTERNAL";
          setStatus({
            kind: "error",
            code,
            message:
              payload.error?.message ?? LOOKUP_ERROR_MESSAGES[code] ?? LOOKUP_ERROR_MESSAGES.INTERNAL,
          });
          return;
        }

        const result = (await response.json()) as LookupResponse;
        setResultKey(
          `${trimmed}|${lookupSourceLang}|${targetLang}|${Date.now()}`
        );
        setStatus({ kind: "success", result });

        const entry: RecentEntry = {
          word: trimmed,
          sourceLang: lookupSourceLang,
          targetLang,
          result,
          timestamp: new Date().toISOString(),
        };
        setRecents(pushRecent(entry));
      } catch {
        setStatus({
          kind: "error",
          code: "INTERNAL",
          message: LOOKUP_ERROR_MESSAGES.INTERNAL,
        });
      }
    },
    [pair]
  );

  function handleSubmit() {
    void runLookup(input, sourceLang);
  }

  function handleRetry() {
    const last = lastRequestRef.current;
    if (!last) {
      handleSubmit();
      return;
    }

    setInput(last.word);
    setSourceLang(last.sourceLang);
    void runLookup(last.word, last.sourceLang);
  }

  function handleRecentSelect(entry: RecentEntry) {
    setInput(entry.word);
    setPair({ source: entry.sourceLang, target: entry.targetLang });
    setSourceLang(entry.sourceLang);
    setResultKey(
      `${entry.word}|${entry.sourceLang}|${entry.targetLang}|${entry.timestamp}`
    );
    setStatus({ kind: "success", result: entry.result });
    lastRequestRef.current = {
      word: entry.word,
      sourceLang: entry.sourceLang,
      targetLang: entry.targetLang,
    };
  }

  const loading = status.kind === "loading";

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-8">
        <PairSelector pair={pair} onPairChange={handlePairChange} />

        <LookupForm
          pair={pair}
          sourceLang={sourceLang}
          input={input}
          loading={loading}
          onSourceLangChange={setSourceLang}
          onInputChange={setInput}
          onSubmit={handleSubmit}
        />

        {status.kind === "loading" ? <LoadingCard /> : null}

        {status.kind === "success" ? (
          <ResultCard key={resultKey ?? undefined} result={status.result} />
        ) : null}

        {status.kind === "error" ? (
          <ErrorCard message={status.message} onRetry={handleRetry} />
        ) : null}

        <RecentLookups entries={recents} onSelect={handleRecentSelect} />
      </div>
    </TooltipProvider>
  );
}
