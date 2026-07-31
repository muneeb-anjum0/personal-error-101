import type { FastifyInstance } from "fastify";
import {
  bulkGitHubSelection,
  cancelGitHubSync,
  getGitHubRateLimit,
  getGitHubRepositories,
  getGitHubRepository,
  getGitHubStatus,
  getGitHubSyncStatus,
  startFullGitHubSync,
  startGitHubSync,
  updateGitHubNotes,
  updateGitHubSelection
} from "../controllers/github-controller.js";

export function registerGitHubRoutes(app: FastifyInstance): void {
  app.get("/api/github/status", () => getGitHubStatus(app.githubService));
  app.get("/api/github/rate-limit", () => getGitHubRateLimit(app.githubService));
  app.get("/api/github/repositories", (request) =>
    getGitHubRepositories(app.githubService, request)
  );
  app.get("/api/github/repositories/:repositoryId", (request) =>
    getGitHubRepository(app.githubService, request)
  );
  app.post("/api/github/sync", (request) => startGitHubSync(app.githubService, request));
  app.post("/api/github/sync/full", (request) => startFullGitHubSync(app.githubService, request));
  app.post("/api/github/sync/cancel", () => cancelGitHubSync(app.githubService));
  app.get("/api/github/sync/status", () => getGitHubSyncStatus(app.githubService));
  app.put("/api/github/selections/:repositoryId", (request) =>
    updateGitHubSelection(app.githubService, request)
  );
  app.post("/api/github/selections/bulk", (request) =>
    bulkGitHubSelection(app.githubService, request)
  );
  app.put("/api/github/repositories/:repositoryId/notes", (request) =>
    updateGitHubNotes(app.githubService, request)
  );
}
