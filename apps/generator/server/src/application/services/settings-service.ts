import type { GeneratorSettings, SafeConfigurationSummary } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { JsonSettingsRepository } from "../../infrastructure/filesystem/json-settings-repository.js";

export class SettingsService {
  public constructor(
    private readonly repository: JsonSettingsRepository,
    private readonly config: GeneratorAppConfig
  ) {}

  public getSettings(): Promise<GeneratorSettings> {
    return this.repository.getSettings();
  }

  public updateSettings(update: unknown): Promise<GeneratorSettings> {
    return this.repository.updateSettings(update);
  }

  public async getSafeConfiguration(): Promise<SafeConfigurationSummary> {
    const settings = await this.getSettings();
    return {
      fields: [
        field(
          "githubUsername",
          "GitHub username",
          settings.githubUsername || "Not configured",
          "LOCAL SETTINGS"
        ),
        field(
          "includePrivateRepositories",
          "Include private repositories",
          String(settings.includePrivateRepositories),
          "LOCAL SETTINGS"
        ),
        field("modelName", "AI model name", settings.modelName, "LOCAL SETTINGS"),
        field("modelPath", "AI model path", settings.modelPath, "LOCAL SETTINGS"),
        field("modelBaseUrl", "AI model base URL", settings.modelBaseUrl, "LOCAL SETTINGS"),
        field("generatorHost", "API host", settings.generatorHost, "LOCAL SETTINGS", true),
        field(
          "generatorApiPort",
          "API port",
          String(settings.generatorApiPort),
          "LOCAL SETTINGS",
          true
        ),
        field(
          "portfolioRepositoryPath",
          "Portfolio path",
          settings.portfolioRepositoryPath,
          "LOCAL SETTINGS"
        ),
        field("dataDirectory", "Data directory", settings.dataDirectory, "LOCAL SETTINGS", true),
        field("environment", "Environment mode", this.config.environment, "ENVIRONMENT"),
        field(
          "githubToken",
          "GITHUB_TOKEN",
          this.config.githubConfigured ? "CONFIGURED" : "NOT CONFIGURED",
          "ENVIRONMENT",
          false,
          true
        )
      ]
    };
  }
}

function field(
  key: string,
  label: string,
  value: string,
  source: "ENVIRONMENT" | "LOCAL SETTINGS" | "DEFAULT",
  restartRequired = false,
  secret = false
) {
  return { key, label, value, source, restartRequired, secret };
}
