import type { ApiErrorResponse } from "@muneeb-systems/shared-types";

export class GeneratorApiError extends Error {
  public constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
    public readonly code = "REQUEST_FAILED"
  ) {
    super(message);
  }
}

export function toFriendlyError(error: unknown): string {
  if (error instanceof GeneratorApiError) {
    return `${error.code}: ${error.message}`;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Generator API request failed.";
}

export function parseApiError(body: unknown, status: number): GeneratorApiError {
  const candidate = body as Partial<ApiErrorResponse>;
  return new GeneratorApiError(
    candidate.error?.message ?? `Generator API returned ${status}`,
    status,
    candidate.error?.requestId,
    candidate.error?.code
  );
}
