import type { FastifyRequest } from "fastify";
import type { PublishingBundleService } from "../../application/services/publishing-bundle-service.js";
import type { PublishingExecutionService } from "../../application/services/publishing-execution-service.js";

export function publishingStatus(service: PublishingBundleService) {
  return service.status();
}

export async function listPublishingBundles(service: PublishingBundleService) {
  const items = await service.listBundles();
  return { items, total: items.length };
}

export function preparePublishingBundle(service: PublishingBundleService) {
  return service.prepare();
}

export function getPublishingBundle(service: PublishingBundleService, request: FastifyRequest) {
  const { bundleId } = request.params as { bundleId: string };
  return service.getBundle(bundleId);
}

export function publishingExecutionStatus(service: PublishingExecutionService) {
  return service.executionStatus();
}

export function listPublishingRuns(service: PublishingExecutionService) {
  return service.listRuns();
}

export function createPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  return service.createRun(request.body);
}

export function getPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.getRun(runId);
}

export function runPublishingPreflight(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.preflight(runId);
}

export function getPublishingRunDiff(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.structuredDiff(runId);
}

export function createPublishingBackup(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.createBackup(runId);
}

export function applyPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.apply(runId, request.body);
}

export function validatePublishingRun(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.validate(runId);
}

export function buildPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.build(runId);
}

export function getPublishingGitDiff(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.gitDiff(runId);
}

export function prepareCommitConfirmation(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.prepareCommitConfirmation(runId);
}

export function commitPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.commit(runId, request.body);
}

export function preparePushConfirmation(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.preparePushConfirmation(runId);
}

export function pushPublishingRun(service: PublishingExecutionService, request: FastifyRequest) {
  const { runId } = request.params as { runId: string };
  return service.push(runId, request.body);
}

export function prepareRollbackConfirmation(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.prepareRollbackConfirmation(runId);
}

export function rollbackPublishingRun(
  service: PublishingExecutionService,
  request: FastifyRequest
) {
  const { runId } = request.params as { runId: string };
  return service.rollback(runId, request.body);
}

export function listPublishingBackups(service: PublishingExecutionService) {
  return service.listBackups();
}

export function getPublishingBackup(service: PublishingExecutionService, request: FastifyRequest) {
  const { backupId } = request.params as { backupId: string };
  return service.getBackup(backupId);
}

export function gitPushReadiness(service: PublishingExecutionService) {
  return service.gitPushReadiness();
}

export function githubAuthCheck(service: PublishingExecutionService) {
  return service.githubTokenStatus();
}
