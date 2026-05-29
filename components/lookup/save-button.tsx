"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Check, Plus } from "lucide-react";
import { toast } from "sonner";
import type { LookupResponse } from "@/lib/ai/schema";
import { saveLookupAction } from "@/lib/dictionary/actions";
import { Button } from "@/components/ui/button";

type SaveButtonProps = {
  result: LookupResponse;
};

export function SaveButton({ result }: SaveButtonProps) {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSave() {
    if (saved || isPending) {
      return;
    }

    setSaved(true);

    startTransition(async () => {
      const response = await saveLookupAction(result);

      if (!response.ok) {
        setSaved(false);
        toast.error(response.error);
        return;
      }

      toast.success("Saved to dictionary", {
        action: {
          label: "View",
          onClick: () => router.push("/dictionary"),
        },
      });
    });
  }

  return (
    <Button
      type="button"
      variant={saved ? "secondary" : "outline"}
      className="gap-1.5"
      disabled={saved || isPending}
      onClick={handleSave}
      aria-label={saved ? "Saved to dictionary" : "Save to dictionary"}
    >
      {saved ? (
        <Check className="size-4" aria-hidden />
      ) : (
        <Plus className="size-4" aria-hidden />
      )}
      {saved ? "Saved" : "Save"}
    </Button>
  );
}
