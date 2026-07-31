import type { z } from "zod";
import type {
  activityItemSchema,
  apiErrorResponseSchema,
  apiHealthResponseSchema,
  apiReadinessResponseSchema,
  apiVersionResponseSchema,
  configurationFieldSchema,
  contentBundleSchema,
  contentDetailResponseSchema,
  contentFileStatusSchema,
  contentFileTypeSchema,
  contentMetricsSchema,
  contentStatusResponseSchema,
  contentValidationIssueSchema,
  dashboardOverviewSchema,
  experienceEntrySchema,
  generatorSettingsSchema,
  generatorSettingsUpdateSchema,
  generatorStateSchema,
  logCategorySchema,
  logEntrySchema,
  logLevelSchema,
  logQuerySchema,
  logsResponseSchema,
  discoveredRepositorySchema,
  githubAuthenticationModeSchema,
  githubAuthenticationStateSchema,
  githubBulkSelectionRequestSchema,
  githubBulkSelectionResponseSchema,
  githubNotesUpdateSchema,
  githubRateLimitStatusSchema,
  githubRepositoriesResponseSchema,
  githubRepositoryQuerySchema,
  githubSelectionUpdateSchema,
  githubSnapshotCompletenessSchema,
  githubStatusResponseSchema,
  githubSyncModeSchema,
  githubSyncPhaseSchema,
  githubSyncProgressSchema,
  githubSyncRequestSchema,
  githubSyncResponseSchema,
  repositoryChangeSetSchema,
  repositoryChangeStateSchema,
  repositoryLanguageSchema,
  repositoryMappingSchema,
  repositoryMappingStatusSchema,
  repositoryReadmeSchema,
  repositoryReadmeStatusSchema,
  repositorySelectionSchema,
  repositoryVisibilitySchema,
  profileSchema,
  projectSchema,
  safeConfigurationSummarySchema,
  serviceStatusSchema,
  skillCategorySchema,
  systemInformationSchema
} from "@muneeb-systems/shared-schemas";

export type Profile = z.infer<typeof profileSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type Project = z.infer<typeof projectSchema>;
export type ActivityItem = z.infer<typeof activityItemSchema>;
export type GeneratorState = z.infer<typeof generatorStateSchema>;
export type ContentBundle = z.infer<typeof contentBundleSchema>;

export type ApiHealthResponse = z.infer<typeof apiHealthResponseSchema>;
export type ApiReadinessResponse = z.infer<typeof apiReadinessResponseSchema>;
export type ApiVersionResponse = z.infer<typeof apiVersionResponseSchema>;
export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
export type ServiceStatus = z.infer<typeof serviceStatusSchema>;
export type ContentValidationIssue = z.infer<typeof contentValidationIssueSchema>;
export type ContentFileType = z.infer<typeof contentFileTypeSchema>;
export type ContentFileStatus = z.infer<typeof contentFileStatusSchema>;
export type ContentStatusResponse = z.infer<typeof contentStatusResponseSchema>;
export type ContentDetailResponse = z.infer<typeof contentDetailResponseSchema>;
export type GeneratorSettings = z.infer<typeof generatorSettingsSchema>;
export type GeneratorSettingsUpdate = z.infer<typeof generatorSettingsUpdateSchema>;
export type ConfigurationField = z.infer<typeof configurationFieldSchema>;
export type SafeConfigurationSummary = z.infer<typeof safeConfigurationSummarySchema>;
export type ContentMetrics = z.infer<typeof contentMetricsSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
export type LogCategory = z.infer<typeof logCategorySchema>;
export type LogEntry = z.infer<typeof logEntrySchema>;
export type LogQuery = z.infer<typeof logQuerySchema>;
export type LogsResponse = z.infer<typeof logsResponseSchema>;
export type SystemInformation = z.infer<typeof systemInformationSchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type GitHubAuthenticationState = z.infer<typeof githubAuthenticationStateSchema>;
export type GitHubAuthenticationMode = z.infer<typeof githubAuthenticationModeSchema>;
export type RepositoryVisibility = z.infer<typeof repositoryVisibilitySchema>;
export type RepositoryReadmeStatus = z.infer<typeof repositoryReadmeStatusSchema>;
export type RepositoryChangeState = z.infer<typeof repositoryChangeStateSchema>;
export type GitHubSyncMode = z.infer<typeof githubSyncModeSchema>;
export type GitHubSyncPhase = z.infer<typeof githubSyncPhaseSchema>;
export type GitHubSnapshotCompleteness = z.infer<typeof githubSnapshotCompletenessSchema>;
export type RepositoryMappingStatus = z.infer<typeof repositoryMappingStatusSchema>;
export type RepositoryLanguage = z.infer<typeof repositoryLanguageSchema>;
export type RepositoryReadme = z.infer<typeof repositoryReadmeSchema>;
export type RepositoryChangeSet = z.infer<typeof repositoryChangeSetSchema>;
export type RepositorySelection = z.infer<typeof repositorySelectionSchema>;
export type RepositoryMapping = z.infer<typeof repositoryMappingSchema>;
export type DiscoveredRepository = z.infer<typeof discoveredRepositorySchema>;
export type GitHubRateLimitStatus = z.infer<typeof githubRateLimitStatusSchema>;
export type GitHubSyncProgress = z.infer<typeof githubSyncProgressSchema>;
export type GitHubStatusResponse = z.infer<typeof githubStatusResponseSchema>;
export type GitHubRepositoryQuery = z.infer<typeof githubRepositoryQuerySchema>;
export type GitHubRepositoriesResponse = z.infer<typeof githubRepositoriesResponseSchema>;
export type GitHubSyncRequest = z.infer<typeof githubSyncRequestSchema>;
export type GitHubSyncResponse = z.infer<typeof githubSyncResponseSchema>;
export type GitHubSelectionUpdate = z.infer<typeof githubSelectionUpdateSchema>;
export type GitHubBulkSelectionRequest = z.infer<typeof githubBulkSelectionRequestSchema>;
export type GitHubBulkSelectionResponse = z.infer<typeof githubBulkSelectionResponseSchema>;
export type GitHubNotesUpdate = z.infer<typeof githubNotesUpdateSchema>;
