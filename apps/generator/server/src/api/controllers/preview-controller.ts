import type { FastifyRequest } from "fastify";
import type { PreviewService } from "../../application/services/preview-service.js";

export function createPreviewSession(service: PreviewService) {
  return service.createSession();
}

export async function listPreviewSessions(service: PreviewService) {
  const items = await service.listSessions();
  return { items, total: items.length };
}

export function getPreviewSession(service: PreviewService, request: FastifyRequest) {
  const { sessionId } = request.params as { sessionId: string };
  return service.getSession(sessionId);
}

export async function getPreviewData(service: PreviewService, request: FastifyRequest) {
  const { sessionId } = request.params as { sessionId: string };
  const [session, data] = await Promise.all([
    service.getSession(sessionId),
    service.getData(sessionId)
  ]);
  return { session, data };
}
