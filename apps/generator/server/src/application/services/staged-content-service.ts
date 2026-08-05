import { createHash, randomUUID } from "node:crypto";
import type {
  ExperienceEntry,
  GeneratedProjectDraft,
  Profile,
  Project,
  SkillCategory,
  StagedContentStatus
} from "@muneeb-systems/shared-types";
import {
  experienceEntrySchema,
  profileSchema,
  projectSchema,
  skillCategorySchema
} from "@muneeb-systems/shared-schemas";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";
import type {
  StagedContentRepository,
  StagedContentType
} from "../../infrastructure/staged/staged-content-repository.js";

export class StagedContentService {
  public constructor(
    private readonly repository: StagedContentRepository,
    private readonly logger: ApplicationLogger
  ) {}

  public async status(): Promise<StagedContentStatus> {
    const [profile, projects, experience, skills] = await Promise.all([
      this.repository.read("profile"),
      this.repository.read("projects"),
      this.repository.read("experience"),
      this.repository.read("skills")
    ]);
    return {
      schemaVersion: 1,
      profile: Boolean(profile),
      projects: Array.isArray(projects) ? projects.length : 0,
      experience: Array.isArray(experience) ? experience.length : 0,
      skills: Array.isArray(skills) ? skills.length : 0,
      conflicts: [],
      updatedAt: new Date().toISOString()
    };
  }

  public async get(type: StagedContentType): Promise<unknown> {
    return this.repository.readEffective(type);
  }

  public async updateProfile(input: unknown): Promise<Profile> {
    const value = profileSchema.parse(input);
    await this.repository.writeAndPublish("profile", value);
    await this.logger.log("INFO", "STAGED_CONTENT", "Profile published", { hash: hash(value) });
    return value;
  }

  public async updateSkills(input: unknown): Promise<SkillCategory[]> {
    const value = skillCategorySchema.array().parse(input);
    await this.repository.writeAndPublish("skills", value);
    return value;
  }

  public async updateProjects(input: unknown): Promise<Project[]> {
    const value = projectSchema.array().parse(input);
    await this.repository.write("projects", value);
    return value;
  }

  public async addProject(input: unknown): Promise<Project> {
    const projects = projectSchema.array().parse(await this.repository.readEffective("projects"));
    const project = projectSchema.parse({ id: `project_${randomUUID()}`, ...objectInput(input) });
    await this.repository.write("projects", [...projects, project]);
    return project;
  }

  public async updateProject(projectId: string, input: unknown): Promise<Project> {
    const projects = projectSchema.array().parse(await this.repository.readEffective("projects"));
    const index = projects.findIndex((project) => project.id === projectId);
    const current = projects[index];
    const next = projectSchema.parse({ ...(current ?? { id: projectId }), ...objectInput(input) });
    if (index === -1) projects.push(next);
    else projects[index] = next;
    await this.repository.write("projects", projects);
    return next;
  }

  public async setProjectHidden(projectId: string, hidden: boolean): Promise<Project> {
    return this.updateProject(projectId, { hidden });
  }

  public async stageProjectDelete(projectId: string): Promise<Project> {
    return this.updateProject(projectId, { hidden: true, status: "archived" });
  }

  public async updateExperience(input: unknown): Promise<ExperienceEntry[]> {
    const value = experienceEntrySchema.array().parse(input);
    await this.repository.writeAndPublish("experience", value);
    return value;
  }

  public async upsertExperience(entryId: string, input: unknown): Promise<ExperienceEntry> {
    const entries = experienceEntrySchema
      .array()
      .parse(await this.repository.readEffective("experience"));
    const index = entries.findIndex((entry) => entry.id === entryId);
    const next = experienceEntrySchema.parse({
      ...(entries[index] ?? { id: entryId }),
      ...objectInput(input)
    });
    if (index === -1) entries.push(next);
    else entries[index] = next;
    await this.repository.write("experience", entries);
    return next;
  }

  public async effectiveBundle() {
    const [profile, projects, experience, skills] = await Promise.all([
      this.repository.readEffective("profile"),
      this.repository.readEffective("projects"),
      this.repository.readEffective("experience"),
      this.repository.readEffective("skills")
    ]);
    return {
      schemaVersion: 1 as const,
      profile,
      projects,
      experience,
      skills,
      metadata: {
        updatedAt: new Date().toISOString(),
        updatedBy: "Muneeb Anjum",
        source: "MANUAL_EDIT" as const
      }
    };
  }

  public async publishExistingEditableContent(): Promise<void> {
    const profile = profileSchema.parse(await this.repository.readEffective("profile"));
    const experience = experienceEntrySchema.array().parse(
      await this.repository.readEffective("experience")
    );
    const skills = skillCategorySchema.array().parse(await this.repository.readEffective("skills"));
    await Promise.all([
      this.repository.writePublic("profile", profile),
      this.repository.writePublic("experience", experience),
      this.repository.writePublic("skills", skills)
    ]);
  }

  public async synchronizeGeneratedProjects(drafts: GeneratedProjectDraft[]): Promise<Project[]> {
    const projects = drafts.map(generatedDraftToProject);
    await this.repository.writeAndPublish("projects", projects);
    return projects;
  }

  public async publishGeneratedProject(draft: GeneratedProjectDraft): Promise<Project> {
    const projects = projectSchema.array().parse(await this.repository.readEffective("projects"));
    const project = generatedDraftToProject(draft);
    const next = [
      ...projects.filter((item) => item.id !== project.id),
      project
    ];
    await this.repository.writeAndPublish("projects", next);
    return project;
  }

  public async removeGeneratedProject(repositoryId: string): Promise<void> {
    const projects = projectSchema.array().parse(await this.repository.readEffective("projects"));
    await this.repository.writeAndPublish(
      "projects",
      projects.filter((project) => project.id !== generatedProjectId(repositoryId))
    );
  }
}

function generatedDraftToProject(draft: GeneratedProjectDraft): Project {
  return projectSchema.parse({
    id: generatedProjectId(draft.repositoryId),
    slug: slugify(`${draft.title}-${draft.repositoryId}`),
    name: draft.title,
    subtitle: draft.subtitle || undefined,
    summary: draft.summary,
    status: "active",
    hidden: false,
    categories: draft.categories,
    technologies: draft.technologies,
    tags: draft.tags,
    links: [{ label: "GitHub", url: `https://github.com/${draft.repositoryFullName}` }],
    featured: true,
    createdAt: draft.createdAt,
    updatedAt: draft.updatedAt,
    pushedAt: draft.updatedAt,
    problem: draft.problem || undefined,
    solution: draft.solution || undefined,
    keyFeatures: draft.features,
    architecture: draft.architecture.join(" ") || undefined,
    challenges: draft.challenges,
    technicalHighlights: draft.confidenceNotes,
    impact: draft.impact || undefined,
    relatedSkillIds: [],
    starter: { editable: false, note: "Generated from the linked repository summary." }
  });
}

function generatedProjectId(repositoryId: string): string {
  return `generated_${repositoryId}`;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 120);
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function objectInput(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
