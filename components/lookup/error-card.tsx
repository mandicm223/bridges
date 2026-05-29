"use client";

import { Button } from "@/components/ui/button";

type ErrorCardProps = {
  message: string;
  onRetry: () => void;
};

export function ErrorCard({ message, onRetry }: ErrorCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="space-y-1">
          <p className="font-medium text-foreground">
            We couldn&apos;t finish that lookup
          </p>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button type="button" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
