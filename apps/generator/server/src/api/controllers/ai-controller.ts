import type { FastifyRequest } from "fastify";
import type { AiRuntimeService } from "../../application/services/ai-runtime-service.js";

export function getAiRuntime(service: AiRuntimeService) {
  return service.inspect();
}

export function checkAiEndpoint(service: AiRuntimeService) {
  return service.checkEndpoint();
}

export function startAiRuntime(service: AiRuntimeService) {
  return service.start();
}

export function stopAiRuntime(service: AiRuntimeService) {
  return service.stop();
}

export function warmAiRuntime(service: AiRuntimeService) {
  return service.warmUp();
}

export function testAiGeneration(service: AiRuntimeService, request: FastifyRequest) {
  return service.testGeneration(request.body);
}
