import type { FastifyInstance } from "fastify";
import { getHealth } from "../controllers/health-controller.js";

export function registerHealthRoutes(app: FastifyInstance): void {
  app.get("/health", () => getHealth());
}
