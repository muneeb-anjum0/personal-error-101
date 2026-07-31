import { appendFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  DraftReview,
  ReviewApproval,
  ReviewRejection,
  ReviewRevision
} from "@muneeb-systems/shared-types";
import {
  draftReviewSchema,
  reviewApprovalSchema,
  reviewRejectionSchema,
  reviewRevisionSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { SafeFileWriter } from "../filesystem/safe-file-writer.js";

export class JsonReviewRepository {
  private readonly writer: SafeFileWriter;

  public constructor(private readonly config: GeneratorAppConfig) {
    this.writer = new SafeFileWriter(config.dataDirectory);
  }

  public async listReviews(): Promise<DraftReview[]> {
    return readArray(this.config.reviewStatePath, draftReviewSchema);
  }

  public async saveReviews(reviews: DraftReview[]): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.reviewStatePath,
      reviews,
      this.config.reviewBackupDirectory,
      "reviews",
      20
    );
  }

  public async listApprovals(): Promise<ReviewApproval[]> {
    return readArray(this.config.reviewApprovalsPath, reviewApprovalSchema);
  }

  public async saveApprovals(approvals: ReviewApproval[]): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.reviewApprovalsPath,
      approvals,
      this.config.reviewBackupDirectory,
      "approvals",
      20
    );
  }

  public async listRejections(): Promise<ReviewRejection[]> {
    return readArray(this.config.reviewRejectionsPath, reviewRejectionSchema);
  }

  public async saveRejections(rejections: ReviewRejection[]): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.reviewRejectionsPath,
      rejections,
      this.config.reviewBackupDirectory,
      "rejections",
      20
    );
  }

  public async saveRevision(revision: ReviewRevision): Promise<void> {
    await mkdir(this.config.reviewRevisionDirectory, { recursive: true });
    await writeFile(
      path.join(this.config.reviewRevisionDirectory, `${revision.id}.json`),
      `${JSON.stringify(revision, null, 2)}\n`,
      "utf8"
    );
  }

  public async getRevision(revisionId: string): Promise<ReviewRevision | null> {
    if (!safeId(revisionId)) return null;
    try {
      return reviewRevisionSchema.parse(
        JSON.parse(
          await readFile(
            path.join(this.config.reviewRevisionDirectory, `${revisionId}.json`),
            "utf8"
          )
        ) as unknown
      );
    } catch {
      return null;
    }
  }

  public async listRevisions(reviewId: string): Promise<ReviewRevision[]> {
    try {
      const files = (await readdir(this.config.reviewRevisionDirectory)).filter((file) =>
        file.endsWith(".json")
      );
      const revisions = await Promise.all(
        files.map((file) => this.getRevision(file.replace(/\.json$/, "")))
      );
      return revisions
        .filter((revision): revision is ReviewRevision => Boolean(revision))
        .filter((revision) => revision.reviewId === reviewId)
        .sort((left, right) => left.revisionNumber - right.revisionNumber);
    } catch {
      return [];
    }
  }

  public async appendAudit(event: Record<string, unknown>): Promise<void> {
    await mkdir(path.dirname(this.config.reviewAuditPath), { recursive: true });
    await appendFile(this.config.reviewAuditPath, `${JSON.stringify(event)}\n`, "utf8");
  }
}

async function readArray<T>(filePath: string, schema: { parse(value: unknown): T }): Promise<T[]> {
  try {
    const raw = JSON.parse(await readFile(filePath, "utf8")) as unknown;
    return Array.isArray(raw) ? raw.map((item) => schema.parse(item)) : [];
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
    return [];
  }
}

function safeId(value: string): boolean {
  return /^[a-zA-Z0-9_-]+$/.test(value);
}
