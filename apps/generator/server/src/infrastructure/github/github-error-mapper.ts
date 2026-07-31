import { GeneratorError } from "../../domain/errors/generator-error.js";

export function mapGitHubError(response: Response, fallback: string): GeneratorError {
  if (response.status === 401) {
    return new GeneratorError("GITHUB_AUTHENTICATION_FAILED", "GitHub authentication failed.", 401);
  }
  if (response.status === 403) {
    if (
      response.headers.get("retry-after") ||
      response.headers.get("x-ratelimit-remaining") === "0"
    ) {
      return new GeneratorError("GITHUB_RATE_LIMITED", "GitHub rate limit reached.", 429);
    }
    return new GeneratorError("GITHUB_PERMISSION_DENIED", "GitHub permission denied.", 403);
  }
  if (response.status === 404) {
    return new GeneratorError(
      "GITHUB_RESOURCE_NOT_FOUND",
      "GitHub resource was not found or is not accessible.",
      404
    );
  }
  return new GeneratorError("GITHUB_REQUEST_FAILED", fallback, response.status);
}

export function sanitizeGitHubError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return message.replace(/gh[pousr]_[A-Za-z0-9_]+/g, "[REDACTED_TOKEN]");
}
