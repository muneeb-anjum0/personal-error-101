import { readFile } from "node:fs/promises";
import type { GeneratorSettings } from "@muneeb-systems/shared-types";
import {
  generatorSettingsSchema,
  generatorSettingsUpdateSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { SafeFileWriter } from "./safe-file-writer.js";

export class JsonSettingsRepository {
  private readonly writer: SafeFileWriter;

  public constructor(private readonly config: GeneratorAppConfig) {
    this.writer = new SafeFileWriter(config.dataDirectory);
  }

  public defaults(): GeneratorSettings {
    return {
      schemaVersion: 1,
      githubUsername: this.config.githubUsername,
      includePrivateRepositories: this.config.includePrivateRepositories,
      repositoryRefreshPreference: "manual",
      portfolioRepositoryPath: this.config.repositoryRoot,
      dataDirectory: this.config.dataDirectory,
      modelPath: this.config.modelPath,
      modelName: this.config.modelName,
      modelBaseUrl: this.config.modelBaseUrl,
      generatorHost: this.config.host,
      generatorApiPort: this.config.port,
      generatorUiPort: this.config.generatorUiPort,
      logLevel: "INFO",
      autoOpenBrowser: false,
      themePreference: "light"
    };
  }

  public async getSettings(): Promise<GeneratorSettings> {
    try {
      const parsed = JSON.parse(await readFile(this.config.settingsPath, "utf8")) as unknown;
      return generatorSettingsSchema.parse({
        ...this.defaults(),
        ...(parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {})
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return this.defaults();
      }
      throw error;
    }
  }

  public async updateSettings(input: unknown): Promise<GeneratorSettings> {
    const update = generatorSettingsUpdateSchema.parse(input);
    const current = await this.getSettings();
    const next = generatorSettingsSchema.parse({
      ...current,
      ...(update as Record<string, unknown>),
      schemaVersion: 1
    });

    await this.writer.writeJsonWithBackup(
      this.config.settingsPath,
      next,
      this.config.settingsBackupDirectory,
      "generator-settings",
      10
    );

    return next;
  }
}
