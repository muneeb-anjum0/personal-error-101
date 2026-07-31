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
  "GITHUB",
  "AI_RUNTIME",
  "AI_PROCESS",
  "AI_HEALTH",
  "AI_GENERATION",
  "AI_VALIDATION",
  "AI_REPAIR",
  "QUEUE",
  "QUEUE_RECOVERY",
  "DRAFT",
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

export const githubAuthenticationStateSchema = z.enum([
  "UNCONFIGURED",
  "ANONYMOUS",
  "AUTHENTICATED",
  "AUTHENTICATION_FAILED",
  "INSUFFICIENT_PERMISSIONS",
  "RATE_LIMITED",
  "NETWORK_ERROR"
]);

export const githubAuthenticationModeSchema = z.enum(["ANONYMOUS", "TOKEN"]);
export const repositoryVisibilitySchema = z.enum(["PUBLIC", "PRIVATE", "INTERNAL"]);
export const repositoryReadmeStatusSchema = z.enum([
  "AVAILABLE",
  "MISSING",
  "EMPTY",
  "TOO_LARGE",
  "UNSUPPORTED_ENCODING",
  "FETCH_FAILED"
]);
export const repositoryChangeStateSchema = z.enum([
  "NEW",
  "UNCHANGED",
  "SOURCE_CHANGED",
  "README_CHANGED",
  "METADATA_CHANGED",
  "VISIBILITY_CHANGED",
  "ARCHIVED",
  "UNARCHIVED",
  "DELETED_OR_INACCESSIBLE",
  "SYNC_FAILED"
]);
export const githubSyncModeSchema = z.enum(["INCREMENTAL", "FULL"]);
export const githubSyncPhaseSchema = z.enum([
  "IDLE",
  "AUTHENTICATING",
  "FETCHING_REPOSITORY_LIST",
  "COMPARING_SNAPSHOTS",
  "FETCHING_DETAILS",
  "FETCHING_READMES",
  "FETCHING_LANGUAGES",
  "PERSISTING_RESULTS",
  "FINALIZING",
  "COMPLETED",
  "FAILED",
  "CANCELLED"
]);
export const githubSnapshotCompletenessSchema = z.enum([
  "COMPLETE",
  "PARTIAL",
  "FAILED",
  "CANCELLED"
]);
export const repositoryMappingStatusSchema = z.enum([
  "MATCHED",
  "POSSIBLE_MATCH",
  "UNMATCHED",
  "CONFLICT"
]);

export const repositoryLanguageSchema = z.object({
  name: z.string().min(1),
  bytes: z.number().int().nonnegative(),
  percentage: z.number().nonnegative()
});

export const repositoryReadmeSchema = z.object({
  status: repositoryReadmeStatusSchema,
  path: z.string().nullable(),
  sha: z.string().nullable(),
  hash: z.string().nullable(),
  sizeBytes: z.number().int().nonnegative(),
  content: z.string().nullable(),
  truncated: z.boolean(),
  fetchedAt: z.string().datetime().nullable(),
  warning: z.string().nullable()
});

export const repositoryChangeSetSchema = z.object({
  state: repositoryChangeStateSchema,
  flags: z.object({
    isNew: z.boolean(),
    sourceChanged: z.boolean(),
    readmeChanged: z.boolean(),
    metadataChanged: z.boolean(),
    visibilityChanged: z.boolean(),
    archiveStateChanged: z.boolean(),
    becameUnavailable: z.boolean()
  }),
  messages: z.array(z.string())
});

export const repositorySelectionSchema = z.object({
  repositoryId: z.string().min(1),
  selectedForProcessing: z.boolean(),
  selectedForPortfolio: z.boolean(),
  featuredCandidate: z.boolean(),
  hidden: z.boolean(),
  manualOrder: z.number().int().nullable(),
  selectionUpdatedAt: z.string().datetime(),
  selectionSource: z.enum(["DEFAULT", "MANUAL", "BULK", "SYSTEM"]),
  notes: z.string().max(2000)
});

export const repositoryMappingSchema = z.object({
  status: repositoryMappingStatusSchema,
  projectSlug: z.string().nullable(),
  confidence: z.number().min(0).max(1),
  reason: z.string().min(1)
});

