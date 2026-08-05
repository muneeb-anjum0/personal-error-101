import { access, readFile, stat, writeFile, rm } from "node:fs/promises";
import path from "node:path";
import { constants } from "node:fs";
import type {
  ContentDetailResponse,
  ContentFileStatus,
  ContentFileType,
  ContentMetrics,
  ContentStatusResponse,
  ContentValidationIssue
} from "@muneeb-systems/shared-types";
import {
  contentFileTypeSchema,
  experienceEntrySchema,
  generatorStateSchema,
  profileSchema,
  projectSchema,
  skillCategorySchema
} from "@muneeb-systems/shared-schemas";
import type { z } from "zod";
import { GeneratorError } from "../../domain/errors/generator-error.js";

type FileDefinition = {
  type: ContentFileType;
  label: string;
  fileName: string;
  schema: z.ZodType;
  recordCount: (value: unknown) => number;
};

const definitions: FileDefinition[] = [
  {
    type: "profile",
    label: "Profile",
    fileName: "profile.json",
    schema: profileSchema,
    recordCount: () => 1
  },
  {
    type: "projects",
    label: "Projects",
    fileName: "projects.json",
    schema: projectSchema.array(),
    recordCount: (value) => (Array.isArray(value) ? value.length : 0)
  },
  {
    type: "experience",
    label: "Experience",
    fileName: "experience.json",
    schema: experienceEntrySchema.array(),
    recordCount: (value) => (Array.isArray(value) ? value.length : 0)
  },
  {
    type: "skills",
    label: "Skills",
    fileName: "skills.json",
    schema: skillCategorySchema.array(),
    recordCount: (value) => (Array.isArray(value) ? value.length : 0)
  },
  {
    type: "generator-state",
    label: "Generator state",
    fileName: "generator-state.json",
    schema: generatorStateSchema,
    recordCount: () => 1
  }
];

export class StaticContentInspector {
  public constructor(private readonly dataDirectory: string) {}

  public async inspectAll(): Promise<ContentStatusResponse> {
    const files = await Promise.all(definitions.map((definition) => this.inspect(definition)));
    return {
      status: files.every((file) => file.status === "valid") ? "valid" : "invalid",
      files,
      inspectedAt: new Date().toISOString()
    };
  }

  public async inspectDetail(type: string): Promise<ContentDetailResponse> {
    const parsedType = contentFileTypeSchema.safeParse(type);
    if (!parsedType.success) {
      throw new GeneratorError(
        "UNSUPPORTED_CONTENT_TYPE",
        `Unsupported content type: ${type}`,
        400
      );
    }

    const definition = definitions.find((item) => item.type === parsedType.data);
    if (!definition) {
      throw new GeneratorError(
        "UNSUPPORTED_CONTENT_TYPE",
        `Unsupported content type: ${type}`,
        400
      );
    }

    const file = await this.inspect(definition);
    const json =
      file.status === "valid" || file.status === "invalid" ? await this.readJson(definition) : null;
    return { file, json };
  }

  public async metrics(): Promise<ContentMetrics> {
    const status = await this.inspectAll();
    const projects = (await this.safeRead("projects")) as Array<{
      hidden?: boolean;
      featured?: boolean;
    }>;
    const experience = (await this.safeRead("experience")) as unknown[];
    const skills = (await this.safeRead("skills")) as unknown[];

    return {
      visibleProjects: projects.filter((project) => !project.hidden).length,
      hiddenProjects: projects.filter((project) => project.hidden).length,
      featuredProjects: projects.filter((project) => project.featured).length,
      experienceEntries: experience.length,
      skillCategories: skills.length,
      latestContentModifiedAt: latestModifiedAt(status.files),
      validationStatus: status.status
    };
  }

