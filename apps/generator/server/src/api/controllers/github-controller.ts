import type { FastifyRequest } from "fastify";
import type { GitHubService } from "../../application/services/github-service.js";

export function getGitHubStatus(service: GitHubService) {
  return service.getStatus();
}

export function getGitHubRateLimit(service: GitHubService) {
  return service.getRateLimit();
}

export function getGitHubRepositories(service: GitHubService, request: FastifyRequest) {
  return service.getRepositories(request.query);
}

export function getGitHubRepository(service: GitHubService, request: FastifyRequest) {
  const { repositoryId } = request.params as { repositoryId: string };
  return service.getRepository(repositoryId);
}

export async function startGitHubSync(service: GitHubService, request: FastifyRequest) {
  return { accepted: true, status: await service.startSync("INCREMENTAL", request.body) };
}

export async function startFullGitHubSync(service: GitHubService, request: FastifyRequest) {
  return { accepted: true, status: await service.startSync("FULL", request.body) };
}

export async function cancelGitHubSync(service: GitHubService) {
  return { accepted: true, status: await service.cancelSync() };
}

export function getGitHubSyncStatus(service: GitHubService) {
  return service.syncStatus();
}

export function updateGitHubSelection(service: GitHubService, request: FastifyRequest) {
  const { repositoryId } = request.params as { repositoryId: string };
  return service.updateSelection(repositoryId, request.body);
}

export function updateGitHubNotes(service: GitHubService, request: FastifyRequest) {
  const { repositoryId } = request.params as { repositoryId: string };
  return service.updateNotes(repositoryId, request.body);
}

export function bulkGitHubSelection(service: GitHubService, request: FastifyRequest) {
  return service.bulkSelection(request.body);
}