export const discoveredRepositorySchema = z.object({
  id: z.string().min(1),
  nodeId: z.string().nullable(),
  name: z.string().min(1),
  fullName: z.string().min(1),
  previousFullNames: z.array(z.string()),
  owner: z.string().min(1),
  description: z.string().nullable(),
  homepageUrl: z.string().nullable(),
  htmlUrl: z.string().url(),
  cloneUrl: z.string().url(),
  sshUrl: z.string().min(1),
  defaultBranch: z.string().nullable(),
  visibility: repositoryVisibilitySchema,
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  isArchived: z.boolean(),
  isDisabled: z.boolean(),
  isTemplate: z.boolean(),
  isMirror: z.boolean(),
  isEmpty: z.boolean(),
  isOwnedByConfiguredUser: z.boolean(),
  forkParent: z.string().nullable(),
  createdAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime().nullable(),
  pushedAt: z.string().datetime().nullable(),
  unavailableSince: z.string().datetime().nullable(),
  sizeKb: z.number().int().nonnegative(),
  stargazerCount: z.number().int().nonnegative(),
  watcherCount: z.number().int().nonnegative(),
  forkCount: z.number().int().nonnegative(),
  openIssueCount: z.number().int().nonnegative(),
  primaryLanguage: z.string().nullable(),
  languages: z.array(repositoryLanguageSchema),
  topics: z.array(z.string()),
  license: z.string().nullable(),
  readme: repositoryReadmeSchema,
  defaultBranchSha: z.string().nullable(),
  latestCommitSha: z.string().nullable(),
  repositorySnapshotHash: z.string().min(1),
  discoveredAt: z.string().datetime(),
  lastSynchronizedAt: z.string().datetime(),
  changeSet: repositoryChangeSetSchema,
  selection: repositorySelectionSchema,
  mapping: repositoryMappingSchema,
  warnings: z.array(z.string()),
  errors: z.array(z.string())
});

export const githubRateLimitStatusSchema = z.object({
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  used: z.number().int().nonnegative(),
  resetAt: z.string().datetime().nullable(),
  retryAfterSeconds: z.number().int().positive().nullable(),
  authenticationMode: githubAuthenticationModeSchema,
  lastUpdatedAt: z.string().datetime().nullable()
});

export const githubSyncProgressSchema = z.object({
  running: z.boolean(),
  mode: githubSyncModeSchema.nullable(),
  phase: githubSyncPhaseSchema,
  currentRepository: z.string().nullable(),
  repositoriesDiscovered: z.number().int().nonnegative(),
  readmesFetched: z.number().int().nonnegative(),
  languagesFetched: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  skippedUnchanged: z.number().int().nonnegative(),
  total: z.number().int().nonnegative().nullable(),
  elapsedMs: z.number().int().nonnegative(),
  cancellationRequested: z.boolean(),
  snapshotCompleteness: githubSnapshotCompletenessSchema.nullable(),
  startedAt: z.string().datetime().nullable(),
  finishedAt: z.string().datetime().nullable(),
  warnings: z.array(z.string()),
  errors: z.array(z.string())
});

export const githubStatusResponseSchema = z.object({
  configuredUsername: z.string(),
  authenticationState: githubAuthenticationStateSchema,
  authenticationMode: githubAuthenticationModeSchema,
  tokenStatus: z.enum(["TOKEN CONFIGURED", "TOKEN NOT CONFIGURED"]),
  includePrivateRepositories: z.boolean(),
  privateRepositoriesAvailable: z.boolean(),
  lastSuccessfulSyncAt: z.string().datetime().nullable(),
  lastAttemptedSyncAt: z.string().datetime().nullable(),
  lastSyncMode: githubSyncModeSchema.nullable(),
  snapshotCompleteness: githubSnapshotCompletenessSchema.nullable(),
  rateLimit: githubRateLimitStatusSchema,
  counts: z.object({
    total: z.number().int().nonnegative(),
    selectedForProcessing: z.number().int().nonnegative(),
    selectedForPortfolio: z.number().int().nonnegative(),
    newRepositories: z.number().int().nonnegative(),
    changedRepositories: z.number().int().nonnegative(),
    inaccessibleRepositories: z.number().int().nonnegative(),
    privateRepositories: z.number().int().nonnegative(),
    publicRepositories: z.number().int().nonnegative()
  }),
  warnings: z.array(z.string()),
  errors: z.array(z.string())
});

