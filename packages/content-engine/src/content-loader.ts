import path from "node:path";
import type { z } from "zod";
import {
  activityItemSchema,
  contentBundleSchema,
  experienceEntrySchema,
  generatorStateSchema,
  profileSchema,
  projectSchema,
  skillCategorySchema
} from "@muneeb-systems/shared-schemas";
import type { ContentBundle } from "@muneeb-systems/shared-types";
import { ContentValidationError } from "./content-error.js";
import { readJsonFile } from "./json-reader.js";

export interface ContentEngineOptions {
  dataDirectory: string;
}

const contentFiles = {
  profile: "profile.json",
  experience: "experience.json",
  skills: "skills.json",
  projects: "projects.json",
  activity: "activity.json",
  generatorState: "generator-state.json"
} as const;

export class ContentEngine {
  public constructor(private readonly options: ContentEngineOptions) {}

  public async loadBundle(): Promise<ContentBundle> {
    const bundle = {
      profile: await this.loadFile(contentFiles.profile, profileSchema),
      experience: await this.loadFile(contentFiles.experience, experienceEntrySchema.array()),
      skills: await this.loadFile(contentFiles.skills, skillCategorySchema.array()),
      projects: await this.loadFile(contentFiles.projects, projectSchema.array()),
      activity: await this.loadFile(contentFiles.activity, activityItemSchema.array()),
      generatorState: await this.loadFile(contentFiles.generatorState, generatorStateSchema)
    };

    return contentBundleSchema.parse(bundle);
  }

  private async loadFile<TSchema extends z.ZodType>(
    fileName: string,
    schema: TSchema
  ): Promise<z.infer<TSchema>> {
    const filePath = path.join(this.options.dataDirectory, fileName);
    const content = await readJsonFile(filePath);
    const result = schema.safeParse(content);

    if (!result.success) {
      throw new ContentValidationError(filePath, result.error.issues);
    }

    return result.data;
  }
}
