import type { FastifyInstance } from "fastify";
import { getReadiness } from "../controllers/readiness-controller.js";

export function registerReadinessRoutes(app: FastifyInstance): void {
  app.get("/ready", async () => getReadiness(app.readinessService));
}
