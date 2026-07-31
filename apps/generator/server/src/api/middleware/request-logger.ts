import type { FastifyInstance } from "fastify";
import { requestSummary } from "./request-context.js";

export function registerRequestLogger(app: FastifyInstance): void {
  app.addHook("onResponse", async (request, reply) => {
    await app.applicationLogger.log(
      reply.statusCode >= 500 ? "ERROR" : "INFO",
      "API",
      `${request.method} ${request.url}`,
      requestSummary(request, reply),
      request.requestId
    );
  });
}
