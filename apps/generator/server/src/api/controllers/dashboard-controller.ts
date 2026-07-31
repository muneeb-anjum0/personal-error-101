import type { DashboardService } from "../../application/services/dashboard-service.js";

export function getDashboardOverview(service: DashboardService) {
  return service.getOverview();
}
