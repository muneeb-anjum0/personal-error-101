import type { FastifyInstance } from "fastify";
import { getHealth } from "../controllers/health-controller.js";

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/", () => ({
    name: "MUNEEB.SYSTEMS GENERATOR API",
    status: "healthy",
    health: "/health",
    readiness: "/ready",
    documentation: "/api/docs"
  }));
  app.get("/health", () => getHealth());
}
