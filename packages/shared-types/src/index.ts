import type { z } from "zod";
import type {
  activityItemSchema,
  apiErrorResponseSchema,
  apiHealthResponseSchema,
  apiReadinessResponseSchema,
  apiVersionResponseSchema,
  contentBundleSchema,
  experienceEntrySchema,
  generatorStateSchema,
  profileSchema,
  projectSchema,
  skillCategorySchema
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
