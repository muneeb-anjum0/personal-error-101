import type { FastifyInstance } from "fastify";
import { getDashboardOverview } from "../controllers/dashboard-controller.js";

export function registerDashboardRoutes(app: FastifyInstance): void {
  app.get("/api/dashboard", () => getDashboardOverview(app.dashboardService));
}
