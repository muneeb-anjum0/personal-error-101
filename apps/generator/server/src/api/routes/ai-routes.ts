import type { FastifyInstance } from "fastify";
import {
  checkAiEndpoint,
  getAiRuntime,
  startAiRuntime,
  stopAiRuntime,
  testAiGeneration,
  warmAiRuntime
} from "../controllers/ai-controller.js";

export function registerAiRoutes(app: FastifyInstance): void {
  app.get("/api/ai/runtime", () => getAiRuntime(app.aiRuntimeService));
  app.post("/api/ai/check", () => checkAiEndpoint(app.aiRuntimeService));
  app.post("/api/ai/start", () => startAiRuntime(app.aiRuntimeService));
  app.post("/api/ai/stop", () => stopAiRuntime(app.aiRuntimeService));
  app.post("/api/ai/warm-up", () => warmAiRuntime(app.aiRuntimeService));
  app.post("/api/ai/test-generation", (request) => testAiGeneration(app.aiRuntimeService, request));
}
