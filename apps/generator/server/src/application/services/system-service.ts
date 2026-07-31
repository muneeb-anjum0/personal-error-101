import type { SystemInformation } from "@muneeb-systems/shared-types";
import type { EnvironmentInspector } from "../../infrastructure/system/environment-inspector.js";

export class SystemService {
  public constructor(private readonly inspector: EnvironmentInspector) {}

  public getSystemInformation(): Promise<SystemInformation> {
    return this.inspector.getSystemInformation();
  }
}
