import type { FastifyInstance } from "fastify";
import {
  createPreviewSession,
  getPreviewData,
  getPreviewSession,
  listPreviewSessions
} from "../controllers/preview-controller.js";

export function registerPreviewRoutes(app: FastifyInstance): void {
  app.post("/api/preview/sessions", () => createPreviewSession(app.previewService));
  app.get("/api/preview/sessions", () => listPreviewSessions(app.previewService));
  app.get("/api/preview/sessions/:sessionId", (request) =>
    getPreviewSession(app.previewService, request)
  );
  app.get("/api/preview/sessions/:sessionId/data", (request) =>
    getPreviewData(app.previewService, request)
  );
}
