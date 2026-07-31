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
