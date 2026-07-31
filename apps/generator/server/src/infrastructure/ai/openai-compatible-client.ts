import type {
  AiHealthResult,
  AiModelInfo,
  AiTestGenerationResult,
  AiWarmUpResult,
  GenerationUsage
} from "@muneeb-systems/shared-types";

export interface LocalAiGenerateRequest {
  model: string;
  messages: Array<{ role: "system" | "user"; content: string }>;
  temperature?: number;
  topP?: number;
  maxOutputTokens: number;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export class OpenAiCompatibleClient {
  public constructor(
    private readonly baseUrl: string,
    private readonly apiKey: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {}

  public async inspectModels(signal?: AbortSignal): Promise<AiModelInfo[]> {
    const response = await this.request("/models", { method: "GET", signal, timeoutMs: 5000 });
    if (!response.ok) {
      return [];
    }
    const json = (await response.json()) as { data?: Array<Record<string, unknown>> };
    return (json.data ?? [])
      .filter((item) => typeof item.id === "string")
      .map((item) => ({
        id: item.id as string,
        ownedBy: typeof item.owned_by === "string" ? item.owned_by : null,
        contextWindow: typeof item.context_window === "number" ? item.context_window : null
      }));
  }

  public async healthCheck(model: string): Promise<AiHealthResult> {
    const started = Date.now();
    try {
      const models = await this.inspectModels();
      const configuredModelAvailable =
        models.length === 0 || models.some((item) => item.id === model || item.id.includes(model));
      return {
        endpointReachable: true,
        modelsEndpointAvailable: models.length > 0,
        chatEndpointWorking: false,
        configuredModelAvailable,
        detectedModelNames: models.map((item) => item.id),
        latencyMs: Date.now() - started,
        httpStatus: 200,
        checkedAt: new Date().toISOString(),
        errorCategory: configuredModelAvailable ? null : "MODEL_MISMATCH",
        errorMessage: configuredModelAvailable ? null : "Configured model was not found in /models."
      };
    } catch (error) {
      return {
        endpointReachable: false,
        modelsEndpointAvailable: false,
        chatEndpointWorking: false,
        configuredModelAvailable: false,
        detectedModelNames: [],
        latencyMs: Date.now() - started,
        httpStatus: null,
        checkedAt: new Date().toISOString(),
        errorCategory: "ENDPOINT_UNREACHABLE",
        errorMessage: error instanceof Error ? error.message : "AI endpoint unreachable."
      };
    }
  }

  public async warmUp(model: string): Promise<AiWarmUpResult> {
    const startedAt = new Date().toISOString();
    const started = Date.now();
    try {
      const result = await this.generate({
        model,
        messages: [
          { role: "system", content: "Return only JSON." },
          { role: "user", content: '{"ready":true}' }
        ],
        temperature: 0,
        maxOutputTokens: 48,
        timeoutMs: 90_000
      });
      JSON.parse(extractJson(result.rawText));
      return {
        success: true,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        model,
        error: null
      };
    } catch (error) {
      return {
        success: false,
        startedAt,
        completedAt: new Date().toISOString(),
        durationMs: Date.now() - started,
        model,
        error: error instanceof Error ? error.message : "Warm-up failed."
      };
    }
  }

  public async generate(request: LocalAiGenerateRequest): Promise<AiTestGenerationResult> {
    const started = Date.now();
    const response = await this.request("/chat/completions", {
      method: "POST",
      signal: request.signal,
      timeoutMs: request.timeoutMs ?? 600_000,
      body: JSON.stringify({
        model: request.model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        top_p: request.topP ?? 0.9,
        max_tokens: request.maxOutputTokens,
        stream: false
      })
    });
    if (!response.ok) {
      throw new Error(`AI chat request failed with status ${response.status}.`);
    }
    const json = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
      model?: string;
    };
    const rawText = json.choices?.[0]?.message?.content ?? "";
    if (rawText.length > 256_000) {
      throw new Error("AI response exceeded size limit.");
    }
    return {
      rawText,
      parsedJson: safeParseJson(rawText),
      latencyMs: Date.now() - started,
      model: json.model ?? request.model,
      usage: usage(json.usage),
      generatedAt: new Date().toISOString()
    };
  }

  private async request(
    path: string,
    init: RequestInit & { timeoutMs?: number }
  ): Promise<Response> {
    const url = new URL(path, this.baseUrl);
    assertLocalUrl(url);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? 10_000);
    init.signal?.addEventListener("abort", () => controller.abort(), { once: true });
    try {
      return await this.fetchImpl(url, {
        ...init,
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${this.apiKey}`,
          ...(init.headers ?? {})
        }
      });
    } finally {
      clearTimeout(timeout);
    }
  }
}

export function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  return (fenced?.[1] ?? raw).trim();
}

function safeParseJson(raw: string): unknown {
  try {
    return JSON.parse(extractJson(raw)) as unknown;
  } catch {
    return null;
  }
}

function usage(
  value: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | undefined
): GenerationUsage {
  return {
    promptTokens: value?.prompt_tokens ?? null,
    completionTokens: value?.completion_tokens ?? null,
    totalTokens: value?.total_tokens ?? null
  };
}

function assertLocalUrl(url: URL): void {
  if (!["127.0.0.1", "localhost", "host.docker.internal"].includes(url.hostname)) {
    throw new Error("AI base URL must be local unless a development override is explicitly added.");
  }
}
