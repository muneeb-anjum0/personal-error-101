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

export interface LocalAiRuntimeProgress {
  phase: "PROMPT_PROCESSING" | "WRITING";
  promptTokensProcessed: number;
  promptTokensTotal: number;
  generatedTokens: number;
  maxOutputTokens: number;
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

  public async inspectActiveProgress(signal?: AbortSignal): Promise<LocalAiRuntimeProgress | null> {
    const response = await this.request("/slots", { method: "GET", signal, timeoutMs: 2000 });
    if (!response.ok) return null;
    const slots = (await response.json()) as Array<{
      is_processing?: boolean;
      n_prompt_tokens?: number;
      n_prompt_tokens_processed?: number;
      params?: { max_tokens?: number; n_predict?: number };
      next_token?: Array<{ n_decoded?: number }>;
    }>;
    const slot = slots.find((item) => item.is_processing);
    if (!slot) return null;
    const promptTokensTotal = Math.max(0, slot.n_prompt_tokens ?? 0);
    const promptTokensProcessed = Math.min(
      promptTokensTotal,
      Math.max(0, slot.n_prompt_tokens_processed ?? 0)
    );
    return {
      phase: promptTokensProcessed < promptTokensTotal ? "PROMPT_PROCESSING" : "WRITING",
      promptTokensProcessed,
      promptTokensTotal,
      generatedTokens: Math.max(0, slot.next_token?.[0]?.n_decoded ?? 0),
      maxOutputTokens: Math.max(0, slot.params?.max_tokens ?? slot.params?.n_predict ?? 0)
    };
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
        // Node's built-in HTTP client gives up if no response headers arrive for
        // roughly five minutes. CPU-only inference can legitimately take longer
        // than that, so stream the response to receive headers immediately while
        // preserving exactly the same generated content.
        stream: true,
        stream_options: { include_usage: true }
      })
    });
    if (!response.ok) {
      throw new Error(`AI chat request failed with status ${response.status}.`);
    }
    const streamed = await readChatCompletionStream(response);
    const rawText = streamed.rawText;
    if (rawText.length > 256_000) {
      throw new Error("AI response exceeded size limit.");
    }
    return {
      rawText,
      parsedJson: safeParseJson(rawText),
      latencyMs: Date.now() - started,
      model: streamed.model ?? request.model,
      usage: usage(streamed.usage),
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

interface StreamedChatCompletion {
  rawText: string;
  model: string | null;
  usage?: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number };
}

async function readChatCompletionStream(response: Response): Promise<StreamedChatCompletion> {
  if (!response.body) {
    throw new Error("AI chat response did not include a response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let rawText = "";
  let model: string | null = null;
  let finalUsage: StreamedChatCompletion["usage"];

  const consumeLine = (line: string): void => {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data:")) return;
    const payload = trimmed.slice(5).trim();
    if (!payload || payload === "[DONE]") return;

    const event = JSON.parse(payload) as {
      model?: string;
      choices?: Array<{ delta?: { content?: string } }>;
      usage?: StreamedChatCompletion["usage"];
    };
    rawText += event.choices?.[0]?.delta?.content ?? "";
    model = event.model ?? model;
    finalUsage = event.usage ?? finalUsage;
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split(/\r?\n/);
    buffer = done ? "" : (lines.pop() ?? "");
    for (const line of lines) consumeLine(line);
    if (done) {
      if (buffer.trim()) consumeLine(buffer);
      break;
    }
  }

  return { rawText, model, usage: finalUsage };
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
  if (!["127.0.0.1", "localhost", "host.docker.internal", "llama-server"].includes(url.hostname)) {
    throw new Error("AI base URL must be local unless a development override is explicitly added.");
  }
}
