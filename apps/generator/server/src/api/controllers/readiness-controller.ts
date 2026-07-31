import type { ReadinessService } from "../../application/services/readiness-service.js";

export async function getReadiness(readinessService: ReadinessService) {
  return readinessService.getReadiness();
}
