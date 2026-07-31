import cors from "@fastify/cors";
import Fastify from "fastify";
import { createAppConfig, type GeneratorAppConfig } from "./config/app-config.js";
import { loadEnvironment } from "./config/environment.js";
import { registerErrorHandler } from "./api/middleware/error-handler.js";
import { registerLocalAccessGuard } from "./api/middleware/local-access-guard.js";
import { registerRequestContext } from "./api/middleware/request-context.js";
import { registerRequestLogger } from "./api/middleware/request-logger.js";
import { registerContentRoutes } from "./api/routes/content-routes.js";
import { registerDashboardRoutes } from "./api/routes/dashboard-routes.js";
import { registerDocsRoutes } from "./api/routes/docs-routes.js";
import { registerHealthRoutes } from "./api/routes/health-routes.js";
import { registerLogsRoutes } from "./api/routes/logs-routes.js";
import { registerReadinessRoutes } from "./api/routes/readiness-routes.js";
import { registerSettingsRoutes } from "./api/routes/settings-routes.js";
import { registerSystemRoutes } from "./api/routes/system-routes.js";
import { registerVersionRoutes } from "./api/routes/version-routes.js";
import { ContentStatusService } from "./application/services/content-status-service.js";
import { DashboardService } from "./application/services/dashboard-service.js";
import { LogQueryService } from "./application/services/log-query-service.js";
import { ReadinessService } from "./application/services/readiness-service.js";
import { SettingsService } from "./application/services/settings-service.js";
import { SystemService } from "./application/services/system-service.js";
import { VersionService } from "./application/services/version-service.js";
import { AiReadiness } from "./infrastructure/ai/ai-readiness.js";
import { ContentStorageReadiness } from "./infrastructure/filesystem/content-storage-readiness.js";
import { JsonSettingsRepository } from "./infrastructure/filesystem/json-settings-repository.js";
import { StaticContentInspector } from "./infrastructure/filesystem/static-content-inspector.js";
import { GitHubReadiness } from "./infrastructure/github/github-readiness.js";
import { ApplicationLogger } from "./infrastructure/logging/application-logger.js";
import { EnvironmentInspector } from "./infrastructure/system/environment-inspector.js";

declare module "fastify" {
  interface FastifyInstance {
    appConfig: GeneratorAppConfig;
    applicationLogger: ApplicationLogger;
    contentStatusService: ContentStatusService;
    dashboardService: DashboardService;
    logQueryService: LogQueryService;
    readinessService: ReadinessService;
    settingsService: SettingsService;
    systemService: SystemService;
    versionService: VersionService;
  }
}

export async function buildServer() {
  const environment = loadEnvironment();
  const appConfig = createAppConfig(environment);
  const app = Fastify({
    bodyLimit: 256 * 1024,
    logger: {
      level: environment.NODE_ENV === "test" ? "silent" : "info"
    }
  });
  const applicationLogger = new ApplicationLogger(appConfig.logDirectory);
  const contentInspector = new StaticContentInspector(appConfig.dataDirectory);
  const contentStatusService = new ContentStatusService(contentInspector);
  const settingsService = new SettingsService(new JsonSettingsRepository(appConfig), appConfig);
  const logQueryService = new LogQueryService(applicationLogger);

  app.decorate("appConfig", appConfig);
  app.decorate("applicationLogger", applicationLogger);
  app.decorate("contentStatusService", contentStatusService);
  app.decorate(
    "dashboardService",
    new DashboardService(appConfig, contentStatusService, settingsService, logQueryService)
  );
  app.decorate("logQueryService", logQueryService);
  app.decorate("readinessService", createReadinessService(appConfig));
  app.decorate("settingsService", settingsService);
  app.decorate(
    "systemService",
    new SystemService(new EnvironmentInspector(appConfig, contentInspector))
  );
  app.decorate("versionService", new VersionService(appConfig));

  await app.register(cors, {
    origin: appConfig.corsOrigins,
    credentials: false,
    methods: ["GET", "PUT", "OPTIONS"]
  });

  registerRequestContext(app);
  registerLocalAccessGuard(app);
  registerRequestLogger(app);
  registerErrorHandler(app);
  await app.register(registerHealthRoutes);
  await app.register(registerReadinessRoutes);
  await app.register(registerVersionRoutes);
  await app.register(registerDashboardRoutes);
  await app.register(registerContentRoutes);
  await app.register(registerSettingsRoutes);
  await app.register(registerLogsRoutes);
  await app.register(registerSystemRoutes);
  await app.register(registerDocsRoutes);

  await applicationLogger.log("INFO", "APPLICATION", "Generator API initialized", {
    phase: appConfig.phase
  });

  return app;
}

function createReadinessService(config: GeneratorAppConfig): ReadinessService {
  return new ReadinessService({
    filesystem: new ContentStorageReadiness(config.dataDirectory),
    github: new GitHubReadiness(config.githubConfigured),
    ai: new AiReadiness(config.aiConfigured)
  });
}
