import type { GeneratorEnvironment } from "@muneeb-systems/shared-config";
import path from "node:path";

export interface GeneratorAppConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  version: string;
  phase: string;
  environment: string;
  repositoryRoot: string;
  dataDirectory: string;
  logDirectory: string;
  settingsPath: string;
  settingsBackupDirectory: string;
  githubStateDirectory: string;
  githubRepositoriesPath: string;
  githubSyncStatePath: string;
  githubSelectionsPath: string;
  githubHistoryDirectory: string;
  githubBackupDirectory: string;
  githubToken: string;
  githubRepositoryLimit: number;
  githubConcurrency: number;
  aiStateDirectory: string;
  aiRuntimeStatePath: string;
  aiQueuePath: string;
  aiQueueEventsPath: string;
  aiDraftDirectory: string;
  aiCheckpointDirectory: string;
  aiBackupDirectory: string;
  aiLogDirectory: string;
  reviewDirectory: string;
  reviewStatePath: string;
  reviewApprovalsPath: string;
  reviewRejectionsPath: string;
  reviewAuditPath: string;
  reviewRevisionDirectory: string;
  reviewBackupDirectory: string;
  stagedDirectory: string;
  stagedMetadataPath: string;
  stagedBackupDirectory: string;
  previewDirectory: string;
  previewSessionsDirectory: string;
  previewCurrentPath: string;
  publishingDirectory: string;
  publishingBundlesDirectory: string;
  publishingCurrentPath: string;
  publishingDiffDirectory: string;
  publishingBackupDirectory: string;
  publishingRunsPath: string;
  publishingRunsDirectory: string;
  publishingAuditPath: string;
  publishingBuildLogDirectory: string;
  publishingConfirmationPath: string;
  aiHostBaseUrl: string;
  aiApiKey: string;
  aiContextSize: number;
  aiParallelRequests: number;
  aiGpuLayers: number;
  aiMaxVramGb: number;
  aiServerPort: number;
  aiServerHost: string;
  aiServerExecutable: string;
  aiRuntimeMode: "external" | "managed";
  portfolioPath: string;
  generatorUiPort: number;
  modelPath: string;
  modelName: string;
  modelBaseUrl: string;
  githubUsername: string;
  includePrivateRepositories: boolean;
  githubConfigured: boolean;
  aiConfigured: boolean;
  serverStartedAt: Date;
}

