import type { FastifyInstance } from "fastify";

export function registerDocsRoutes(app: FastifyInstance): void {
  app.get("/api/docs", () => ({
    openapi: "3.1.0",
    info: {
      title: "MUNEEB.SYSTEMS GENERATOR API",
      version: app.appConfig.version,
      description: "Local-only Phase 4 generator management API. Do not expose publicly."
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
        "/api/github/status",
        "/api/github/rate-limit",
        "/api/github/repositories",
        "/api/github/repositories/{repositoryId}",
        "/api/github/sync",
        "/api/github/sync/full",
        "/api/github/sync/cancel",
        "/api/github/sync/status",
        "/api/github/selections/{repositoryId}",
        "/api/github/selections/bulk",
        "/api/github/repositories/{repositoryId}/notes",
        "/api/system",
        "/api/docs"
      ].map((apiPath) => [
        apiPath,
        { get: { description: "See shared Zod schemas for response contracts." } }
      ])
    )
  }));
}
