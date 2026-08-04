import type { FastifyInstance } from "fastify";

export function registerDocsRoutes(app: FastifyInstance): void {
  app.get("/api/docs", () => ({
    openapi: "3.1.0",
    info: {
      title: "MUNEEB.SYSTEMS GENERATOR API",
      version: app.appConfig.version,
      description:
        "Local-only portfolio generator API for repository summaries and direct content management. Do not expose publicly."
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
        "/api/ai/runtime",
        "/api/ai/check",
        "/api/ai/start",
        "/api/ai/stop",
        "/api/ai/warm-up",
        "/api/ai/test-generation",
        "/api/queue",
        "/api/queue/enqueue",
        "/api/queue/start",
        "/api/queue/pause",
        "/api/queue/resume",
        "/api/queue/jobs/{jobId}/cancel",
        "/api/queue/jobs/{jobId}/retry",
        "/api/queue/retry-failed",
        "/api/drafts",
        "/api/drafts/{draftId}",
        "/api/staged",
        "/api/staged/status",
        "/api/staged/profile",
        "/api/staged/experience",
        "/api/staged/experience/{entryId}",
        "/api/staged/skills",
        "/api/staged/activity",
        "/api/staged/activity/{entryId}",
        "/api/system",
        "/api/docs"
      ].map((apiPath) => [
        apiPath,
        { get: { description: "See shared Zod schemas for response contracts." } }
      ])
    )
  }));
}
