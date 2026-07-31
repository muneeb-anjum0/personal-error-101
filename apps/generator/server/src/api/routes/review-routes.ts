import type { FastifyInstance } from "fastify";
import {
  approveReview,
  compareReview,
  getReview,
  listReviewRevisions,
  listReviews,
  openReview,
  rejectReview,
  reopenReview,
  saveReviewRevision,
  updateReviewMapping,
  updateWorkingCopy,
  validateReview
} from "../controllers/review-controller.js";

export function registerReviewRoutes(app: FastifyInstance): void {
  app.post("/api/reviews", (request) => openReview(app.reviewService, request));
  app.get("/api/reviews", () => listReviews(app.reviewService));
  app.get("/api/reviews/:reviewId", (request) => getReview(app.reviewService, request));
  app.put("/api/reviews/:reviewId/working-copy", (request) =>
    updateWorkingCopy(app.reviewService, request)
  );
  app.post("/api/reviews/:reviewId/revisions", (request) =>
    saveReviewRevision(app.reviewService, request)
  );
  app.get("/api/reviews/:reviewId/revisions", (request) =>
    listReviewRevisions(app.reviewService, request)
  );
  app.get("/api/reviews/:reviewId/compare", (request) => compareReview(app.reviewService, request));
  app.post("/api/reviews/:reviewId/validate", (request) =>
    validateReview(app.reviewService, request)
  );
  app.post("/api/reviews/:reviewId/approve", (request) =>
    approveReview(app.reviewService, request)
  );
  app.post("/api/reviews/:reviewId/reject", (request) => rejectReview(app.reviewService, request));
  app.post("/api/reviews/:reviewId/reopen", (request) => reopenReview(app.reviewService, request));
  app.put("/api/reviews/:reviewId/mapping", (request) =>
    updateReviewMapping(app.reviewService, request)
  );
}
