"use client";

import { useEffect, useState } from "react";
import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { isSupported, recognise } from "@/lib/speech/stt";
import { LANGUAGE_BY_CODE, type LanguageCode } from "@/lib/languages";
import { cn } from "@/lib/utils";

type MicButtonProps = {
  sourceLang: LanguageCode;
  disabled?: boolean;
  onTranscript: (text: string) => void;
};

const UNSUPPORTED_MESSAGE =
  "Voice input isn't supported in this browser — try Chrome or Safari";

export function MicButton({
  sourceLang,
  disabled = false,
  onTranscript,
}: MicButtonProps) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    setSupported(isSupported());
  }, []);

  async function handleClick() {
    if (!supported || disabled || listening) {
      return;
    }

    setListening(true);

    try {
      const transcript = await recognise({
        lang: LANGUAGE_BY_CODE[sourceLang].bcp47,
      });
      onTranscript(transcript);
    } catch {
      // Ignore recognition errors at v1 — user can type instead.
    } finally {
      setListening(false);
    }
  }

  const micButton = (
    <Button
      type="button"
      variant="outline"
      size="icon"
      disabled={!supported || disabled || listening}
      onClick={handleClick}
      className={cn("shrink-0", listening && "animate-pulse")}
      aria-label={
        supported
          ? listening
            ? "Listening…"
            : "Speak your word"
          : "Voice input not supported"
      }
    >
      <Mic className="size-4" aria-hidden />
    </Button>
  );

  if (!supported) {
    return (
      <Tooltip>
        <TooltipTrigger
          render={<span className="inline-flex">{micButton}</span>}
        />
        <TooltipContent side="top" className="max-w-xs">
          {UNSUPPORTED_MESSAGE}
        </TooltipContent>
      </Tooltip>
    );
  }

  return micButton;
}
