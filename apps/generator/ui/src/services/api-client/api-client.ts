import {
  apiHealthResponseSchema,
  apiReadinessResponseSchema,
  apiVersionResponseSchema,
  contentDetailResponseSchema,
  contentStatusResponseSchema,
  dashboardOverviewSchema,
  generatorSettingsSchema,
  logsResponseSchema,
  systemInformationSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorSettingsUpdate } from "@muneeb-systems/shared-types";
import type { z } from "zod";
import { parseApiError } from "./api-error";

export class GeneratorApiClient {
  public constructor(private readonly baseUrl: string) {}

  public health(signal?: AbortSignal) {
    return this.get("/health", apiHealthResponseSchema, signal);
  }

  public readiness(signal?: AbortSignal) {
    return this.get("/ready", apiReadinessResponseSchema, signal);
  }

  public version(signal?: AbortSignal) {
    return this.get("/api/version", apiVersionResponseSchema, signal);
  }

  public dashboard(signal?: AbortSignal) {
    return this.get("/api/dashboard", dashboardOverviewSchema, signal);
  }

  public contentStatus(signal?: AbortSignal) {
    return this.get("/api/content/status", contentStatusResponseSchema, signal);
  }

  public contentDetail(type: string, signal?: AbortSignal) {
    return this.get(`/api/content/${type}`, contentDetailResponseSchema, signal);
  }

  public settings(signal?: AbortSignal) {
    return this.get("/api/settings", generatorSettingsSchema, signal);
  }

  public updateSettings(update: GeneratorSettingsUpdate, signal?: AbortSignal) {
    return this.request("/api/settings", generatorSettingsSchema, {
      method: "PUT",
      body: JSON.stringify(update),
      signal
    });
  }

  public logs(query = "", signal?: AbortSignal) {
    return this.get(`/api/logs${query}`, logsResponseSchema, signal);
  }

  public system(signal?: AbortSignal) {
    return this.get("/api/system", systemInformationSchema, signal);
  }

  private get<T extends z.ZodType>(
    path: string,
    schema: T,
    signal?: AbortSignal
  ): Promise<z.infer<T>> {
    return this.request(path, schema, { method: "GET", signal });
  }

  private async request<T extends z.ZodType>(
    path: string,
    schema: T,
    init: RequestInit
  ): Promise<z.infer<T>> {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 10_000);
    init.signal?.addEventListener("abort", () => controller.abort(), { once: true });

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers: {
          "content-type": "application/json",
          ...(init.headers ?? {})
        }
      });
      const body = await safeJson(response);
      if (!response.ok) {
        throw parseApiError(body, response.status);
      }
      return schema.parse(body);
    } finally {
      window.clearTimeout(timeout);
    }
  }
}

async function safeJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { error: { message: "API returned malformed JSON." } };
  }
}

export const generatorApiClient = new GeneratorApiClient(
  import.meta.env.VITE_GENERATOR_API_URL ?? "http://127.0.0.1:4000"
);
