import { Loader2 } from "lucide-react";

export function LoadingCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
      <div className="flex flex-col items-center justify-center gap-3 py-6 text-center">
        <Loader2
          className="size-8 animate-spin text-muted-foreground"
          aria-hidden
        />
        <p className="text-sm text-muted-foreground">Looking it up…</p>
      </div>
    </div>
  );
}
