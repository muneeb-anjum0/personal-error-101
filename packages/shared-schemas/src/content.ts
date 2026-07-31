import { z } from "zod";

const editableStarterSchema = z.object({
  editable: z.boolean(),
  note: z.string().min(1)
});

export const linkSchema = z.object({
  label: z.string().min(1),
  url: z.string().url()
});

export const profileSchema = z.object({
  name: z.string().min(1),
  headline: z.string().min(1),
  shortBio: z.string().min(1),
  longBio: z.string().min(1),
  location: z.string().min(1),
  availability: z.string().min(1),
  email: z.string().email(),
  githubUrl: z.string().url(),
  linkedInUrl: z.string().url(),
  resumePath: z.string().min(1),
  starter: editableStarterSchema
});

export const experienceEntrySchema = z.object({
  id: z.string().min(1),
  role: z.string().min(1),
  organization: z.string().min(1),
  location: z.string().min(1),
  startDate: z.string().min(1),
  endDate: z.string().min(1).nullable(),
  summary: z.string().min(1),
  highlights: z.array(z.string().min(1)),
  starter: editableStarterSchema
});

export const skillCategorySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  skills: z.array(z.string().min(1)),
  starter: editableStarterSchema
});

export const projectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  summary: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]),
  tags: z.array(z.string().min(1)),
  links: z.array(linkSchema),
  featured: z.boolean(),
  starter: editableStarterSchema
});

export const activityItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  occurredAt: z.string().min(1),
  source: z.enum(["manual", "github", "ai", "system"]),
  starter: editableStarterSchema
});

export const generatorStateSchema = z.object({
  schemaVersion: z.literal(1),
  selectedRepositoryIds: z.array(z.string().min(1)),
  lastGitHubSyncAt: z.string().datetime().nullable(),
  lastContentGenerationAt: z.string().datetime().nullable(),
  contentPublishedAt: z.string().datetime().nullable(),
  services: z.object({
    githubConfigured: z.boolean(),
    aiConfigured: z.boolean(),
    contentStorageReady: z.boolean()
  })
});

export const contentBundleSchema = z.object({
  profile: profileSchema,
  experience: z.array(experienceEntrySchema),
  skills: z.array(skillCategorySchema),
  projects: z.array(projectSchema),
  activity: z.array(activityItemSchema),
  generatorState: generatorStateSchema
});
