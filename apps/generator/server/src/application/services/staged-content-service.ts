import { createHash, randomUUID } from "node:crypto";
import type {
  ActivityItem,
  ExperienceEntry,
  Profile,
  Project,
  SkillCategory,
  StagedContentStatus
} from "@muneeb-systems/shared-types";
import {
  activityItemSchema,
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
    const [profile, projects, experience, skills, activity] = await Promise.all([
      this.repository.read("profile"),
      this.repository.read("projects"),
      this.repository.read("experience"),
      this.repository.read("skills"),
      this.repository.read("activity")
    ]);
    return {
      schemaVersion: 1,
      profile: Boolean(profile),
      projects: Array.isArray(projects) ? projects.length : 0,
      experience: Array.isArray(experience) ? experience.length : 0,
      skills: Array.isArray(skills) ? skills.length : 0,
      activity: Array.isArray(activity) ? activity.length : 0,
      conflicts: [],
      updatedAt: new Date().toISOString()
    };
  }

  public async get(type: StagedContentType): Promise<unknown> {
    return this.repository.readEffective(type);
  }

  public async updateProfile(input: unknown): Promise<Profile> {
    const value = profileSchema.parse(input);
    await this.repository.write("profile", value);
    await this.logger.log("INFO", "STAGED_CONTENT", "Profile staged", { hash: hash(value) });
    return value;
  }

  public async updateSkills(input: unknown): Promise<SkillCategory[]> {
    const value = skillCategorySchema.array().parse(input);
    await this.repository.write("skills", value);
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
    await this.repository.write("experience", value);
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

  public async updateActivity(input: unknown): Promise<ActivityItem[]> {
    const value = activityItemSchema.array().parse(input);
    await this.repository.write("activity", value);
    return value;
  }

  public async upsertActivity(entryId: string, input: unknown): Promise<ActivityItem> {
    const entries = activityItemSchema
      .array()
      .parse(await this.repository.readEffective("activity"));
    const index = entries.findIndex((entry) => entry.id === entryId);
    const next = activityItemSchema.parse({
      ...(entries[index] ?? { id: entryId }),
      ...objectInput(input)
    });
    if (index === -1) entries.push(next);
    else entries[index] = next;
    await this.repository.write("activity", entries);
    return next;
  }

  public async effectiveBundle() {
    const [profile, projects, experience, skills, activity] = await Promise.all([
      this.repository.readEffective("profile"),
      this.repository.readEffective("projects"),
      this.repository.readEffective("experience"),
      this.repository.readEffective("skills"),
      this.repository.readEffective("activity")
    ]);
    return { profile, projects, experience, skills, activity };
  }
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function objectInput(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