export const githubRepositoryQuerySchema = z.object({
  search: z.string().max(120).optional(),
  selection: z.enum(["all", "selected", "unselected"]).default("all"),
  changeState: repositoryChangeStateSchema.or(z.literal("ALL")).default("ALL"),
  visibility: repositoryVisibilitySchema.or(z.literal("ALL")).default("ALL"),
  repositoryType: z
    .enum(["ALL", "OWNED", "FORK", "ARCHIVED", "TEMPLATE", "MIRROR", "EMPTY", "INACCESSIBLE"])
    .default("ALL"),
  readmeStatus: repositoryReadmeStatusSchema.or(z.literal("ALL")).default("ALL"),
  language: z.string().max(60).optional(),
  archived: z.coerce.boolean().optional(),
  sort: z
    .enum(["pushed", "name", "synchronized", "stars", "change", "manualOrder"])
    .default("pushed"),
  direction: z.enum(["asc", "desc"]).default("desc"),
  limit: z.coerce.number().int().positive().max(100).default(50),
  offset: z.coerce.number().int().nonnegative().default(0)
});

export const githubRepositoriesResponseSchema = z.object({
  items: z.array(discoveredRepositorySchema),
  total: z.number().int().nonnegative(),
  pagination: z.object({
    limit: z.number().int().positive(),
    offset: z.number().int().nonnegative(),
    hasMore: z.boolean()
  }),
  sort: z.object({
    field: z.string().min(1),
    direction: z.enum(["asc", "desc"])
  }),
  summary: githubStatusResponseSchema.shape.counts
});

export const githubSyncRequestSchema = z.object({
  limit: z.number().int().positive().max(500).optional()
});

export const githubSyncResponseSchema = z.object({
  accepted: z.boolean(),
  status: githubSyncProgressSchema
});

export const githubSelectionUpdateSchema = repositorySelectionSchema
  .omit({ repositoryId: true, selectionUpdatedAt: true, selectionSource: true })
  .partial()
  .strict();

export const githubBulkSelectionRequestSchema = z.object({
  operation: z.enum([
    "SELECT_VISIBLE",
    "DESELECT_VISIBLE",
    "SELECT_OWNED_NON_ARCHIVED",
    "DESELECT_ALL",
    "SELECT_NEW",
    "SELECT_CHANGED",
    "CLEAR_INACCESSIBLE"
  ]),
  query: githubRepositoryQuerySchema.partial().optional()
});

export const githubBulkSelectionResponseSchema = z.object({
  affected: z.number().int().nonnegative(),
  selections: z.array(repositorySelectionSchema),
  message: z.string().min(1)
});

export const githubNotesUpdateSchema = z.object({
  notes: z.string().max(2000)
});

export const aiRuntimeModeSchema = z.enum(["EXTERNAL_SERVER", "MANAGED_PROCESS"]);
export const aiRuntimeStatusSchema = z.enum([
  "UNCONFIGURED",
  "MODEL_PATH_INVALID",
  "EXECUTABLE_NOT_CONFIGURED",
  "EXECUTABLE_INVALID",
  "STOPPED",
  "STARTING",
  "WAITING_FOR_ENDPOINT",
  "WARMING_UP",
  "READY",
  "BUSY",
  "STOPPING",
  "FAILED",
  "EXTERNAL_SERVER_READY",
  "EXTERNAL_SERVER_UNAVAILABLE",
  "PORT_IN_USE",
  "MODEL_MISMATCH"
]);

export const aiModelInfoSchema = z.object({
  id: z.string().min(1),
  ownedBy: z.string().nullable(),
  contextWindow: z.number().int().positive().nullable()
});

