import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  PublicContentBackup,
  PublishingAuditEvent,
  PublishingConfirmationToken,
  PublishingRun
} from "@muneeb-systems/shared-types";
import {
  publicContentBackupSchema,
  publishingConfirmationTokenSchema,
  publishingRunSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class PublishingRunRepository {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public async listRuns(): Promise<PublishingRun[]> {
    try {
      const raw = JSON.parse(await readFile(this.config.publishingRunsPath, "utf8")) as unknown;
      return publishingRunSchema
        .array()
        .parse(raw)
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch {
      return [];
    }
  }

  public async saveRuns(runs: PublishingRun[]): Promise<void> {
    await mkdir(path.dirname(this.config.publishingRunsPath), { recursive: true });
    await writeFile(this.config.publishingRunsPath, `${JSON.stringify(runs, null, 2)}\n`, "utf8");
  }

  public async getRun(id: string): Promise<PublishingRun | null> {
    return (await this.listRuns()).find((run) => run.id === id) ?? null;
  }

  public async saveRun(run: PublishingRun): Promise<void> {
    const runs = await this.listRuns();
    const index = runs.findIndex((item) => item.id === run.id);
    if (index === -1) {
      runs.push(run);
    } else {
      runs[index] = run;
    }
    await this.saveRuns(runs);
  }

  public async saveConfirmation(token: PublishingConfirmationToken): Promise<void> {
    const tokens = await this.listConfirmations();
    await mkdir(path.dirname(this.config.publishingConfirmationPath), { recursive: true });
    await writeFile(
      this.config.publishingConfirmationPath,
      `${JSON.stringify([...tokens.filter((item) => item.token !== token.token), token], null, 2)}\n`,
      "utf8"
    );
  }

  public async listConfirmations(): Promise<PublishingConfirmationToken[]> {
    try {
      return publishingConfirmationTokenSchema
        .array()
        .parse(
          JSON.parse(await readFile(this.config.publishingConfirmationPath, "utf8")) as unknown
        );
    } catch {
      return [];
    }
  }

  public async getConfirmation(token: string): Promise<PublishingConfirmationToken | null> {
    return (await this.listConfirmations()).find((item) => item.token === token) ?? null;
  }

  public async saveBackupManifest(backup: PublicContentBackup): Promise<void> {
    await mkdir(backup.directory, { recursive: true });
    await writeFile(
      path.join(backup.directory, "manifest.json"),
      `${JSON.stringify(publicContentBackupSchema.parse(backup), null, 2)}\n`,
      "utf8"
    );
  }

  public async listBackups(): Promise<PublicContentBackup[]> {
    try {
      const directories = await readdir(this.config.publishingBackupDirectory, {
        withFileTypes: true
      });
      const manifests = await Promise.all(
        directories
          .filter((entry) => entry.isDirectory())
          .map(async (entry) => this.getBackup(entry.name))
      );
      return manifests
        .filter((backup): backup is PublicContentBackup => Boolean(backup))
        .sort((left, right) => right.createdAt.localeCompare(left.createdAt));
    } catch {
      return [];
    }
  }

  public async getBackup(id: string): Promise<PublicContentBackup | null> {
    try {
      return publicContentBackupSchema.parse(
        JSON.parse(
          await readFile(
            path.join(this.config.publishingBackupDirectory, id, "manifest.json"),
            "utf8"
          )
        ) as unknown
      );
    } catch {
      return null;
    }
  }

  public async appendAudit(event: PublishingAuditEvent): Promise<void> {
    await mkdir(path.dirname(this.config.publishingAuditPath), { recursive: true });
    await appendFile(this.config.publishingAuditPath, `${JSON.stringify(event)}\n`, "utf8");
  }
}
