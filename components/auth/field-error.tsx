"use client";

import { cn } from "@/lib/utils";

type FieldErrorProps = {
  id?: string;
  messages?: string[];
  className?: string;
};

export function FieldError({ id, messages, className }: FieldErrorProps) {
  if (!messages?.length) {
    return null;
  }

  return (
    <p
      id={id}
      role="alert"
      className={cn("text-sm text-destructive", className)}
    >
      {messages[0]}
    </p>
  );
}
