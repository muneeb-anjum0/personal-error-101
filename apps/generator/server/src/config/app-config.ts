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
    phase: "phase-3-generator-platform",
    environment: environment.NODE_ENV,
    repositoryRoot,
    dataDirectory,
    logDirectory,
    settingsPath: path.join(dataDirectory, "generator-settings.json"),
    settingsBackupDirectory: path.join(dataDirectory, "backups", "generator-settings"),
    portfolioPath: path.join(repositoryRoot, "apps", "portfolio"),
    generatorUiPort: Number(process.env.GENERATOR_UI_PORT ?? 4173),
    modelPath: environment.LOCAL_AI_MODEL_PATH,
    modelName: environment.LOCAL_AI_MODEL,
    modelBaseUrl: environment.LOCAL_AI_BASE_URL,
    githubUsername: environment.GITHUB_USERNAME,
    includePrivateRepositories: environment.GITHUB_INCLUDE_PRIVATE,
    githubConfigured: environment.GITHUB_TOKEN.trim().length > 0,
    aiConfigured: environment.LOCAL_AI_MODEL_PATH.trim().length > 0,
    serverStartedAt: new Date()
  };
}
