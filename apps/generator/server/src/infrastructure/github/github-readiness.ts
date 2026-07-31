import type { ServiceReadiness } from "../../domain/interfaces/service-readiness.js";

export class GitHubReadiness implements ServiceReadiness {
  public constructor(private readonly configured: boolean) {}

  public isReady(): boolean {
    return this.configured;
  }
}
