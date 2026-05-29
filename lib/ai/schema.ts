import { z } from "zod";

export const languageCodeSchema = z.enum(["sr", "hu", "de"]);

const optionalText = z
  .string()
  .nullish()
  .transform((value) => {
    if (!value) {
      return undefined;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

export const LookupRequestSchema = z
  .object({
    word: z.string().trim().min(1).max(300),
    sourceLang: languageCodeSchema,
    targetLang: languageCodeSchema,
  })
  .refine((data) => data.sourceLang !== data.targetLang, {
    message: "sourceLang and targetLang must be different.",
    path: ["targetLang"],
  });

export const AiResponseSchema = z.object({
  englishMeaning: z.string().trim().min(1),
  culturalContext: optionalText,
  exampleSentence: z.string().trim().min(1),
  equivalent: z.object({
    text: z.string().trim().min(1),
    note: optionalText,
  }),
});

export type LookupRequest = z.infer<typeof LookupRequestSchema>;
export type AiResponse = z.infer<typeof AiResponseSchema>;

export type LookupResponse = {
  word: string;
  sourceLang: z.infer<typeof languageCodeSchema>;
  targetLang: z.infer<typeof languageCodeSchema>;
  englishMeaning: string;
  culturalContext?: string;
  exampleSentence: string;
  equivalent: {
    text: string;
    note?: string;
  };
};

export type LookupErrorCode =
  | "UNAUTHENTICATED"
  | "INVALID_INPUT"
  | "AI_UPSTREAM_ERROR"
  | "AI_BAD_OUTPUT"
  | "INTERNAL";

export type LookupErrorResponse = {
  error: {
    code: LookupErrorCode;
    message: string;
  };
};
