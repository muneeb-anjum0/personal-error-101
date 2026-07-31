import type { FastifyRequest } from "fastify";
import type { ProcessingQueueService } from "../../application/services/processing-queue-service.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";

export function getQueue(service: ProcessingQueueService) {
  return service.getQueue();
}

export function enqueueRepositories(service: ProcessingQueueService, request: FastifyRequest) {
  return service.enqueue(request.body);
}

export function startQueue(service: ProcessingQueueService) {
  return service.start();
}

export function pauseQueue(service: ProcessingQueueService) {
  return service.pause();
}

export function resumeQueue(service: ProcessingQueueService) {
  return service.resume();
}

export function cancelQueueJob(service: ProcessingQueueService, request: FastifyRequest) {
  const { jobId } = request.params as { jobId: string };
  return service.cancelJob(jobId);
}

export function retryQueueJob(service: ProcessingQueueService, request: FastifyRequest) {
  const { jobId } = request.params as { jobId: string };
  return service.retryJob(jobId);
}

export function retryFailedQueueJobs(service: ProcessingQueueService) {
  return service.retryFailed();
}

export function listDrafts(service: ProcessingQueueService) {
  return service.listDrafts();
}

export async function getDraft(service: ProcessingQueueService, request: FastifyRequest) {
  const { draftId } = request.params as { draftId: string };
  const draft = await service.getDraft(draftId);
  if (!draft) {
    throw new GeneratorError("DRAFT_NOT_FOUND", "Draft artifact was not found.", 404);
  }
  return draft;
}
