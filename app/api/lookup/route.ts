import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { AiUpstreamError, callOpenRouter, getOpenRouterModel, InternalError } from "@/lib/ai/openrouter";
import { parseAiResponse } from "@/lib/ai/parse-response";
import { buildLookupPrompt } from "@/lib/ai/prompt";
import {
  LookupRequestSchema,
  type LookupErrorCode,
  type LookupErrorResponse,
  type LookupResponse,
} from "@/lib/ai/schema";
import type { LanguageCode } from "@/lib/languages";
import { createClient } from "@/utils/supabase/server";

export const runtime = "nodejs";

const ERROR_MESSAGES: Record<LookupErrorCode, string> = {
  UNAUTHENTICATED: "Sign in required.",
  INVALID_INPUT: "That input doesn't look right.",
  AI_UPSTREAM_ERROR: "We couldn't reach the language model just now.",
  AI_BAD_OUTPUT: "Something didn't come back right. Try again?",
  INTERNAL: "Something went wrong on our side.",
};

const ERROR_STATUS: Record<LookupErrorCode, number> = {
  UNAUTHENTICATED: 401,
  INVALID_INPUT: 400,
  AI_UPSTREAM_ERROR: 502,
  AI_BAD_OUTPUT: 502,
  INTERNAL: 500,
};

type LookupErrorLog = {
  event: "lookup_error";
  error_code: LookupErrorCode;
  status: number;
  upstream_status: number | null;
  latency_ms: number | null;
  model: string;
  user_id: string | null;
  timestamp: string;
};

function errorResponse(
  code: LookupErrorCode,
  log?: Omit<LookupErrorLog, "event" | "error_code" | "status" | "timestamp">
): NextResponse<LookupErrorResponse> {
  const status = ERROR_STATUS[code];

  if (log) {
    console.error(
      JSON.stringify({
        event: "lookup_error",
        error_code: code,
        status,
        upstream_status: log.upstream_status,
        latency_ms: log.latency_ms,
        model: log.model,
        user_id: log.user_id,
        timestamp: new Date().toISOString(),
      } satisfies LookupErrorLog)
    );
  }

  return NextResponse.json(
    {
      error: {
        code,
        message: ERROR_MESSAGES[code],
      },
    },
    { status }
  );
}

function buildLookupResponse(
  request: {
    word: string;
    sourceLang: LanguageCode;
    targetLang: LanguageCode;
  },
  ai: {
    englishMeaning: string;
    culturalContext?: string;
    exampleSentence: string;
    equivalent: {
      text: string;
      note?: string;
    };
  }
): LookupResponse {
  return {
    word: request.word,
    sourceLang: request.sourceLang,
    targetLang: request.targetLang,
    englishMeaning: ai.englishMeaning,
    ...(ai.culturalContext ? { culturalContext: ai.culturalContext } : {}),
    exampleSentence: ai.exampleSentence,
    equivalent: {
      text: ai.equivalent.text,
      ...(ai.equivalent.note ? { note: ai.equivalent.note } : {}),
    },
  };
}

export async function POST(request: Request) {
  const model = getOpenRouterModel();
  const startedAt = Date.now();
  let userId: string | null = null;

  try {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return errorResponse("UNAUTHENTICATED");
    }

    userId = user.id;

    let body: unknown;

    try {
      body = await request.json();
    } catch {
      return errorResponse("INVALID_INPUT");
    }

    const parsedRequest = LookupRequestSchema.safeParse(body);

    if (!parsedRequest.success) {
      return errorResponse("INVALID_INPUT");
    }

    const { word, sourceLang, targetLang } = parsedRequest.data;

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("native_language")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    const nativeLanguage = (profile?.native_language ??
      sourceLang) as LanguageCode;

    const prompt = buildLookupPrompt({
      word,
      sourceLang,
      targetLang,
      nativeLanguage,
    });

    const rawResponse = await callOpenRouter(prompt);
    const aiResponse = parseAiResponse(rawResponse);

    if (!aiResponse) {
      return errorResponse("AI_BAD_OUTPUT", {
        upstream_status: null,
        latency_ms: Date.now() - startedAt,
        model,
        user_id: userId,
      });
    }

    return NextResponse.json(
      buildLookupResponse(
        { word, sourceLang, targetLang },
        aiResponse
      )
    );
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error instanceof AiUpstreamError) {
      return errorResponse("AI_UPSTREAM_ERROR", {
        upstream_status: error.upstreamStatus,
        latency_ms: error.latencyMs ?? latencyMs,
        model,
        user_id: userId,
      });
    }

    if (error instanceof InternalError) {
      return errorResponse("INTERNAL", {
        upstream_status: null,
        latency_ms: latencyMs,
        model,
        user_id: userId,
      });
    }

    return errorResponse("INTERNAL", {
      upstream_status: null,
      latency_ms: latencyMs,
      model,
      user_id: userId,
    });
  }
}
