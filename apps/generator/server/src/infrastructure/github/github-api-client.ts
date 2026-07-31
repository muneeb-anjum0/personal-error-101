import type {
  GitHubRateLimitStatus,
  RepositoryLanguage,
  RepositoryReadme
} from "@muneeb-systems/shared-types";
import { GitHubAuthProvider } from "./github-auth-provider.js";
import { mapGitHubError, sanitizeGitHubError } from "./github-error-mapper.js";
import { fetchRepositoryLanguages } from "./github-language-fetcher.js";
import { parseNextLink } from "./github-pagination.js";
import { GitHubRateLimitTracker } from "./github-rate-limit-tracker.js";
import { fetchRepositoryReadme } from "./github-readme-fetcher.js";
import { isRecord, parseGitHubJson } from "./github-response-parser.js";
import type {
  GitHubListResult,
  GitHubRepositoryApiRecord,
  GitHubRepositorySource,
  RepositoryDiscoveryOptions,
  RepositoryIdentifier
} from "./github-types.js";

const GITHUB_API_ORIGIN = "https://api.github.com";
const MAX_TRANSIENT_RETRIES = 2;

export class GitHubApiClient implements GitHubRepositorySource {
  private readonly auth: GitHubAuthProvider;
  private readonly rateLimit: GitHubRateLimitTracker;

  public constructor(
    token: string,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    this.auth = new GitHubAuthProvider(token);
    this.rateLimit = new GitHubRateLimitTracker(this.auth.mode());
  }

  public async listRepositories(options: RepositoryDiscoveryOptions): Promise<GitHubListResult> {
    const repositories = new Map<string, GitHubRepositoryApiRecord>();
    const warnings: string[] = [];
    const includeAuthenticatedRepos =
      options.includePrivate && options.tokenConfigured && this.auth.tokenConfigured();
    let nextUrl: string | null = includeAuthenticatedRepos
      ? `${GITHUB_API_ORIGIN}/user/repos?per_page=100&sort=pushed&affiliation=owner,collaborator,organization_member`
      : `${GITHUB_API_ORIGIN}/users/${encodeURIComponent(options.username)}/repos?per_page=100&sort=pushed&type=owner`;
    let complete = true;

    while (nextUrl) {
      if (options.signal.aborted) {
        complete = false;
        warnings.push("Synchronization was cancelled while fetching repository pages.");
        break;
      }
      if (repositories.size >= options.limit) {
        complete = false;
        warnings.push(
          `Repository safety limit of ${options.limit} reached before pagination completed.`
        );
        break;
      }

      const response = await this.requestAbsolute(nextUrl, { signal: options.signal });
      if (!response.ok) {
        throw mapGitHubError(response, "GitHub repository list request failed.");
      }
      const body = await parseGitHubJson(response);
      if (!Array.isArray(body)) {
        complete = false;
        warnings.push("GitHub returned an invalid repository list payload.");
        break;
      }

      for (const item of body) {
        if (!isGitHubRepository(item)) {
          continue;
        }
        repositories.set(String(item.id), item);
        if (repositories.size >= options.limit) {
          complete = false;
          warnings.push(
            `Repository safety limit of ${options.limit} reached before pagination completed.`
          );
          break;
        }
      }
      nextUrl =
        repositories.size >= options.limit ? null : parseNextLink(response.headers.get("link"));
    }

    return { repositories: [...repositories.values()], complete, warnings };
  }

  public getReadme(
    repository: RepositoryIdentifier,
    signal: AbortSignal
  ): Promise<RepositoryReadme> {
    return fetchRepositoryReadme(this.request.bind(this), repository, signal);
  }

  public getLanguages(
    repository: RepositoryIdentifier,
    signal: AbortSignal
  ): Promise<RepositoryLanguage[]> {
    return fetchRepositoryLanguages(this.request.bind(this), repository, signal);
  }

  public async getLatestCommitSha(
    repository: RepositoryIdentifier,
    branch: string | null,
    signal: AbortSignal
  ): Promise<string | null> {
    if (!branch) {
      return null;
    }
    const response = await this.request(
      `/repos/${repository.owner}/${repository.name}/commits/${encodeURIComponent(branch)}`,
      { signal }
    );
    if (!response.ok) {
      return null;
    }
    const body = await parseGitHubJson(response);
    return isRecord(body) && typeof body.sha === "string" ? body.sha : null;
  }

  public async getRateLimit(): Promise<GitHubRateLimitStatus> {
    try {
      const response = await this.request("/rate_limit");
      this.rateLimit.updateFromHeaders(response.headers);
    } catch {
      return this.rateLimit.snapshot();
    }
    return this.rateLimit.snapshot();
  }

  private request(path: string, init: RequestInit = {}): Promise<Response> {
    if (/^https?:\/\//i.test(path)) {
      throw new Error("Only fixed GitHub API paths are allowed.");
    }
    return this.requestAbsolute(`${GITHUB_API_ORIGIN}${path}`, init);
  }

  private async requestAbsolute(url: string, init: RequestInit = {}): Promise<Response> {
    if (!url.startsWith(`${GITHUB_API_ORIGIN}/`)) {
      throw new Error("Only api.github.com requests are allowed.");
    }

    let attempt = 0;
    while (true) {
      try {
        const response = await this.fetchImpl(url, {
          ...init,
          headers: {
            accept: "application/vnd.github+json",
            "x-github-api-version": "2022-11-28",
            "user-agent": "muneeb-systems-generator",
            ...this.auth.headers(),
            ...(init.headers ?? {})
          }
        });
        this.rateLimit.updateFromHeaders(response.headers);
        if (response.status === 502 || response.status === 503 || response.status === 504) {
          throw new Error(`Transient GitHub status ${response.status}`);
        }
        return response;
      } catch (error) {
        if (init.signal?.aborted || attempt >= MAX_TRANSIENT_RETRIES) {
          throw new Error(sanitizeGitHubError(error));
        }
        await sleep(backoff(attempt));
        attempt += 1;
      }
    }
  }
}

function backoff(attempt: number): number {
  return 250 * 2 ** attempt + Math.floor(Math.random() * 100);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isGitHubRepository(value: unknown): value is GitHubRepositoryApiRecord {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.name === "string" &&
    typeof value.full_name === "string" &&
    isRecord(value.owner) &&
    typeof value.owner.login === "string" &&
    typeof value.html_url === "string" &&
    typeof value.clone_url === "string" &&
    typeof value.ssh_url === "string" &&
    typeof value.private === "boolean" &&
    typeof value.fork === "boolean" &&
    typeof value.archived === "boolean" &&
    typeof value.disabled === "boolean" &&
    typeof value.size === "number" &&
    typeof value.stargazers_count === "number" &&
    typeof value.watchers_count === "number" &&
    typeof value.forks_count === "number" &&
    typeof value.open_issues_count === "number"
  );
}
