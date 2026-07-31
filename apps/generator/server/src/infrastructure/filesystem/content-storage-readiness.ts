import { access } from "node:fs/promises";
import type { ServiceReadiness } from "../../domain/interfaces/service-readiness.js";

export class ContentStorageReadiness implements ServiceReadiness {
  public constructor(private readonly dataDirectory: string) {}

  public async isReady(): Promise<boolean> {
    try {
      await access(this.dataDirectory);
      return true;
    } catch {
      return false;
    }
  }
}
