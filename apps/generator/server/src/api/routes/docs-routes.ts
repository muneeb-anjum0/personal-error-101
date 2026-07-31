import type { FastifyInstance } from "fastify";

export function registerDocsRoutes(app: FastifyInstance): void {
  app.get("/api/docs", () => ({
    openapi: "3.1.0",
    info: {
      title: "MUNEEB.SYSTEMS GENERATOR API",
      version: app.appConfig.version,
      description: "Local-only Phase 3 generator management API."
    },
    paths: Object.fromEntries(
      [
        "/health",
        "/ready",
        "/api/version",
        "/api/dashboard",
        "/api/content/status",
        "/api/content/{type}",
        "/api/settings",
        "/api/logs",
        "/api/system",
        "/api/docs"
      ].map((apiPath) => [
        apiPath,
        { get: { description: "See shared Zod schemas for response contracts." } }
      ])
    )
  }));
}
