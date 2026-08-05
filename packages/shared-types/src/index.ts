import type { z } from "zod";
import type {
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
  aiHealthResultSchema,
  aiModelInfoSchema,
  aiRuntimeModeSchema,
  aiRuntimeStateSchema,
  aiRuntimeStatusSchema,
  aiTestGenerationRequestSchema,
  aiTestGenerationResultSchema,
  aiWarmUpResultSchema,
  draftSummarySchema,
  draftValidationResultSchema,
  draftsResponseSchema,
  enqueueRepositoriesRequestSchema,
  enqueueRepositoriesResponseSchema,
  generatedProjectDraftSchema,
  generationUsageSchema,
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
  processingCheckpointSchema,
  processingJobSchema,
  processingJobStateSchema,
  processingQueueSchema,
  projectSchema,
  queueEventSchema,
  queueMetricsSchema,
  queueStateSchema,
  approveReviewRequestSchema,
  contentDiffSchema,
  draftReviewSchema,
  openReviewRequestSchema,
  previewSessionSchema,
  publishingBundleSchema,
  commitRequestSchema,
  commitResultSchema,
  createPublishingRunRequestSchema,
  gitDiffFileSchema,
  gitDiffSummarySchema,
  gitPushReadinessSchema,
  gitRepositoryStatusSchema,
  gitWorkingTreeClassificationSchema,
  githubTokenStatusSchema,
  portfolioBuildCommandResultSchema,
  portfolioBuildResultSchema,
  publicContentBackupSchema,
  publicContentValidationResultSchema,
  publishingAuditEventSchema,
  publishingCheckSchema,
  publishingConfirmationActionSchema,
  publishingConfirmationTokenSchema,
  publishingExecutionStatusSchema,
  publishingPreflightResultSchema,
  publishingRunSchema,
  publishingRunsResponseSchema,
  publishingRunStageSchema,
  pushConfirmationSchema,
  pushResultSchema,
  rollbackRequestSchema,
  rollbackResultSchema,
  rejectionReasonSchema,
  rejectReviewRequestSchema,
  reviewApprovalSchema,
  reviewContentSchema,
  reviewMappingSchema,
  reviewRejectionSchema,
  reviewRevisionSchema,
  reviewStatusSchema,
  reviewSummarySchema,
  reviewValidationResultSchema,
  reviewWorkingCopySchema,
  reviewsResponseSchema,
  revisionComparisonSchema,
  saveReviewRevisionRequestSchema,
  stagedContentBundleSchema,
  stagedContentStatusSchema,
  updateReviewMappingRequestSchema,
  updateWorkingCopyRequestSchema,
  safeConfigurationSummarySchema,
  serviceStatusSchema,
  skillCategorySchema,
  systemInformationSchema
} from "@muneeb-systems/shared-schemas";

