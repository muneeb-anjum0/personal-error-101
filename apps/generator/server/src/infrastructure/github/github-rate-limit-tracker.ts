import type { GitHubAuthenticationMode, GitHubRateLimitStatus } from "@muneeb-systems/shared-types";

export class GitHubRateLimitTracker {
  private current: GitHubRateLimitStatus;

  public constructor(authenticationMode: GitHubAuthenticationMode) {
    this.current = {
      limit: 0,
      remaining: 0,
      used: 0,
      resetAt: null,
      retryAfterSeconds: null,
      authenticationMode,
      lastUpdatedAt: null
    };
  }

  public updateFromHeaders(headers: Headers): void {
    const limit = numberHeader(headers, "x-ratelimit-limit") ?? this.current.limit;
    const remaining = numberHeader(headers, "x-ratelimit-remaining") ?? this.current.remaining;
    const used = numberHeader(headers, "x-ratelimit-used") ?? this.current.used;
    const reset = numberHeader(headers, "x-ratelimit-reset");
    const retryAfter = numberHeader(headers, "retry-after");

    this.current = {
      ...this.current,
      limit,
      remaining,
      used,
      resetAt: reset ? new Date(reset * 1000).toISOString() : this.current.resetAt,
      retryAfterSeconds: retryAfter ?? null,
      lastUpdatedAt: new Date().toISOString()
    };
  }

  public snapshot(): GitHubRateLimitStatus {
    return { ...this.current };
  }
}

function numberHeader(headers: Headers, key: string): number | null {
  const value = headers.get(key);
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