  public async checkReadWrite(): Promise<{ readable: boolean; writable: boolean }> {
    let readable = false;
    let writable = false;
    try {
      await access(this.dataDirectory, constants.R_OK);
      readable = true;
    } catch {
      readable = false;
    }

    const tempPath = path.join(this.dataDirectory, `.generator-write-check-${process.pid}`);
    try {
      await writeFile(tempPath, "ok", "utf8");
      await rm(tempPath, { force: true });
      writable = true;
    } catch {
      writable = false;
      await rm(tempPath, { force: true });
    }

    return { readable, writable };
  }

  private async inspect(definition: FileDefinition): Promise<ContentFileStatus> {
    const filePath = path.join(this.dataDirectory, definition.fileName);
    const relativePath = path.join("data", definition.fileName).replace(/\\/g, "/");
    try {
      const fileStat = await stat(filePath);
      const raw = await readFile(filePath, "utf8");
      const parsed = JSON.parse(raw) as unknown;
      const result = definition.schema.safeParse(parsed);
      const issues = result.success
        ? incompleteWarnings(definition, parsed)
        : zodIssues(definition, result.error);

      return {
        type: definition.type,
        label: definition.label,
        fileName: definition.fileName,
        relativePath,
        status: result.success ? "valid" : "invalid",
        recordCount: definition.recordCount(parsed),
        sizeBytes: fileStat.size,
        modifiedAt: fileStat.mtime.toISOString(),
        schemaVersion: schemaVersion(parsed),
        issues
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return emptyStatus(definition, relativePath, "missing", "CONTENT_FILE_NOT_FOUND");
      }
      if (error instanceof SyntaxError) {
        return emptyStatus(definition, relativePath, "malformed", "CONTENT_FILE_MALFORMED");
      }
      return emptyStatus(definition, relativePath, "invalid", "FILESYSTEM_UNAVAILABLE");
    }
  }

  private async readJson(definition: FileDefinition): Promise<unknown> {
    return JSON.parse(
      await readFile(path.join(this.dataDirectory, definition.fileName), "utf8")
    ) as unknown;
  }

  private async safeRead(type: ContentFileType): Promise<unknown> {
    try {
      return (await this.inspectDetail(type)).json ?? [];
    } catch {
      return [];
    }
  }
}

function emptyStatus(
  definition: FileDefinition,
  relativePath: string,
  status: ContentFileStatus["status"],
  code: string
): ContentFileStatus {
  return {
    type: definition.type,
    label: definition.label,
    fileName: definition.fileName,
    relativePath,
    status,
    recordCount: 0,
    sizeBytes: 0,
    modifiedAt: null,
    schemaVersion: null,
    issues: [
      {
        file: definition.fileName,
        path: "$",
        message: `${definition.label} could not be inspected.`,
        code,
        severity: "error",
        remediation: "Confirm the file exists and contains valid JSON."
      }
    ]
  };
}

function zodIssues(definition: FileDefinition, error: z.ZodError): ContentValidationIssue[] {
  return error.issues.map((issue) => ({
    file: definition.fileName,
    path: issue.path.length > 0 ? `$.${issue.path.join(".")}` : "$",
    message: issue.message,
    code: issue.code,
    severity: "error",
    remediation: "Update the static JSON to match the shared schema."
  }));
}

function incompleteWarnings(definition: FileDefinition, value: unknown): ContentValidationIssue[] {
  if (Array.isArray(value) && value.length === 0) {
    return [
      {
        file: definition.fileName,
        path: "$",
        message: `${definition.label} is valid but empty.`,
        code: "CONTENT_EMPTY",
        severity: "warning",
        remediation: "Add records when this section is ready."
      }
    ];
  }
  return [];
}

function schemaVersion(value: unknown): number | null {
  if (value && typeof value === "object" && "schemaVersion" in value) {
    const version = (value as { schemaVersion?: unknown }).schemaVersion;
    return typeof version === "number" ? version : null;
  }
  return null;
}

function latestModifiedAt(files: ContentFileStatus[]): string | null {
  const timestamps = files
    .map((file) => file.modifiedAt)
    .filter((value): value is string => Boolean(value))
    .sort();
  return timestamps.at(-1) ?? null;
}
