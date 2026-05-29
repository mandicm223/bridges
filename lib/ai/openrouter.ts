const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openai/gpt-5.4";
const REQUEST_TIMEOUT_MS = 30_000;

export class AiUpstreamError extends Error {
  readonly upstreamStatus: number | null;
  readonly latencyMs: number;

  constructor(
    message: string,
    upstreamStatus: number | null,
    latencyMs: number
  ) {
    super(message);
    this.name = "AiUpstreamError";
    this.upstreamStatus = upstreamStatus;
    this.latencyMs = latencyMs;
  }
}

export class InternalError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InternalError";
  }
}

export type OpenRouterMessage = {
  system: string;
  user: string;
};

type OpenRouterResponse = {
  choices?: Array<{
    message?: {
      content?: string | null;
    };
  }>;
};

export function getOpenRouterModel(): string {
  return process.env.OPENROUTER_MODEL?.trim() || DEFAULT_MODEL;
}

export async function callOpenRouter(
  messages: OpenRouterMessage
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();

  if (!apiKey) {
    throw new InternalError("OPENROUTER_API_KEY is not configured.");
  }

  const startedAt = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Title": "Bridges",
      },
      body: JSON.stringify({
        model: getOpenRouterModel(),
        messages: [
          { role: "system", content: messages.system },
          { role: "user", content: messages.user },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
        stream: false,
      }),
      signal: controller.signal,
    });

    const latencyMs = Date.now() - startedAt;

    if (!response.ok) {
      throw new AiUpstreamError(
        "OpenRouter request failed.",
        response.status,
        latencyMs
      );
    }

    let payload: OpenRouterResponse;

    try {
      payload = (await response.json()) as OpenRouterResponse;
    } catch {
      throw new AiUpstreamError(
        "OpenRouter returned invalid JSON.",
        response.status,
        latencyMs
      );
    }

    const content = payload.choices?.[0]?.message?.content;

    if (!content || !content.trim()) {
      throw new AiUpstreamError(
        "OpenRouter returned an empty response.",
        response.status,
        latencyMs
      );
    }

    return content;
  } catch (error) {
    const latencyMs = Date.now() - startedAt;

    if (error instanceof AiUpstreamError) {
      throw error;
    }

    if (error instanceof Error && error.name === "AbortError") {
      throw new AiUpstreamError("OpenRouter request timed out.", null, latencyMs);
    }

    throw new AiUpstreamError(
      "OpenRouter request failed unexpectedly.",
      null,
      latencyMs
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
