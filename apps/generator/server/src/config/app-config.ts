import type { GeneratorEnvironment } from "@muneeb-systems/shared-config";

export interface GeneratorAppConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  version: string;
  phase: string;
  githubConfigured: boolean;
  aiConfigured: boolean;
}

export function createAppConfig(environment: GeneratorEnvironment): GeneratorAppConfig {
  return {
    host: environment.GENERATOR_HOST,
    port: environment.GENERATOR_API_PORT,
    corsOrigins: ["http://localhost:4173", "http://127.0.0.1:4173"],
    version: "0.0.0",
    phase: "phase-0-foundation",
    githubConfigured: environment.GITHUB_TOKEN.trim().length > 0,
    aiConfigured: environment.LOCAL_AI_MODEL_PATH.trim().length > 0
  };
}