export function createAppConfig(environment: GeneratorEnvironment): GeneratorAppConfig {
  const repositoryRoot = path.resolve(process.cwd(), "../../..");
  const dataDirectory = process.env.GENERATOR_DATA_DIR
    ? path.resolve(process.env.GENERATOR_DATA_DIR)
    : path.join(repositoryRoot, "data");
  const logDirectory = path.join(dataDirectory, "logs");

  return {
    host: environment.GENERATOR_HOST,
    port: environment.GENERATOR_API_PORT,
    corsOrigins: ["http://localhost:4173", "http://127.0.0.1:4173"],
    version: "0.0.0",
    phase: "direct-content-generator",
    environment: environment.NODE_ENV,
    repositoryRoot,
    dataDirectory,
    logDirectory,
    settingsPath: path.join(dataDirectory, "generator-settings.json"),
    settingsBackupDirectory: path.join(dataDirectory, "backups", "generator-settings"),
    githubStateDirectory: path.join(dataDirectory, "github"),
    githubRepositoriesPath: path.join(dataDirectory, "github", "repositories.json"),
    githubSyncStatePath: path.join(dataDirectory, "github", "sync-state.json"),
    githubSelectionsPath: path.join(dataDirectory, "github", "selections.json"),
    githubHistoryDirectory: path.join(dataDirectory, "github", "history"),
    githubBackupDirectory: path.join(dataDirectory, "github", "backups"),
    portfolioPath: path.join(repositoryRoot, "apps", "portfolio"),
    generatorUiPort: Number(process.env.GENERATOR_UI_PORT ?? 4173),
    modelPath: environment.LOCAL_AI_MODEL_PATH,
    modelName: environment.LOCAL_AI_MODEL,
    modelBaseUrl: environment.LOCAL_AI_BASE_URL,
    githubUsername: environment.GITHUB_USERNAME,
    includePrivateRepositories: environment.GITHUB_INCLUDE_PRIVATE,
    githubToken: environment.GITHUB_TOKEN,
    githubRepositoryLimit: boundedNumber(process.env.GITHUB_REPOSITORY_LIMIT, 500, 1, 500),
    githubConcurrency: boundedNumber(process.env.GITHUB_SYNC_CONCURRENCY, 3, 1, 4),
    aiStateDirectory: path.join(dataDirectory, "ai"),
    aiRuntimeStatePath: path.join(dataDirectory, "ai", "runtime-state.json"),
    aiQueuePath: path.join(dataDirectory, "ai", "queue.json"),
    aiQueueEventsPath: path.join(dataDirectory, "ai", "queue-events.jsonl"),
    aiDraftDirectory: path.join(dataDirectory, "ai", "drafts"),
    aiCheckpointDirectory: path.join(dataDirectory, "ai", "checkpoints"),
    aiBackupDirectory: path.join(dataDirectory, "ai", "backups"),
    aiLogDirectory: path.join(dataDirectory, "ai", "logs"),
    reviewDirectory: path.join(dataDirectory, "review"),
    reviewStatePath: path.join(dataDirectory, "review", "reviews.json"),
    reviewApprovalsPath: path.join(dataDirectory, "review", "approvals.json"),
    reviewRejectionsPath: path.join(dataDirectory, "review", "rejections.json"),
    reviewAuditPath: path.join(dataDirectory, "review", "audit-events.jsonl"),
    reviewRevisionDirectory: path.join(dataDirectory, "review", "revisions"),
    reviewBackupDirectory: path.join(dataDirectory, "review", "backups"),
    stagedDirectory: path.join(dataDirectory, "staged"),
    stagedMetadataPath: path.join(dataDirectory, "staged", "metadata.json"),
    stagedBackupDirectory: path.join(dataDirectory, "staged", "backups"),
    previewDirectory: path.join(dataDirectory, "preview"),
    previewSessionsDirectory: path.join(dataDirectory, "preview", "sessions"),
    previewCurrentPath: path.join(dataDirectory, "preview", "current.json"),
    publishingDirectory: path.join(dataDirectory, "publishing"),
    publishingBundlesDirectory: path.join(dataDirectory, "publishing", "bundles"),
    publishingCurrentPath: path.join(dataDirectory, "publishing", "current.json"),
    publishingDiffDirectory: path.join(dataDirectory, "publishing", "diffs"),
    publishingBackupDirectory: path.join(dataDirectory, "publishing", "backups"),
    publishingRunsPath: path.join(dataDirectory, "publishing", "runs.json"),
    publishingRunsDirectory: path.join(dataDirectory, "publishing", "runs"),
    publishingAuditPath: path.join(dataDirectory, "publishing", "audit-events.jsonl"),
    publishingBuildLogDirectory: path.join(dataDirectory, "publishing", "build-logs"),
    publishingConfirmationPath: path.join(dataDirectory, "publishing", "confirmations.json"),
    aiHostBaseUrl: environment.LOCAL_AI_HOST_BASE_URL,
    aiApiKey: environment.LOCAL_AI_API_KEY,
    aiContextSize: environment.LOCAL_AI_CONTEXT_SIZE,
    aiParallelRequests: environment.LOCAL_AI_PARALLEL_REQUESTS,
    aiGpuLayers: environment.LOCAL_AI_GPU_LAYERS,
    aiMaxVramGb: environment.LOCAL_AI_MAX_VRAM_GB,
    aiServerPort: environment.LOCAL_AI_SERVER_PORT,
    aiServerHost: environment.LOCAL_AI_SERVER_HOST,
    aiServerExecutable: environment.LOCAL_AI_SERVER_EXECUTABLE,
    aiRuntimeMode: environment.LOCAL_AI_RUNTIME_MODE,
    githubConfigured: environment.GITHUB_TOKEN.trim().length > 0,
    aiConfigured: environment.LOCAL_AI_MODEL_PATH.trim().length > 0,
    serverStartedAt: new Date()
  };
}

function boundedNumber(
  value: string | undefined,
  fallback: number,
  min: number,
  max: number
): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}
