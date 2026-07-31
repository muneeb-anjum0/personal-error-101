import type { FastifyRequest } from "fastify";
import type { StagedContentService } from "../../application/services/staged-content-service.js";

export function stagedStatus(service: StagedContentService) {
  return service.status();
}

export function getStaged(service: StagedContentService) {
  return service.effectiveBundle();
}

export function getStagedType(service: StagedContentService, type: string) {
  return service.get(type as never);
}

export function updateProfile(service: StagedContentService, request: FastifyRequest) {
  return service.updateProfile(request.body);
}

export function getProjects(service: StagedContentService) {
  return service.get("projects");
}

export function addProject(service: StagedContentService, request: FastifyRequest) {
  return service.addProject(request.body);
}

export function updateProject(service: StagedContentService, request: FastifyRequest) {
  const { projectId } = request.params as { projectId: string };
  return service.updateProject(projectId, request.body);
}

export function hideProject(service: StagedContentService, request: FastifyRequest) {
  const { projectId } = request.params as { projectId: string };
  return service.setProjectHidden(projectId, true);
}

export function showProject(service: StagedContentService, request: FastifyRequest) {
  const { projectId } = request.params as { projectId: string };
  return service.setProjectHidden(projectId, false);
}

export function stageDeleteProject(service: StagedContentService, request: FastifyRequest) {
  const { projectId } = request.params as { projectId: string };
  return service.stageProjectDelete(projectId);
}

export function updateExperience(service: StagedContentService, request: FastifyRequest) {
  return service.updateExperience(request.body);
}

export function upsertExperience(service: StagedContentService, request: FastifyRequest) {
  const { entryId } = request.params as { entryId: string };
  return service.upsertExperience(entryId, request.body);
}

export function updateSkills(service: StagedContentService, request: FastifyRequest) {
  return service.updateSkills(request.body);
}

export function updateActivity(service: StagedContentService, request: FastifyRequest) {
  return service.updateActivity(request.body);
}

export function upsertActivity(service: StagedContentService, request: FastifyRequest) {
  const { entryId } = request.params as { entryId: string };
  return service.upsertActivity(entryId, request.body);
}
