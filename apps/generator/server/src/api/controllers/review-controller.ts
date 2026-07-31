import type { FastifyRequest } from "fastify";
import type { ReviewService } from "../../application/services/review-service.js";

export function listReviews(service: ReviewService) {
  return service.listReviews();
}

export function openReview(service: ReviewService, request: FastifyRequest) {
  return service.openReview(request.body);
}

export function getReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.getReview(reviewId);
}

export function updateWorkingCopy(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.updateWorkingCopy(reviewId, request.body);
}

export function saveReviewRevision(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.saveRevision(reviewId, request.body);
}

export async function listReviewRevisions(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  const items = await service.listRevisions(reviewId);
  return { items, total: items.length };
}

export function compareReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  const query = request.query as { leftId?: string; rightId?: string };
  return service.compare(reviewId, query.leftId, query.rightId);
}

export function validateReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.validateReview(reviewId);
}

export function approveReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.approve(reviewId, request.body);
}

export function rejectReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.reject(reviewId, request.body);
}

export function reopenReview(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.reopen(reviewId);
}

export function updateReviewMapping(service: ReviewService, request: FastifyRequest) {
  const { reviewId } = request.params as { reviewId: string };
  return service.updateMapping(reviewId, request.body);
}
