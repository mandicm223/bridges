import type { LookupErrorCode } from "@/lib/ai/schema";

export const LOOKUP_ERROR_MESSAGES: Record<LookupErrorCode, string> = {
  UNAUTHENTICATED: "Sign in required.",
  INVALID_INPUT: "That input doesn't look right.",
  AI_UPSTREAM_ERROR: "We couldn't reach the language model just now.",
  AI_BAD_OUTPUT: "Something didn't come back right. Try again?",
  INTERNAL: "Something went wrong on our side.",
};
