import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { DraftSummary, GeneratedProjectDraft } from "@muneeb-systems/shared-types";
import { generatedProjectDraftSchema } from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class JsonDraftRepository {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public async save(draft: GeneratedProjectDraft, rawResponse: string): Promise<void> {
    await mkdir(this.config.aiDraftDirectory, { recursive: true });
    await writeFile(
      path.join(this.config.aiDraftDirectory, `${draft.id}.json`),
      `${JSON.stringify(draft, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      path.join(this.config.aiDraftDirectory, `${draft.id}.raw.txt`),
      rawResponse,
      "utf8"
    );
  }

  public async get(id: string): Promise<GeneratedProjectDraft | null> {
    try {
      return generatedProjectDraftSchema.parse(
        JSON.parse(
          await readFile(path.join(this.config.aiDraftDirectory, `${id}.json`), "utf8")
        ) as unknown
      );
    } catch {
      return null;
    }
  }

  public async delete(id: string): Promise<void> {
    await Promise.all([
      rm(path.join(this.config.aiDraftDirectory, `${id}.json`), { force: true }),
      rm(path.join(this.config.aiDraftDirectory, `${id}.raw.txt`), { force: true })
    ]);
  }

  public async list(): Promise<DraftSummary[]> {
    try {
      const files = (await readdir(this.config.aiDraftDirectory)).filter((file) =>
        file.endsWith(".json")
      );
      const drafts = await Promise.all(files.map((file) => this.get(file.replace(/\.json$/, ""))));
      return drafts
        .filter((draft): draft is GeneratedProjectDraft => Boolean(draft))
        .map((draft) => ({
          id: draft.id,
          repositoryId: draft.repositoryId,
          repositoryFullName: draft.repositoryFullName,
          title: draft.title,
          createdAt: draft.createdAt,
          validationWarnings: draft.validationWarnings
        }))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch {
      return [];
    }
  }
}