export type Profile = z.infer<typeof profileSchema>;
export type ExperienceEntry = z.infer<typeof experienceEntrySchema>;
export type SkillCategory = z.infer<typeof skillCategorySchema>;
export type Project = z.infer<typeof projectSchema>;
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
export type AiRuntimeMode = z.infer<typeof aiRuntimeModeSchema>;
export type AiRuntimeStatus = z.infer<typeof aiRuntimeStatusSchema>;
export type AiModelInfo = z.infer<typeof aiModelInfoSchema>;
export type AiHealthResult = z.infer<typeof aiHealthResultSchema>;
export type AiWarmUpResult = z.infer<typeof aiWarmUpResultSchema>;
export type GenerationUsage = z.infer<typeof generationUsageSchema>;
export type AiTestGenerationRequest = z.infer<typeof aiTestGenerationRequestSchema>;
export type AiTestGenerationResult = z.infer<typeof aiTestGenerationResultSchema>;
export type AiRuntimeState = z.infer<typeof aiRuntimeStateSchema>;
export type QueueState = z.infer<typeof queueStateSchema>;
export type ProcessingJobState = z.infer<typeof processingJobStateSchema>;
export type ProcessingCheckpoint = z.infer<typeof processingCheckpointSchema>;
export type GeneratedProjectDraft = z.infer<typeof generatedProjectDraftSchema>;
export type DraftValidationResult = z.infer<typeof draftValidationResultSchema>;
export type ProcessingJob = z.infer<typeof processingJobSchema>;
export type QueueMetrics = z.infer<typeof queueMetricsSchema>;
export type ProcessingQueue = z.infer<typeof processingQueueSchema>;
export type QueueEvent = z.infer<typeof queueEventSchema>;
export type EnqueueRepositoriesRequest = z.infer<typeof enqueueRepositoriesRequestSchema>;
export type EnqueueRepositoriesResponse = z.infer<typeof enqueueRepositoriesResponseSchema>;
export type DraftSummary = z.infer<typeof draftSummarySchema>;
export type DraftsResponse = z.infer<typeof draftsResponseSchema>;
export type ReviewStatus = z.infer<typeof reviewStatusSchema>;
export type ReviewMapping = z.infer<typeof reviewMappingSchema>;
export type ReviewContent = z.infer<typeof reviewContentSchema>;
export type ReviewValidationResult = z.infer<typeof reviewValidationResultSchema>;
export type ReviewWorkingCopy = z.infer<typeof reviewWorkingCopySchema>;
export type ReviewRevision = z.infer<typeof reviewRevisionSchema>;
export type ReviewApproval = z.infer<typeof reviewApprovalSchema>;
export type RejectionReason = z.infer<typeof rejectionReasonSchema>;
export type ReviewRejection = z.infer<typeof reviewRejectionSchema>;
export type DraftReview = z.infer<typeof draftReviewSchema>;
export type ReviewSummary = z.infer<typeof reviewSummarySchema>;
export type ReviewsResponse = z.infer<typeof reviewsResponseSchema>;
export type OpenReviewRequest = z.infer<typeof openReviewRequestSchema>;
export type UpdateWorkingCopyRequest = z.infer<typeof updateWorkingCopyRequestSchema>;
export type SaveReviewRevisionRequest = z.infer<typeof saveReviewRevisionRequestSchema>;
export type ApproveReviewRequest = z.infer<typeof approveReviewRequestSchema>;
export type RejectReviewRequest = z.infer<typeof rejectReviewRequestSchema>;
export type UpdateReviewMappingRequest = z.infer<typeof updateReviewMappingRequestSchema>;
export type ContentDiff = z.infer<typeof contentDiffSchema>;
export type RevisionComparison = z.infer<typeof revisionComparisonSchema>;
export type StagedContentStatus = z.infer<typeof stagedContentStatusSchema>;
export type StagedContentBundle = z.infer<typeof stagedContentBundleSchema>;
export type PreviewSession = z.infer<typeof previewSessionSchema>;
export type PublishingBundle = z.infer<typeof publishingBundleSchema>;
export type PublishingRunStage = z.infer<typeof publishingRunStageSchema>;
export type PublishingConfirmationAction = z.infer<typeof publishingConfirmationActionSchema>;
export type GitWorkingTreeClassification = z.infer<typeof gitWorkingTreeClassificationSchema>;
export type PublishingCheck = z.infer<typeof publishingCheckSchema>;
export type GitRepositoryStatus = z.infer<typeof gitRepositoryStatusSchema>;
export type GitPushReadiness = z.infer<typeof gitPushReadinessSchema>;
export type GitHubTokenStatus = z.infer<typeof githubTokenStatusSchema>;
export type PublicContentBackup = z.infer<typeof publicContentBackupSchema>;
export type PublishingConfirmationToken = z.infer<typeof publishingConfirmationTokenSchema>;
export type PublishingPreflightResult = z.infer<typeof publishingPreflightResultSchema>;
export type PublicContentValidationResult = z.infer<typeof publicContentValidationResultSchema>;
export type PortfolioBuildCommandResult = z.infer<typeof portfolioBuildCommandResultSchema>;
export type PortfolioBuildResult = z.infer<typeof portfolioBuildResultSchema>;
export type GitDiffFile = z.infer<typeof gitDiffFileSchema>;
export type GitDiffSummary = z.infer<typeof gitDiffSummarySchema>;
export type CommitRequest = z.infer<typeof commitRequestSchema>;
export type CommitResult = z.infer<typeof commitResultSchema>;
export type PushConfirmation = z.infer<typeof pushConfirmationSchema>;
export type PushResult = z.infer<typeof pushResultSchema>;
export type RollbackRequest = z.infer<typeof rollbackRequestSchema>;
export type RollbackResult = z.infer<typeof rollbackResultSchema>;
export type PublishingAuditEvent = z.infer<typeof publishingAuditEventSchema>;
export type PublishingRun = z.infer<typeof publishingRunSchema>;
export type PublishingRunsResponse = z.infer<typeof publishingRunsResponseSchema>;
export type CreatePublishingRunRequest = z.infer<typeof createPublishingRunRequestSchema>;
export type PublishingExecutionStatus = z.infer<typeof publishingExecutionStatusSchema>;
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
