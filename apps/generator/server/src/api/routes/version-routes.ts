import type { FastifyInstance } from "fastify";
import { getVersion } from "../controllers/version-controller.js";

export function registerVersionRoutes(app: FastifyInstance): void {
  app.get("/api/version", () => getVersion(app.versionService));
}
