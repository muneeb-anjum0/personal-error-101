import path from "node:path";
import cors from "@fastify/cors";
import Fastify from "fastify";
import { createAppConfig, type GeneratorAppConfig } from "./config/app-config.js";
import { loadEnvironment } from "./config/environment.js";
import { registerErrorHandler } from "./api/middleware/error-handler.js";
import { registerHealthRoutes } from "./api/routes/health-routes.js";
import { registerReadinessRoutes } from "./api/routes/readiness-routes.js";
import { registerVersionRoutes } from "./api/routes/version-routes.js";
import { ReadinessService } from "./application/services/readiness-service.js";
import { VersionService } from "./application/services/version-service.js";
import { AiReadiness } from "./infrastructure/ai/ai-readiness.js";
import { ContentStorageReadiness } from "./infrastructure/filesystem/content-storage-readiness.js";
import { GitHubReadiness } from "./infrastructure/github/github-readiness.js";

declare module "fastify" {
  interface FastifyInstance {
    appConfig: GeneratorAppConfig;
    readinessService: ReadinessService;
    versionService: VersionService;
  }
}

export async function buildServer() {
  const environment = loadEnvironment();
  const appConfig = createAppConfig(environment);
  const app = Fastify({
    logger: {
      level: environment.NODE_ENV === "test" ? "silent" : "info"
    }
  });

  app.decorate("appConfig", appConfig);
  app.decorate("readinessService", createReadinessService(appConfig));
  app.decorate("versionService", new VersionService(appConfig));

  await app.register(cors, {
    origin: appConfig.corsOrigins
  });

  registerErrorHandler(app);
  await app.register(registerHealthRoutes);
  await app.register(registerReadinessRoutes);
  await app.register(registerVersionRoutes);

  return app;
}

function createReadinessService(config: GeneratorAppConfig): ReadinessService {
  const dataDirectory =
    process.env.GENERATOR_DATA_DIR ?? path.resolve(process.cwd(), "../../../data");

  return new ReadinessService({
    filesystem: new ContentStorageReadiness(dataDirectory),
    github: new GitHubReadiness(config.githubConfigured),
    ai: new AiReadiness(config.aiConfigured)
  });
}
