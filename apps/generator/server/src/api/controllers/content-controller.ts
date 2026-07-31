import type { ContentStatusService } from "../../application/services/content-status-service.js";

export function getContentStatus(service: ContentStatusService) {
  return service.inspectAll();
}

export function getContentDetail(service: ContentStatusService, type: string) {
  return service.inspectDetail(type);
}
