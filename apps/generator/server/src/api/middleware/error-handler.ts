import { ZodError } from "zod";
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { GeneratorError } from "../../domain/errors/generator-error.js";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply): void => {
    const generatorError =
      error instanceof GeneratorError
        ? error
        : error instanceof ZodError
          ? new GeneratorError("VALIDATION_ERROR", "Request validation failed.", 400, error.issues)
          : new GeneratorError(
              "INTERNAL_ERROR",
              "The generator API encountered an internal error.",
              500
            );

    request.log.error({ error, requestId: request.requestId }, generatorError.message);
    void app.applicationLogger.log(
      generatorError.statusCode >= 500 ? "ERROR" : "WARN",
      "API",
      generatorError.message,
      { code: generatorError.code },
      request.requestId
    );

    void reply.code(generatorError.statusCode).send({
      error: {
        code: generatorError.code,
        message: generatorError.message,
        requestId: request.requestId,
        details: generatorError.details,
        timestamp: new Date().toISOString()
      }
    });
  });
}
