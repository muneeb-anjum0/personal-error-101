import { createHash, randomUUID } from "node:crypto";
import type { PublishingBundle } from "@muneeb-systems/shared-types";
import type { PublishingBundleRepository } from "../../infrastructure/publishing/publishing-bundle-repository.js";
import type { ReviewService } from "./review-service.js";
import type { StagedContentService } from "./staged-content-service.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";

const notice = "PHASE 6 PREPARATION ONLY. NO GIT COMMIT, PUSH, OR DEPLOYMENT WILL OCCUR." as const;

export class PublishingBundleService {
  public constructor(
    private readonly repository: PublishingBundleRepository,
    private readonly reviews: ReviewService,
    private readonly staged: StagedContentService
  ) {}

  public async status() {
    const bundles = await this.repository.list();
    const current = bundles[0] ?? null;
    return {
      schemaVersion: 1 as const,
      bundles: bundles.length,
      currentBundleId: current?.id ?? null,
      readyForManualPublish: current?.status === "PREPARED" || current?.status === "VALIDATED",
      notice
    };
  }

  public listBundles() {
    return this.repository.list();
  }

  public async prepare(): Promise<PublishingBundle> {
    const approvals = await this.reviews.approvals();
    const data = await this.staged.effectiveBundle();
    const errors =
      approvals.length === 0 ? ["No approved reviews are available for inclusion."] : [];
    const bundle: PublishingBundle = {
      schemaVersion: 1,
      id: `bundle_${randomUUID()}`,
      createdAt: new Date().toISOString(),
      status: errors.length ? "INVALID" : "PREPARED",
      approvalIds: approvals.map((approval) => approval.id),
      baselineHash: hash("public-baseline"),
      bundleHash: hash(data),
      diff: [
        {
          field: "staged-content",
          state: "MODIFIED",
          before: "public baseline",
          after: "staged bundle"
        }
      ],
      validation: { valid: errors.length === 0, errors, warnings: [] },
      notice
    };
    await this.repository.save(bundle, data);
    return bundle;
  }

  public async getBundle(id: string): Promise<PublishingBundle> {
    const bundle = await this.repository.get(id);
    if (!bundle)
      throw new GeneratorError(
        "PUBLISHING_BUNDLE_NOT_FOUND",
        "Publishing bundle was not found.",
        404
      );
    return bundle;
  }
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}
