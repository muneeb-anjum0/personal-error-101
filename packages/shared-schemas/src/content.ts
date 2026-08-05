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
  role: z.string().min(1).optional(),
  headline: z.string().min(1),
  shortBio: z.string().min(1),
  longBio: z.string().min(1),
  heroTitleLines: z.array(z.string().min(1)).default([]),
  identityHeading: z.string().min(1).optional(),
  projectsHeading: z.array(z.string().min(1)).default([]),
  projectsDescription: z.string().min(1).optional(),
  philosophyHeading: z.string().min(1).optional(),
  philosophyStatementLines: z.array(z.string().min(1)).default([]),
  philosophyPrinciples: z.array(z.string().min(1)).default([]),
  location: z.string().min(1),
  availability: z.string().min(1),
  email: z.string().email(),
  githubUrl: z.string().url(),
  linkedInUrl: z.string().url(),
  resumePath: z.string().min(1),
  stats: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1)
      })
    )
    .default([]),
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
  challenge: z.string().min(1).optional(),
  contributions: z.array(z.string().min(1)).default([]),
  results: z.array(z.string().min(1)).default([]),
  technologies: z.array(z.string().min(1)).default([]),
  relatedProjectIds: z.array(z.string().min(1)).default([]),
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
  slug: z.string().min(1).optional(),
  name: z.string().min(1),
  subtitle: z.string().min(1).optional(),
  summary: z.string().min(1),
  status: z.enum(["draft", "active", "archived"]),
  hidden: z.boolean().default(false),
  categories: z.array(z.string().min(1)).default([]),
  technologies: z.array(z.string().min(1)).default([]),
  tags: z.array(z.string().min(1)),
  links: z.array(linkSchema),
  featured: z.boolean(),
  createdAt: z.string().min(1).optional(),
  updatedAt: z.string().min(1).optional(),
  pushedAt: z.string().min(1).optional(),
  imagePath: z.string().min(1).optional(),
  problem: z.string().min(1).optional(),
  solution: z.string().min(1).optional(),
  keyFeatures: z.array(z.string().min(1)).default([]),
  architecture: z.string().min(1).optional(),
  challenges: z.array(z.string().min(1)).default([]),
  technicalHighlights: z.array(z.string().min(1)).default([]),
  impact: z.string().min(1).optional(),
  relatedSkillIds: z.array(z.string().min(1)).default([]),
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
  generatorState: generatorStateSchema
});
