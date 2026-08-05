import {
  apiHealthResponseSchema,
  apiReadinessResponseSchema,
  apiVersionResponseSchema,
  aiRuntimeStateSchema,
  aiTestGenerationResultSchema,
  contentDetailResponseSchema,
  contentStatusResponseSchema,
  dashboardOverviewSchema,
  generatorSettingsSchema,
  githubBulkSelectionResponseSchema,
  githubRateLimitStatusSchema,
  githubRepositoriesResponseSchema,
  githubStatusResponseSchema,
  githubSyncProgressSchema,
  githubSyncResponseSchema,
  processingQueueSchema,
  enqueueRepositoriesResponseSchema,
  draftsResponseSchema,
  generatedProjectDraftSchema,
  discoveredRepositorySchema,
  repositorySelectionSchema,
  logsResponseSchema,
  previewSessionSchema,
  publishingBundleSchema,
  commitResultSchema,
  gitDiffSummarySchema,
  gitPushReadinessSchema,
  githubTokenStatusSchema,
  portfolioBuildResultSchema,
  publicContentBackupSchema,
  publicContentValidationResultSchema,
  publishingConfirmationTokenSchema,
  publishingExecutionStatusSchema,
  publishingPreflightResultSchema,
  publishingRunSchema,
  publishingRunsResponseSchema,
  pushResultSchema,
  rollbackResultSchema,
  stagedContentBundleSchema,
  systemInformationSchema
} from "@muneeb-systems/shared-schemas";
import type {
  GitHubBulkSelectionRequest,
  GitHubNotesUpdate,
  GitHubSelectionUpdate,
  GitHubSyncRequest,
  AiTestGenerationRequest,
  EnqueueRepositoriesRequest,
  GeneratorSettingsUpdate,
  CommitRequest
} from "@muneeb-systems/shared-types";
import { z } from "zod";
import { parseApiError } from "./api-error";

const previewSessionsResponseSchema = z.object({
  items: z.array(previewSessionSchema),
  total: z.number().int().nonnegative()
});

const previewDataResponseSchema = z.object({
  session: previewSessionSchema,
  data: stagedContentBundleSchema
});

const publishingStatusSchema = z.object({
  schemaVersion: z.literal(1),
  bundles: z.number().int().nonnegative(),
  currentBundleId: z.string().nullable(),
  readyForManualPublish: z.boolean(),
  notice: z.string()
});

const publishingBundlesResponseSchema = z.object({
  items: z.array(publishingBundleSchema),
  total: z.number().int().nonnegative()
});

