import { randomUUID } from "node:crypto";
import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

const safeRequestId = /^req_[a-zA-Z0-9_-]{8,80}$/;

declare module "fastify" {
  interface FastifyRequest {
    requestId: string;
    startedAt: number;
  }
}

export function registerRequestContext(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    request.startedAt = Date.now();
    request.requestId = normalizeRequestId(request.headers["x-request-id"]);
    reply.header("x-request-id", request.requestId);
  });
}

export function requestSummary(request: FastifyRequest, reply: FastifyReply) {
  return {
    requestId: request.requestId,
    method: request.method,
    route: request.url,
    statusCode: reply.statusCode,
    durationMs: Date.now() - request.startedAt,
    clientAddress: request.ip
  };
}

function normalizeRequestId(value: FastifyRequest["headers"]["x-request-id"]): string {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (candidate && safeRequestId.test(candidate)) {
    return candidate;
  }
  return `req_${randomUUID().replace(/-/g, "")}`;
}
