import type { FastifyInstance } from "fastify";
import { getLogs } from "../controllers/logs-controller.js";

export function registerLogsRoutes(app: FastifyInstance): void {
  app.get("/api/logs", (request) => getLogs(app.logQueryService, request.query));
}
