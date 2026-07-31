import type { ApiVersionResponse } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class VersionService {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public getVersion(): ApiVersionResponse {
    return {
      name: "MUNEEB.SYSTEMS GENERATOR",
      version: this.config.version,
      phase: this.config.phase,
      environment: this.config.environment,
      gitCommit: process.env.GIT_COMMIT ?? null,
      buildTime: process.env.BUILD_TIME ?? null
    };
  }
}
