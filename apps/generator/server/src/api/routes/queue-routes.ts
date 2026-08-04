import type { FastifyInstance } from "fastify";
import {
  cancelQueueJob,
  deleteDraft,
  enqueueRepositories,
  getDraft,
  getQueue,
  listDrafts,
  pauseQueue,
  resumeQueue,
  retryFailedQueueJobs,
  retryQueueJob,
  startQueue
} from "../controllers/queue-controller.js";

export function registerQueueRoutes(app: FastifyInstance): void {
  app.get("/api/queue", () => getQueue(app.processingQueueService));
  app.post("/api/queue/enqueue", (request) =>
    enqueueRepositories(app.processingQueueService, request)
  );
  app.post("/api/queue/start", () => startQueue(app.processingQueueService));
  app.post("/api/queue/pause", () => pauseQueue(app.processingQueueService));
  app.post("/api/queue/resume", () => resumeQueue(app.processingQueueService));
  app.post("/api/queue/jobs/:jobId/cancel", (request) =>
    cancelQueueJob(app.processingQueueService, request)
  );
  app.post("/api/queue/jobs/:jobId/retry", (request) =>
    retryQueueJob(app.processingQueueService, request)
  );
  app.post("/api/queue/retry-failed", () => retryFailedQueueJobs(app.processingQueueService));
  app.get("/api/drafts", () => listDrafts(app.processingQueueService));
  app.get("/api/drafts/:draftId", (request) => getDraft(app.processingQueueService, request));
  app.delete("/api/drafts/:draftId", (request) =>
    deleteDraft(app.processingQueueService, request)
  );
}
