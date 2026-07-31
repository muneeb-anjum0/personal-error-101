import type {
  ContentDetailResponse,
  ContentMetrics,
  ContentStatusResponse
} from "@muneeb-systems/shared-types";
import type { StaticContentInspector } from "../../infrastructure/filesystem/static-content-inspector.js";

export class ContentStatusService {
  public constructor(private readonly inspector: StaticContentInspector) {}

  public inspectAll(): Promise<ContentStatusResponse> {
    return this.inspector.inspectAll();
  }

  public inspectDetail(type: string): Promise<ContentDetailResponse> {
    return this.inspector.inspectDetail(type);
  }

  public metrics(): Promise<ContentMetrics> {
    return this.inspector.metrics();
  }
}
