"use client";

import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

type SubmitButtonProps = {
  pending: boolean;
  label: string;
  pendingLabel?: string;
  className?: string;
  disabled?: boolean;
};

export function SubmitButton({
  pending,
  label,
  pendingLabel = "Working…",
  className,
  disabled = false,
}: SubmitButtonProps) {
  return (
    <Button type="submit" disabled={pending || disabled} className={className}>
      {pending ? (
        <>
          <Loader2Icon className="animate-spin" aria-hidden="true" />
          {pendingLabel}
        </>
      ) : (
        label
      )}
    </Button>
  );
}
