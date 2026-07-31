import type { FastifyInstance } from "fastify";
import { getSettings, updateSettings } from "../controllers/settings-controller.js";

export function registerSettingsRoutes(app: FastifyInstance): void {
  app.get("/api/settings", () => getSettings(app.settingsService));
  app.put("/api/settings", (request) => updateSettings(app.settingsService, request.body));
}
