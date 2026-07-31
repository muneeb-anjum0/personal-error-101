import type { FastifyInstance } from "fastify";
import { getContentDetail, getContentStatus } from "../controllers/content-controller.js";

export function registerContentRoutes(app: FastifyInstance): void {
  app.get("/api/content/status", () => getContentStatus(app.contentStatusService));
  app.get<{ Params: { type: string } }>("/api/content/:type", (request) =>
    getContentDetail(app.contentStatusService, request.params.type)
  );
}
