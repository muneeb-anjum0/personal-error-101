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
    phase: "phase-4-github-repository-sync",
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