export const aiHealthResultSchema = z.object({
  endpointReachable: z.boolean(),
  modelsEndpointAvailable: z.boolean(),
  chatEndpointWorking: z.boolean(),
  configuredModelAvailable: z.boolean(),
  detectedModelNames: z.array(z.string()),
  latencyMs: z.number().int().nonnegative().nullable(),
  httpStatus: z.number().int().positive().nullable(),
  checkedAt: z.string().datetime(),
  errorCategory: z.string().nullable(),
  errorMessage: z.string().nullable()
});

export const aiWarmUpResultSchema = z.object({
  success: z.boolean(),
  startedAt: z.string().datetime(),
  completedAt: z.string().datetime(),
  durationMs: z.number().int().nonnegative(),
  model: z.string().min(1),
  error: z.string().nullable()
});

export const generationUsageSchema = z.object({
  promptTokens: z.number().int().nonnegative().nullable(),
  completionTokens: z.number().int().nonnegative().nullable(),
  totalTokens: z.number().int().nonnegative().nullable()
});

export const aiTestGenerationRequestSchema = z.object({
  prompt: z.string().min(1).max(1000).default("Return a minimal JSON object confirming readiness."),
  maxOutputTokens: z.number().int().positive().max(512).default(96)
});

export const aiTestGenerationResultSchema = z.object({
  rawText: z.string(),
  parsedJson: z.unknown().nullable(),
  latencyMs: z.number().int().nonnegative(),
  model: z.string().min(1),
  usage: generationUsageSchema,
  generatedAt: z.string().datetime()
});

export const aiRuntimeStateSchema = z.object({
  schemaVersion: z.literal(1),
  mode: aiRuntimeModeSchema,
  status: aiRuntimeStatusSchema,
  modelName: z.string().min(1),
  modelPath: z.string().min(1),
  modelPathExists: z.boolean(),
  executablePath: z.string().nullable(),
  executablePathExists: z.boolean(),
  processManagementAvailable: z.boolean(),
  baseUrl: z.string().url(),
  hostBaseUrl: z.string().url(),
  contextSize: z.number().int().positive(),
  parallelRequests: z.number().int().positive(),
  gpuLayers: z.number().int().nonnegative(),
  maxVramGb: z.number().positive(),
  processId: z.number().int().positive().nullable(),
  ownsProcess: z.boolean(),
  startedAt: z.string().datetime().nullable(),
  readyAt: z.string().datetime().nullable(),
  lastHealthCheckAt: z.string().datetime().nullable(),
  lastWarmUpAt: z.string().datetime().nullable(),
  lastError: z.string().nullable(),
  activeRepositoryJob: z.string().nullable(),
  health: aiHealthResultSchema.nullable(),
  warmUp: aiWarmUpResultSchema.nullable(),
  models: z.array(aiModelInfoSchema)
});

export const queueStateSchema = z.enum([
  "IDLE",
  "STARTING",
  "RUNNING",
  "PAUSING",
  "PAUSED",
  "STOPPING",
  "RECOVERING",
  "FAILED"
]);
export const processingJobStateSchema = z.enum([
  "PENDING",
  "PREPARING_CONTEXT",
  "WAITING_FOR_AI",
  "GENERATING",
  "VALIDATING",
  "REPAIRING",
  "PERSISTING",
  "COMPLETED",
  "FAILED",
  "CANCEL_REQUESTED",
  "CANCELLED",
  "INTERRUPTED",
  "SKIPPED"
]);
export const processingCheckpointSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  stage: z.enum([
    "CONTEXT_PREPARED",
    "PROMPT_PREPARED",
    "AI_RESPONSE_RECEIVED",
    "OUTPUT_PARSED",
    "OUTPUT_VALIDATED",
    "DRAFT_PERSISTED"
  ]),
  createdAt: z.string().datetime(),
  metadata: z.record(z.string(), z.unknown())
});