const publishingBackupsResponseSchema = z.object({
  items: z.array(publicContentBackupSchema),
  total: z.number().int().nonnegative()
});

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

  public githubStatus(signal?: AbortSignal) {
    return this.get("/api/github/status", githubStatusResponseSchema, signal);
  }

  public githubRateLimit(signal?: AbortSignal) {
    return this.get("/api/github/rate-limit", githubRateLimitStatusSchema, signal);
  }

  public githubRepositories(query = "", signal?: AbortSignal) {
    return this.get(`/api/github/repositories${query}`, githubRepositoriesResponseSchema, signal);
  }

  public githubRepository(repositoryId: string, signal?: AbortSignal) {
    return this.get(
      `/api/github/repositories/${encodeURIComponent(repositoryId)}`,
      discoveredRepositorySchema,
      signal
    );
  }

  public syncGithub(request: GitHubSyncRequest = {}, signal?: AbortSignal) {
    return this.request("/api/github/sync", githubSyncResponseSchema, {
      method: "POST",
      body: JSON.stringify(request),
      signal
    });
  }

  public fullSyncGithub(request: GitHubSyncRequest = {}, signal?: AbortSignal) {
    return this.request("/api/github/sync/full", githubSyncResponseSchema, {
      method: "POST",
      body: JSON.stringify(request),
      signal
    });
  }

  public cancelGithubSync(signal?: AbortSignal) {
    return this.request("/api/github/sync/cancel", githubSyncResponseSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public githubSyncStatus(signal?: AbortSignal) {
    return this.get("/api/github/sync/status", githubSyncProgressSchema, signal);
  }

  public updateGithubSelection(
    repositoryId: string,
    update: GitHubSelectionUpdate,
    signal?: AbortSignal
  ) {
    return this.request(
      `/api/github/selections/${encodeURIComponent(repositoryId)}`,
      repositorySelectionSchema,
      {
        method: "PUT",
        body: JSON.stringify(update),
        signal
      }
    );
  }

  public updateGithubNotes(repositoryId: string, update: GitHubNotesUpdate, signal?: AbortSignal) {
    return this.request(
      `/api/github/repositories/${encodeURIComponent(repositoryId)}/notes`,
      repositorySelectionSchema,
      {
        method: "PUT",
        body: JSON.stringify(update),
        signal
      }
    );
  }

  public bulkGithubSelection(request: GitHubBulkSelectionRequest, signal?: AbortSignal) {
    return this.request("/api/github/selections/bulk", githubBulkSelectionResponseSchema, {
      method: "POST",
      body: JSON.stringify(request),
      signal
    });
  }

  public aiRuntime(signal?: AbortSignal) {
    return this.get("/api/ai/runtime", aiRuntimeStateSchema, signal);
  }

  public checkAi(signal?: AbortSignal) {
    return this.request("/api/ai/check", aiRuntimeStateSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public startAi(signal?: AbortSignal) {
    return this.request("/api/ai/start", aiRuntimeStateSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public stopAi(signal?: AbortSignal) {
    return this.request("/api/ai/stop", aiRuntimeStateSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public warmAi(signal?: AbortSignal) {
    return this.request("/api/ai/warm-up", aiRuntimeStateSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public testAiGeneration(request: AiTestGenerationRequest, signal?: AbortSignal) {
    return this.request("/api/ai/test-generation", aiTestGenerationResultSchema, {
      method: "POST",
      body: JSON.stringify(request),
      signal
    });
  }

  public queue(signal?: AbortSignal) {
    return this.get("/api/queue", processingQueueSchema, signal);
  }

  public enqueueRepositories(request: EnqueueRepositoriesRequest, signal?: AbortSignal) {
    return this.request("/api/queue/enqueue", enqueueRepositoriesResponseSchema, {
      method: "POST",
      body: JSON.stringify(request),
      signal
    });
  }

  public startQueue(signal?: AbortSignal) {
    return this.request("/api/queue/start", processingQueueSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public pauseQueue(signal?: AbortSignal) {
    return this.request("/api/queue/pause", processingQueueSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public resumeQueue(signal?: AbortSignal) {
    return this.request("/api/queue/resume", processingQueueSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public cancelQueueJob(jobId: string, signal?: AbortSignal) {
    return this.request(
      `/api/queue/jobs/${encodeURIComponent(jobId)}/cancel`,
      processingQueueSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public retryQueueJob(jobId: string, signal?: AbortSignal) {
    return this.request(
      `/api/queue/jobs/${encodeURIComponent(jobId)}/retry`,
      processingQueueSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public retryFailedQueue(signal?: AbortSignal) {
    return this.request("/api/queue/retry-failed", processingQueueSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public drafts(signal?: AbortSignal) {
    return this.get("/api/drafts", draftsResponseSchema, signal);
  }

  public draft(draftId: string, signal?: AbortSignal) {
    return this.get(
      `/api/drafts/${encodeURIComponent(draftId)}`,
      generatedProjectDraftSchema,
      signal
    );
  }

  public deleteDraft(draftId: string, signal?: AbortSignal) {
    return this.request(`/api/drafts/${encodeURIComponent(draftId)}`, processingQueueSchema, {
      method: "DELETE",
      signal
    });
  }

  public stagedContent(type: string, signal?: AbortSignal) {
    return this.get(`/api/staged/${encodeURIComponent(type)}`, z.unknown(), signal);
  }

  public updateStagedContent(type: string, content: unknown, signal?: AbortSignal) {
    return this.request(`/api/staged/${encodeURIComponent(type)}`, z.unknown(), {
      method: "PUT",
      body: JSON.stringify(content),
      signal
    });
  }

  public addStagedProject(content: unknown, signal?: AbortSignal) {
    return this.request("/api/staged/projects", z.unknown(), {
      method: "POST",
      body: JSON.stringify(content),
      signal
    });
  }

  public updateStagedProject(projectId: string, content: unknown, signal?: AbortSignal) {
    return this.request(`/api/staged/projects/${encodeURIComponent(projectId)}`, z.unknown(), {
      method: "PUT",
      body: JSON.stringify(content),
      signal
    });
  }

  public hideStagedProject(projectId: string, signal?: AbortSignal) {
    return this.request(`/api/staged/projects/${encodeURIComponent(projectId)}/hide`, z.unknown(), {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public showStagedProject(projectId: string, signal?: AbortSignal) {
    return this.request(`/api/staged/projects/${encodeURIComponent(projectId)}/show`, z.unknown(), {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public deleteStagedProject(projectId: string, signal?: AbortSignal) {
    return this.request(
      `/api/staged/projects/${encodeURIComponent(projectId)}/stage-delete`,
      z.unknown(),
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public previewSessions(signal?: AbortSignal) {
    return this.get("/api/preview/sessions", previewSessionsResponseSchema, signal);
  }

  public createPreviewSession(signal?: AbortSignal) {
    return this.request("/api/preview/sessions", previewSessionSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public previewSession(sessionId: string, signal?: AbortSignal) {
    return this.get(
      `/api/preview/sessions/${encodeURIComponent(sessionId)}`,
      previewSessionSchema,
      signal
    );
  }

  public previewData(sessionId: string, signal?: AbortSignal) {
    return this.get(
      `/api/preview/sessions/${encodeURIComponent(sessionId)}/data`,
      previewDataResponseSchema,
      signal
    );
  }

  public publishingStatus(signal?: AbortSignal) {
    return this.get("/api/publishing/status", publishingStatusSchema, signal);
  }

  public publishingBundles(signal?: AbortSignal) {
    return this.get("/api/publishing/bundles", publishingBundlesResponseSchema, signal);
  }

  public preparePublishingBundle(signal?: AbortSignal) {
    return this.request("/api/publishing/bundles", publishingBundleSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
  }

  public publishingBundle(bundleId: string, signal?: AbortSignal) {
    return this.get(
      `/api/publishing/bundles/${encodeURIComponent(bundleId)}`,
      publishingBundleSchema,
      signal
    );
  }

  public publishingExecutionStatus(signal?: AbortSignal) {
    return this.get("/api/publishing/execution/status", publishingExecutionStatusSchema, signal);
  }

  public publishingRuns(signal?: AbortSignal) {
    return this.get("/api/publishing/runs", publishingRunsResponseSchema, signal);
  }

  public createPublishingRun(bundleId: string, signal?: AbortSignal) {
    return this.request("/api/publishing/runs", publishingRunSchema, {
      method: "POST",
      body: JSON.stringify({ bundleId }),
      signal
    });
  }

  public publishingRun(runId: string, signal?: AbortSignal) {
    return this.get(
      `/api/publishing/runs/${encodeURIComponent(runId)}`,
      publishingRunSchema,
      signal
    );
  }

  public runPublishingPreflight(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/preflight`,
      publishingPreflightResultSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public publishingRunDiff(runId: string, signal?: AbortSignal) {
    return this.get(
      `/api/publishing/runs/${encodeURIComponent(runId)}/diff`,
      gitDiffSummarySchema,
      signal
    );
  }

  public createPublishingBackup(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/backup`,
      publicContentBackupSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public applyPublishingRun(runId: string, confirmationToken: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/apply`,
      publishingRunSchema,
      {
        method: "POST",
        body: JSON.stringify({ confirmationToken }),
        signal
      }
    );
  }

  public validatePublishingRun(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/validate`,
      publicContentValidationResultSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public buildPublishingRun(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/build`,
      portfolioBuildResultSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public publishingGitDiff(runId: string, signal?: AbortSignal) {
    return this.get(
      `/api/publishing/runs/${encodeURIComponent(runId)}/git-diff`,
      gitDiffSummarySchema,
      signal
    );
  }

  public prepareCommitConfirmation(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/commit-confirmation`,
      publishingConfirmationTokenSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public commitPublishingRun(runId: string, request: CommitRequest, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/commit`,
      commitResultSchema,
      {
        method: "POST",
        body: JSON.stringify(request),
        signal
      }
    );
  }

  public preparePushConfirmation(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/push-confirmation`,
      publishingConfirmationTokenSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public pushPublishingRun(runId: string, confirmationToken: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/push`,
      pushResultSchema,
      {
        method: "POST",
        body: JSON.stringify({ confirmationToken }),
        signal
      }
    );
  }

  public prepareRollbackConfirmation(runId: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/rollback-confirmation`,
      publishingConfirmationTokenSchema,
      {
        method: "POST",
        body: JSON.stringify({}),
        signal
      }
    );
  }

  public rollbackPublishingRun(runId: string, confirmationToken: string, signal?: AbortSignal) {
    return this.request(
      `/api/publishing/runs/${encodeURIComponent(runId)}/rollback`,
      rollbackResultSchema,
      {
        method: "POST",
        body: JSON.stringify({ confirmationToken }),
        signal
      }
    );
  }

  public publishingBackups(signal?: AbortSignal) {
    return this.get("/api/publishing/backups", publishingBackupsResponseSchema, signal);
  }

  public gitPushReadiness(signal?: AbortSignal) {
    return this.get("/api/publishing/git/readiness", gitPushReadinessSchema, signal);
  }

  public githubAuthCheck(signal?: AbortSignal) {
    return this.request("/api/github/auth/check", githubTokenStatusSchema, {
      method: "POST",
      body: JSON.stringify({}),
      signal
    });
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
      const headers = new Headers(init.headers);
      if (init.body !== undefined && !headers.has("content-type")) {
        headers.set("content-type", "application/json");
      }
      const response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        signal: controller.signal,
        headers
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

function resolveApiBaseUrl(): string {
  const configured = import.meta.env.VITE_GENERATOR_API_URL;
  const currentHost = window.location.hostname;
  if (configured) {
    const url = new URL(configured);
    if (
      ["localhost", "127.0.0.1"].includes(url.hostname) &&
      !["localhost", "127.0.0.1"].includes(currentHost)
    ) {
      url.hostname = currentHost;
      return url.origin;
    }
    return url.origin;
  }
  return `${window.location.protocol}//${currentHost}:4000`;
}

export const generatorApiClient = new GeneratorApiClient(resolveApiBaseUrl());
