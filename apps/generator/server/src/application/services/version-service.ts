import type { ApiVersionResponse } from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";

export class VersionService {
  public constructor(private readonly config: GeneratorAppConfig) {}

  public getVersion(): ApiVersionResponse {
    return {
      name: "muneeb-systems-generator",
      version: this.config.version,
      phase: this.config.phase
    };
  }
}
