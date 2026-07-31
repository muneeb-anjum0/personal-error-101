import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type { PreviewSession } from "@muneeb-systems/shared-types";
import { previewSessionSchema } from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class PreviewSessionRepository {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public async save(session: PreviewSession, data: unknown): Promise<void> {
    await mkdir(this.config.previewSessionsDirectory, { recursive: true });
    await writeFile(
      path.join(this.config.previewSessionsDirectory, `${session.id}.json`),
      `${JSON.stringify({ session, data }, null, 2)}\n`,
      "utf8"
    );
    await writeFile(
      this.config.previewCurrentPath,
      `${JSON.stringify(session, null, 2)}\n`,
      "utf8"
    );
  }

  public async list(): Promise<PreviewSession[]> {
    try {
      const files = (await readdir(this.config.previewSessionsDirectory)).filter((file) =>
        file.endsWith(".json")
      );
      const sessions = await Promise.all(
        files.map((file) => this.get(file.replace(/\.json$/, "")))
      );
      return sessions
        .filter((session): session is PreviewSession => Boolean(session))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch {
      return [];
    }
  }

  public async get(id: string): Promise<PreviewSession | null> {
    try {
      const wrapper = JSON.parse(
        await readFile(path.join(this.config.previewSessionsDirectory, `${id}.json`), "utf8")
      ) as { session?: unknown };
      return previewSessionSchema.parse(wrapper.session);
    } catch {
      return null;
    }
  }

  public async getData(id: string): Promise<unknown> {
    try {
      const wrapper = JSON.parse(
        await readFile(path.join(this.config.previewSessionsDirectory, `${id}.json`), "utf8")
      ) as { data?: unknown };
      return wrapper.data ?? null;
    } catch {
      return null;
    }
  }
}
