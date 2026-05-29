"use client";

import { useEffect, useState } from "react";
import type { SavedWord } from "@/lib/dictionary/types";
import { savedWordToLookupResponse } from "@/lib/dictionary/mappers";
import { ResultCard } from "@/components/lookup/result-card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { TooltipProvider } from "@/components/ui/tooltip";

type SavedSheetProps = {
  entry: SavedWord | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function useSheetSide(): "right" | "bottom" {
  const [side, setSide] = useState<"right" | "bottom">("right");

  useEffect(() => {
    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const updateSide = () => {
      setSide(mediaQuery.matches ? "bottom" : "right");
    };

    updateSide();
    mediaQuery.addEventListener("change", updateSide);

    return () => mediaQuery.removeEventListener("change", updateSide);
  }, []);

  return side;
}

export function SavedSheet({ entry, open, onOpenChange }: SavedSheetProps) {
  const side = useSheetSide();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className="w-full overflow-y-auto p-0 sm:max-w-xl"
      >
        {entry ? (
          <>
            <SheetHeader className="border-b border-border">
              <SheetTitle className="font-serif text-2xl tracking-tight">
                {entry.word}
              </SheetTitle>
              <SheetDescription>Saved lookup</SheetDescription>
            </SheetHeader>
            <div className="p-4">
              <TooltipProvider>
                <ResultCard
                  result={savedWordToLookupResponse(entry)}
                  variant="saved"
                  savedAt={entry.created_at}
                />
              </TooltipProvider>
            </div>
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
