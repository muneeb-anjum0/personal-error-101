import type { ServiceReadiness } from "../../domain/interfaces/service-readiness.js";

export class AiReadiness implements ServiceReadiness {
  public constructor(private readonly configuredForFutureUse: boolean) {}

  public isReady(): boolean {
    void this.configuredForFutureUse;
    return false;
  }
}
