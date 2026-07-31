import type { FastifyRequest } from "fastify";
import type { PublishingBundleService } from "../../application/services/publishing-bundle-service.js";

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
