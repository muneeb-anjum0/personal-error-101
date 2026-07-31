import type { ServiceReadiness } from "../../domain/interfaces/service-readiness.js";

export class GitHubReadiness implements ServiceReadiness {
  public isReady(): boolean {
    return true;
  }
}
