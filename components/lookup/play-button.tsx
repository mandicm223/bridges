"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { speak } from "@/lib/speech/tts";
import { cn } from "@/lib/utils";

type PlayButtonProps = {
  text: string;
  lang: string;
  label: string;
};

export function PlayButton({ text, lang, label }: PlayButtonProps) {
  const [muted, setMuted] = useState(false);
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      const loadVoices = () => window.speechSynthesis.getVoices();
      loadVoices();
      window.speechSynthesis.addEventListener("voiceschanged", loadVoices);
      return () => {
        window.speechSynthesis.removeEventListener("voiceschanged", loadVoices);
      };
    }
  }, []);

  function handleClick() {
    const result = speak({ text, lang });

    if (result === "spoken") {
      return;
    }

    setMuted(true);
    setShaking(true);
    window.setTimeout(() => {
      setMuted(false);
      setShaking(false);
    }, 1500);
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className={cn("shrink-0 text-muted-foreground", shaking && "animate-shake")}
      onClick={handleClick}
      aria-label={label}
    >
      {muted ? (
        <VolumeX className="size-4" aria-hidden />
      ) : (
        <Volume2 className="size-4" aria-hidden />
      )}
    </Button>
  );
}
