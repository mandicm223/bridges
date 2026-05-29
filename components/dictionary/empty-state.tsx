"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

type EmptyStateProps =
  | { kind: "true-empty" }
  | { kind: "no-matches" };

export function EmptyState(props: EmptyStateProps) {
  if (props.kind === "true-empty") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
        <p className="font-serif text-2xl tracking-tight text-foreground">
          Your dictionary is empty
        </p>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Save a word from a lookup and it will live here — a little collection
          of meanings that matter to you.
        </p>
        <Button render={<Link href="/" />} nativeButton={false} className="mt-6">
          Look up your first word
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card/50 px-6 py-10 text-center">
      <p className="text-sm text-muted-foreground">No matches for that search.</p>
      <Button
        render={<Link href="/dictionary" />}
        nativeButton={false}
        variant="link"
        className="mt-2"
      >
        Clear filters
      </Button>
    </div>
  );
}