export const generatedProjectDraftSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  repositoryId: z.string().min(1),
  repositoryFullName: z.string().min(1),
  repositorySnapshotHash: z.string().min(1),
  sourceCommitSha: z.string().nullable(),
  readmeHash: z.string().nullable(),
  title: z.string().min(1).max(80),
  subtitle: z.string().max(140),
  summary: z.string().min(1).max(500),
  description: z.string().min(1).max(2500),
  problem: z.string().max(1000),
  solution: z.string().max(1000),
  features: z.array(z.string().max(180)).max(12),
  architecture: z.array(z.string().max(220)).max(12),
  challenges: z.array(z.string().max(220)).max(12),
  technologies: z.array(z.string().min(1).max(40)).max(24),
  categories: z.array(z.string().min(1).max(40)).max(8),
  tags: z.array(z.string().min(1).max(40)).max(16),
  impact: z.string().max(1000),
  limitations: z.array(z.string().max(180)).max(8),
  missingInformation: z.array(z.string().max(180)).max(8),
  confidenceNotes: z.array(z.string().max(220)).max(8),
  validationWarnings: z.array(z.string()),
  rawResponsePath: z.string().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export const draftValidationResultSchema = z.object({
  valid: z.boolean(),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
  repaired: z.boolean(),
  attempts: z.number().int().nonnegative()
});

export const processingJobSchema = z.object({
  id: z.string().min(1),
  repositoryId: z.string().min(1),
  repositoryFullName: z.string().min(1),
  repositorySnapshotHash: z.string().min(1),
  repositoryCommitSha: z.string().nullable(),
  readmeHash: z.string().nullable(),
  createdAt: z.string().datetime(),
  startedAt: z.string().datetime().nullable(),
  updatedAt: z.string().datetime(),
  completedAt: z.string().datetime().nullable(),
  attemptCount: z.number().int().nonnegative(),
  state: processingJobStateSchema,
  progressMessage: z.string(),
  error: z.string().nullable(),
  warnings: z.array(z.string()),
  draftId: z.string().nullable(),
  generationMetrics: z
    .object({
      durationMs: z.number().int().nonnegative().nullable(),
      usage: generationUsageSchema
    })
    .nullable(),
  checkpoints: z.array(processingCheckpointSchema)
});

export const queueMetricsSchema = z.object({
  selectedRepositories: z.number().int().nonnegative(),
  eligibleRepositories: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
  active: z.number().int().nonnegative(),
  completed: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  cancelled: z.number().int().nonnegative(),
  interrupted: z.number().int().nonnegative(),
  completedDrafts: z.number().int().nonnegative(),
  averageGenerationDurationMs: z.number().nonnegative().nullable()
});

export const processingQueueSchema = z.object({
  schemaVersion: z.literal(1),
  id: z.string().min(1),
  state: queueStateSchema,
  paused: z.boolean(),
  workerLock: z
    .object({
      ownerId: z.string().min(1),
      acquiredAt: z.string().datetime(),
      heartbeatAt: z.string().datetime()
    })
    .nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  recoveredAt: z.string().datetime().nullable(),
  jobs: z.array(processingJobSchema),
  metrics: queueMetricsSchema
});

export const queueEventSchema = z.object({
  id: z.string().min(1),
  sequence: z.number().int().positive(),
  timestamp: z.string().datetime(),
  queueId: z.string().min(1),
  jobId: z.string().nullable(),
  eventType: z.string().min(1),
  previousState: z.string().nullable(),
  newState: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown())
});

export const enqueueRepositoriesRequestSchema = z.object({
  repositoryIds: z.array(z.string().min(1)).optional(),
  mode: z.enum(["SELECTED", "NEW_SELECTED", "CHANGED_SELECTED"]).default("SELECTED"),
  regenerateCompleted: z.boolean().default(false)
});

export const enqueueRepositoriesResponseSchema = z.object({
  enqueued: z.number().int().nonnegative(),
  skipped: z.number().int().nonnegative(),
  jobs: z.array(processingJobSchema),
  reasons: z.array(z.string())
});

export const draftSummarySchema = z.object({
  id: z.string().min(1),
  repositoryId: z.string().min(1),
  repositoryFullName: z.string().min(1),
  title: z.string().min(1),
  createdAt: z.string().datetime(),
  validationWarnings: z.array(z.string())
});

export const draftsResponseSchema = z.object({
  items: z.array(draftSummarySchema),
  total: z.number().int().nonnegative()
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
