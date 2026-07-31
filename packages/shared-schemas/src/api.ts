import { z } from "zod";

export const serviceStatusSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  status: z.enum(["ready", "valid", "invalid", "not_configured", "not_started", "unavailable"]),
  required: z.boolean(),
  message: z.string().min(1)
});

export const contentValidationIssueSchema = z.object({
  file: z.string().min(1),
  path: z.string().min(1),
  message: z.string().min(1),
  code: z.string().min(1),
  severity: z.enum(["error", "warning"]),
  remediation: z.string().min(1).optional()
});

export const contentFileTypeSchema = z.enum([
  "profile",
  "projects",
  "experience",
  "skills",
  "activity",
  "generator-state"
]);

export const contentFileStatusSchema = z.object({
  type: contentFileTypeSchema,
  label: z.string().min(1),
  fileName: z.string().min(1),
  relativePath: z.string().min(1),
  status: z.enum(["valid", "invalid", "missing", "malformed"]),
  recordCount: z.number().int().nonnegative(),
  sizeBytes: z.number().int().nonnegative(),
  modifiedAt: z.string().datetime().nullable(),
  schemaVersion: z.number().int().positive().nullable(),
  issues: z.array(contentValidationIssueSchema)
});

export const contentStatusResponseSchema = z.object({
  status: z.enum(["valid", "invalid"]),
  files: z.array(contentFileStatusSchema),
  inspectedAt: z.string().datetime()
});

export const contentDetailResponseSchema = z.object({
  file: contentFileStatusSchema,
  json: z.unknown().nullable()
});

export const generatorSettingsSchema = z.object({
  schemaVersion: z.literal(1),
  githubUsername: z.string(),
  includePrivateRepositories: z.boolean(),
  repositoryRefreshPreference: z.enum(["manual", "daily", "weekly"]),
  portfolioRepositoryPath: z.string().min(1),
  dataDirectory: z.string().min(1),
  modelPath: z.string().min(1),
  modelName: z.string().min(1),
  modelBaseUrl: z.string().url(),
  generatorHost: z.string().min(1),
  generatorApiPort: z.number().int().positive(),
  generatorUiPort: z.number().int().positive(),
  logLevel: z.enum(["DEBUG", "INFO", "WARN", "ERROR"]),
  autoOpenBrowser: z.boolean(),
  themePreference: z.enum(["system", "light"])
});

export const generatorSettingsUpdateSchema = generatorSettingsSchema
  .omit({ schemaVersion: true })
  .partial()
  .strict();

export const configurationFieldSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
  source: z.enum(["ENVIRONMENT", "LOCAL SETTINGS", "DEFAULT"]),
  secret: z.boolean().default(false),
  restartRequired: z.boolean().default(false)
});

export const safeConfigurationSummarySchema = z.object({
  fields: z.array(configurationFieldSchema)
});

export const contentMetricsSchema = z.object({
  visibleProjects: z.number().int().nonnegative(),
  hiddenProjects: z.number().int().nonnegative(),
  featuredProjects: z.number().int().nonnegative(),
  experienceEntries: z.number().int().nonnegative(),
  skillCategories: z.number().int().nonnegative(),
  activityEntries: z.number().int().nonnegative(),
  latestContentModifiedAt: z.string().datetime().nullable(),
  validationStatus: z.enum(["valid", "invalid"])
});

export const logLevelSchema = z.enum(["DEBUG", "INFO", "WARN", "ERROR"]);
export const logCategorySchema = z.enum([
  "APPLICATION",
  "API",
  "FILESYSTEM",
  "CONTENT",
  "SETTINGS",
  "SYSTEM",
  "SECURITY",
  "FUTURE_GITHUB",
  "FUTURE_AI",
  "FUTURE_PUBLISH"
]);

export const logEntrySchema = z.object({
  id: z.string().min(1),
  timestamp: z.string().datetime(),
  level: logLevelSchema,
  category: logCategorySchema,
  message: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
  requestId: z.string().min(1).optional()
});

export const logQuerySchema = z.object({
  level: logLevelSchema.optional(),
  category: logCategorySchema.optional(),
  search: z.string().max(120).optional(),
  limit: z.coerce.number().int().positive().max(200).default(50),
  before: z.string().datetime().optional(),
  order: z.enum(["newest", "oldest"]).default("newest")
});

export const logsResponseSchema = z.object({
  entries: z.array(logEntrySchema),
  total: z.number().int().nonnegative(),
  returned: z.number().int().nonnegative()
});

export const systemInformationSchema = z.object({
  applicationVersion: z.string().min(1),
  nodeVersion: z.string().min(1),
  platform: z.string().min(1),
  architecture: z.string().min(1),
  processUptimeSeconds: z.number().nonnegative(),
  serverStartedAt: z.string().datetime(),
  memoryUsage: z.object({
    rss: z.number().int().nonnegative(),
    heapUsed: z.number().int().nonnegative(),
    heapTotal: z.number().int().nonnegative()
  }),
  apiHost: z.string().min(1),
  apiPort: z.number().int().positive(),
  repositoryRoot: z.string().min(1),
  dataDirectory: z.string().min(1),
  logDirectory: z.string().min(1),
  portfolioPath: z.string().min(1),
  git: z.object({
    available: z.boolean(),
    version: z.string().nullable()
  }),
  docker: z.object({
    available: z.boolean(),
    version: z.string().nullable()
  }),
  modelPath: z.object({
    configuredPath: z.string().min(1),
    exists: z.boolean(),
    extensionValid: z.boolean(),
    sizeBytes: z.number().int().nonnegative().nullable(),
    note: z.string().min(1)
  }),
  filesystem: z.object({
    dataDirectoryReadable: z.boolean(),
    dataDirectoryWritable: z.boolean()
  })
});

export const dashboardOverviewSchema = z.object({
  application: z.object({
    name: z.literal("MUNEEB.SYSTEMS GENERATOR"),
    version: z.string().min(1),
    phase: z.string().min(1),
    uptimeSeconds: z.number().nonnegative(),
    timestamp: z.string().datetime()
  }),
  services: z.array(serviceStatusSchema),
  metrics: contentMetricsSchema,
  configuration: safeConfigurationSummarySchema,
  recentLogs: z.array(logEntrySchema),
  futureWorkflow: z.array(z.string().min(1))
});

export const apiHealthResponseSchema = z.object({
  status: z.literal("healthy")
});

export const apiReadinessResponseSchema = z.object({
  status: z.literal("ready"),
  services: z.object({
    filesystem: z.boolean(),
    content: z.boolean(),
    settings: z.boolean(),
    github: z.boolean(),
    ai: z.boolean(),
    publishing: z.boolean()
  })
});

export const apiVersionResponseSchema = z.object({
  name: z.string().min(1),
  version: z.string().min(1),
  phase: z.string().min(1),
  environment: z.string().min(1),
  gitCommit: z.string().nullable(),
  buildTime: z.string().nullable()
});

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: z.string().min(1),
    message: z.string().min(1),
    requestId: z.string().min(1),
    details: z.array(z.unknown()).default([]),
    timestamp: z.string().datetime()
  })
});
