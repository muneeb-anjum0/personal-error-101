import type { ApiReadinessResponse } from "@muneeb-systems/shared-types";
import type { ServiceReadiness } from "../../domain/interfaces/service-readiness.js";

export interface ReadinessDependencies {
  filesystem: ServiceReadiness;
  github: ServiceReadiness;
  ai: ServiceReadiness;
}

export class ReadinessService {
  public constructor(private readonly dependencies: ReadinessDependencies) {}

  public async getReadiness(): Promise<ApiReadinessResponse> {
    const [filesystem, github, ai] = await Promise.all([
      this.dependencies.filesystem.isReady(),
      this.dependencies.github.isReady(),
      this.dependencies.ai.isReady()
    ]);

    return {
      status: "ready",
      services: {
        filesystem,
        github,
        ai
      }
    };
  }
}
