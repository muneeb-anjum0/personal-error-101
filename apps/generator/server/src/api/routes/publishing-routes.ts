import type { FastifyInstance } from "fastify";
import {
  getPublishingBundle,
  listPublishingBundles,
  preparePublishingBundle,
  publishingStatus
} from "../controllers/publishing-controller.js";

export function registerPublishingRoutes(app: FastifyInstance): void {
  app.get("/api/publishing/status", () => publishingStatus(app.publishingBundleService));
  app.get("/api/publishing/bundles", () => listPublishingBundles(app.publishingBundleService));
  app.post("/api/publishing/bundles", () => preparePublishingBundle(app.publishingBundleService));
  app.get("/api/publishing/bundles/:bundleId", (request) =>
    getPublishingBundle(app.publishingBundleService, request)
  );
}
