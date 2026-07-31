import type { SystemService } from "../../application/services/system-service.js";

export function getSystemInformation(service: SystemService) {
  return service.getSystemInformation();
}
