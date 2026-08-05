import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { SafeFileWriter } from "../filesystem/safe-file-writer.js";

export type StagedContentType = "profile" | "projects" | "experience" | "skills";

export class StagedContentRepository {
  private readonly writer: SafeFileWriter;

  public constructor(private readonly config: GeneratorAppConfig) {
    this.writer = new SafeFileWriter(config.dataDirectory);
  }

  public stagedPath(type: StagedContentType): string {
    return path.join(this.config.stagedDirectory, `${type}.json`);
  }

  public baselinePath(type: StagedContentType): string {
    return path.join(this.config.dataDirectory, `${type}.json`);
  }

  public async read(type: StagedContentType): Promise<unknown> {
    try {
      return JSON.parse(await readFile(this.stagedPath(type), "utf8")) as unknown;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
      return null;
    }
  }

  public async readEffective(type: StagedContentType): Promise<unknown> {
    return (await this.read(type)) ?? JSON.parse(await readFile(this.baselinePath(type), "utf8"));
  }

  public async readBaseline(type: StagedContentType): Promise<unknown> {
    return JSON.parse(await readFile(this.baselinePath(type), "utf8")) as unknown;
  }

  public async write(type: StagedContentType, value: unknown): Promise<void> {
    await mkdir(this.config.stagedDirectory, { recursive: true });
    await this.writer.writeJsonWithBackup(
      this.stagedPath(type),
      value,
      this.config.stagedBackupDirectory,
      type,
      20
    );
    await this.writer.writeJsonWithBackup(
      this.config.stagedMetadataPath,
      {
        schemaVersion: 1,
        updatedAt: new Date().toISOString(),
        updatedBy: "Muneeb Anjum",
        lastContentType: type
      },
      this.config.stagedBackupDirectory,
      "metadata",
      20
    );
  }

  public async writePublic(type: StagedContentType, value: unknown): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.baselinePath(type),
      value,
      path.join(this.config.dataDirectory, "backups", "public-content"),
      type,
      20
    );
  }

  public async writeAndPublish(type: StagedContentType, value: unknown): Promise<void> {
    await this.write(type, value);
    await this.writePublic(type, value);
  }
}
