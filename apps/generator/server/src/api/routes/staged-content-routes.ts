import type { FastifyInstance } from "fastify";
import {
  getStaged,
  getStagedType,
  stagedStatus,
  updateActivity,
  updateExperience,
  updateProfile,
  updateSkills,
  upsertActivity,
  upsertExperience
} from "../controllers/staged-content-controller.js";

export function registerStagedContentRoutes(app: FastifyInstance): void {
  app.get("/api/staged", () => getStaged(app.stagedContentService));
  app.get("/api/staged/status", () => stagedStatus(app.stagedContentService));
  app.get("/api/staged/profile", () => getStagedType(app.stagedContentService, "profile"));
  app.put("/api/staged/profile", (request) => updateProfile(app.stagedContentService, request));
  app.get("/api/staged/experience", () => getStagedType(app.stagedContentService, "experience"));
  app.put("/api/staged/experience", (request) =>
    updateExperience(app.stagedContentService, request)
  );
  app.put("/api/staged/experience/:entryId", (request) =>
    upsertExperience(app.stagedContentService, request)
  );
  app.get("/api/staged/skills", () => getStagedType(app.stagedContentService, "skills"));
  app.put("/api/staged/skills", (request) => updateSkills(app.stagedContentService, request));
  app.get("/api/staged/activity", () => getStagedType(app.stagedContentService, "activity"));
  app.put("/api/staged/activity", (request) => updateActivity(app.stagedContentService, request));
  app.put("/api/staged/activity/:entryId", (request) =>
    upsertActivity(app.stagedContentService, request)
  );
}
