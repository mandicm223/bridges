import { AiResponseSchema, type AiResponse } from "@/lib/ai/schema";

export function stripCodeFences(text: string): string {
  const trimmed = text.trim();
  const match = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return match ? match[1].trim() : trimmed;
}

export function parseAiResponse(raw: string): AiResponse | null {
  let parsed: unknown;

  try {
    parsed = JSON.parse(stripCodeFences(raw));
  } catch {
    return null;
  }

  const result = AiResponseSchema.safeParse(parsed);
  return result.success ? result.data : null;
}
