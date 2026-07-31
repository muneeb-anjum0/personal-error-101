import type { FastifyInstance } from "fastify";
import { getSystemInformation } from "../controllers/system-controller.js";

export function registerSystemRoutes(app: FastifyInstance): void {
  app.get("/api/system", () => getSystemInformation(app.systemService));
}
