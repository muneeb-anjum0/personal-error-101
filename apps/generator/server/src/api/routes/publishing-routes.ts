import type { FastifyInstance } from "fastify";
import {
  applyPublishingRun,
  buildPublishingRun,
  commitPublishingRun,
  getPublishingBundle,
  getPublishingBackup,
  getPublishingGitDiff,
  getPublishingRun,
  getPublishingRunDiff,
  gitPushReadiness,
  createPublishingBackup,
  createPublishingRun,
  githubAuthCheck,
  listPublishingBundles,
  listPublishingBackups,
  listPublishingRuns,
  prepareCommitConfirmation,
  preparePublishingBundle,
  preparePushConfirmation,
  prepareRollbackConfirmation,
  publishingStatus,
  publishingExecutionStatus,
  pushPublishingRun,
  rollbackPublishingRun,
  runPublishingPreflight,
  validatePublishingRun
} from "../controllers/publishing-controller.js";

export function registerPublishingRoutes(app: FastifyInstance): void {
  app.get("/api/publishing/status", () => publishingStatus(app.publishingBundleService));
  app.get("/api/publishing/bundles", () => listPublishingBundles(app.publishingBundleService));
  app.post("/api/publishing/bundles", () => preparePublishingBundle(app.publishingBundleService));
  app.get("/api/publishing/bundles/:bundleId", (request) =>
    getPublishingBundle(app.publishingBundleService, request)
  );
  app.get("/api/publishing/execution/status", () =>
    publishingExecutionStatus(app.publishingExecutionService)
  );
  app.get("/api/publishing/runs", () => listPublishingRuns(app.publishingExecutionService));
  app.post("/api/publishing/runs", (request) =>
    createPublishingRun(app.publishingExecutionService, request)
  );
  app.get("/api/publishing/runs/:runId", (request) =>
    getPublishingRun(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/preflight", (request) =>
    runPublishingPreflight(app.publishingExecutionService, request)
  );
  app.get("/api/publishing/runs/:runId/diff", (request) =>
    getPublishingRunDiff(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/backup", (request) =>
    createPublishingBackup(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/apply", (request) =>
    applyPublishingRun(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/validate", (request) =>
    validatePublishingRun(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/build", (request) =>
    buildPublishingRun(app.publishingExecutionService, request)
  );
  app.get("/api/publishing/runs/:runId/git-diff", (request) =>
    getPublishingGitDiff(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/commit-confirmation", (request) =>
    prepareCommitConfirmation(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/commit", (request) =>
    commitPublishingRun(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/push-confirmation", (request) =>
    preparePushConfirmation(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/push", (request) =>
    pushPublishingRun(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/rollback-confirmation", (request) =>
    prepareRollbackConfirmation(app.publishingExecutionService, request)
  );
  app.post("/api/publishing/runs/:runId/rollback", (request) =>
    rollbackPublishingRun(app.publishingExecutionService, request)
  );
  app.get("/api/publishing/backups", () => listPublishingBackups(app.publishingExecutionService));
  app.get("/api/publishing/backups/:backupId", (request) =>
    getPublishingBackup(app.publishingExecutionService, request)
  );
  app.get("/api/publishing/git/readiness", () => gitPushReadiness(app.publishingExecutionService));
  app.post("/api/github/auth/check", () => githubAuthCheck(app.publishingExecutionService));
}
