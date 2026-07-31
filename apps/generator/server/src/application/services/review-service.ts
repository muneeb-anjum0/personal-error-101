import { createHash, randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type {
  DraftReview,
  GeneratedProjectDraft,
  ReviewApproval,
  ReviewContent,
  ReviewMapping,
  ReviewRejection,
  ReviewRevision,
  RevisionComparison
} from "@muneeb-systems/shared-types";
import type { Project } from "@muneeb-systems/shared-types";
import {
  approveReviewRequestSchema,
  reviewContentSchema,
  reviewMappingSchema,
  saveReviewRevisionRequestSchema,
  updateReviewMappingRequestSchema,
  updateWorkingCopyRequestSchema
} from "@muneeb-systems/shared-schemas";
import { GeneratorError } from "../../domain/errors/generator-error.js";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";
import type { JsonDraftRepository } from "../../infrastructure/drafts/json-draft-repository.js";
import type { JsonReviewRepository } from "../../infrastructure/reviews/json-review-repository.js";

export class ReviewService {
  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly reviews: JsonReviewRepository,
    private readonly drafts: JsonDraftRepository,
    private readonly logger: ApplicationLogger
  ) {}

  public async listReviews() {
    const reviews = await this.reviews.listReviews();
    return {
      items: reviews.map((review) => ({
        id: review.id,
        draftId: review.draftId,
        title: review.workingCopy.content.title,
        repositoryFullName: review.repositoryFullName,
        status: review.status,
        validationState: review.workingCopy.validation
          ? review.workingCopy.validation.valid
            ? "VALID"
            : "INVALID"
          : "NOT_VALIDATED",
        mapping: review.mapping,
        revisionCount: review.revisionIds.length,
        updatedAt: review.updatedAt
      })),
      total: reviews.length
    };
  }

  public async openReview(input: unknown): Promise<DraftReview> {
    const request = (await import("@muneeb-systems/shared-schemas")).openReviewRequestSchema.parse(
      input ?? {}
    );
    const existing = (await this.reviews.listReviews()).find(
      (review) => review.draftId === request.draftId
    );
    if (existing) return existing;
    const draft = await this.requireDraft(request.draftId);
    const now = new Date().toISOString();
    const content = reviewContentSchema.parse(draftToReviewContent(draft));
    const validation = await this.validateContent(content, defaultMapping(content.slug));
    const reviewId = `review_${randomUUID()}`;
    const revisionId = `revision_${randomUUID()}`;
    const revision: ReviewRevision = {
      schemaVersion: 1,
      id: revisionId,
      reviewId,
      parentRevisionId: null,
      sourceDraftId: draft.id,
      createdAt: now,
      authorLabel: request.reviewerLabel,
      changeSummary: "Initial review from AI draft.",
      revisionNumber: 1,
      contentHash: validation.contentHash,
      content,
      validation
    };
    const review: DraftReview = {
      schemaVersion: 1,
      id: reviewId,
      draftId: draft.id,
      sourceDraftId: draft.id,
      repositoryId: draft.repositoryId,
      repositoryFullName: draft.repositoryFullName,
      repositorySnapshotHash: draft.repositorySnapshotHash,
      sourceCommitSha: draft.sourceCommitSha,
      readmeHash: draft.readmeHash,
      status: validation.valid ? "READY_FOR_APPROVAL" : "VALIDATION_FAILED",
      flags: flags(defaultMapping(content.slug), validation),
      mapping: defaultMapping(content.slug),
      workingCopy: {
        schemaVersion: 1,
        reviewId,
        version: 1,
        updatedAt: now,
        updatedBy: request.reviewerLabel,
        content,
        validation,
        hasUnsavedChanges: false
      },
      revisionIds: [revisionId],
      approvalId: null,
      rejectionId: null,
      version: 1,
      createdAt: now,
      updatedAt: now
    };
    const all = await this.reviews.listReviews();
    await this.reviews.saveRevision(revision);
    await this.reviews.saveReviews([...all, review]);
    await this.audit("REVIEW_OPENED", review.id, { draftId: draft.id });
    await this.logger.log("INFO", "REVIEW", "Draft review opened", { reviewId, draftId: draft.id });
    return review;
  }

  public async getReview(reviewId: string): Promise<DraftReview> {
    return this.requireReview(reviewId);
  }

  public async listRevisions(reviewId: string): Promise<ReviewRevision[]> {
    await this.requireReview(reviewId);
    return this.reviews.listRevisions(reviewId);
  }

  public async updateWorkingCopy(reviewId: string, input: unknown): Promise<DraftReview> {
    const request = updateWorkingCopyRequestSchema.parse(input ?? {});
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    assertVersion(review, request.expectedVersion);
    const content = reviewContentSchema.parse(request.content);
    const validation = await this.validateContent(content, review.mapping);
    const now = new Date().toISOString();
    const next: DraftReview = {
      ...review,
      status: validation.valid ? "READY_FOR_APPROVAL" : "VALIDATION_FAILED",
      flags: { ...flags(review.mapping, validation), hasManualEdits: true },
      workingCopy: {
        schemaVersion: 1,
        reviewId,
        version: review.workingCopy.version + 1,
        updatedAt: now,
        updatedBy: request.reviewerLabel,
        content,
        validation,
        hasUnsavedChanges: false
      },
      version: review.version + 1,
      updatedAt: now
    };
    all[index] = next;
    await this.reviews.saveReviews(all);
    await this.audit("WORKING_COPY_SAVED", reviewId, { fields: Object.keys(content).length });
    return next;
  }

  public async saveRevision(reviewId: string, input: unknown): Promise<ReviewRevision> {
    const request = saveReviewRevisionRequestSchema.parse(input ?? {});
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    assertVersion(review, request.expectedVersion);
    const validation = await this.validateContent(review.workingCopy.content, review.mapping);
    if (!validation.valid) {
      throw new GeneratorError(
        "REVIEW_VALIDATION_FAILED",
        "Review revision has blocking validation errors.",
        422,
        validation.blockingErrors
      );
    }
    const revisions = await this.reviews.listRevisions(reviewId);
    const now = new Date().toISOString();
    const revision: ReviewRevision = {
      schemaVersion: 1,
      id: `revision_${randomUUID()}`,
      reviewId,
      parentRevisionId: revisions.at(-1)?.id ?? null,
      sourceDraftId: review.sourceDraftId,
      createdAt: now,
      authorLabel: request.authorLabel,
      changeSummary: request.changeSummary,
      revisionNumber: revisions.length + 1,
      contentHash: validation.contentHash,
      content: review.workingCopy.content,
      validation
    };
    const next = {
      ...review,
      status: "READY_FOR_APPROVAL" as const,
      revisionIds: [...review.revisionIds, revision.id],
      workingCopy: { ...review.workingCopy, validation },
      version: review.version + 1,
      updatedAt: now
    };
    all[index] = next;
    await this.reviews.saveRevision(revision);
    await this.reviews.saveReviews(all);
    await this.audit("REVIEW_REVISION_SAVED", reviewId, { revisionId: revision.id });
    return revision;
  }

  public async validateReview(reviewId: string) {
    const review = await this.requireReview(reviewId);
    return this.validateContent(review.workingCopy.content, review.mapping);
  }

  public async updateMapping(reviewId: string, input: unknown): Promise<DraftReview> {
    const request = updateReviewMappingRequestSchema.parse(input ?? {});
    const mapping = reviewMappingSchema.parse(request.mapping);
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    assertVersion(review, request.expectedVersion);
    const validation = await this.validateContent(review.workingCopy.content, mapping);
    const now = new Date().toISOString();
    const next: DraftReview = {
      ...review,
      mapping,
      status: validation.valid ? "READY_FOR_APPROVAL" : "VALIDATION_FAILED",
      flags: flags(mapping, validation),
      workingCopy: { ...review.workingCopy, validation },
      version: review.version + 1,
      updatedAt: now
    };
    all[index] = next;
    await this.reviews.saveReviews(all);
    await this.audit("REVIEW_MAPPING_UPDATED", reviewId, {
      mapping: mapping.type,
      slug: mapping.slug
    });
    return next;
  }

  public async approve(reviewId: string, input: unknown): Promise<ReviewApproval> {
    const request = approveReviewRequestSchema.parse(input ?? {});
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    assertVersion(review, request.expectedVersion);
    const revisions = await this.reviews.listRevisions(reviewId);
    const revision = revisions.at(-1);
    if (!revision)
      throw new GeneratorError(
        "REVIEW_REVISION_REQUIRED",
        "Save a review revision before approval.",
        422
      );
    const validation = await this.validateContent(revision.content, review.mapping);
    if (!validation.valid) {
      throw new GeneratorError(
        "APPROVAL_BLOCKED",
        "Resolve blocking validation errors before approval.",
        422,
        validation.blockingErrors
      );
    }
    const unacknowledged = validation.warnings.filter(
      (warning) => !request.acknowledgedWarnings.includes(warning)
    );
    if (unacknowledged.length) {
      throw new GeneratorError(
        "WARNING_ACKNOWLEDGMENT_REQUIRED",
        "Acknowledge warnings before approval.",
        422,
        unacknowledged
      );
    }
    const approval: ReviewApproval = {
      schemaVersion: 1,
      id: `approval_${randomUUID()}`,
      draftId: review.draftId,
      reviewId,
      reviewRevisionId: revision.id,
      repositoryId: review.repositoryId,
      repositorySnapshotHash: review.repositorySnapshotHash,
      reviewerLabel: request.reviewerLabel,
      approvedAt: new Date().toISOString(),
      validation,
      acknowledgedWarnings: request.acknowledgedWarnings,
      mapping: review.mapping,
      approvalNotes: request.approvalNotes
    };
    const approvals = await this.reviews.listApprovals();
    all[index] = {
      ...review,
      status: "APPROVED",
      approvalId: approval.id,
      rejectionId: null,
      version: review.version + 1,
      updatedAt: approval.approvedAt
    };
    await this.reviews.saveApprovals([...approvals, approval]);
    await this.reviews.saveReviews(all);
    await this.audit("REVIEW_APPROVED", reviewId, { approvalId: approval.id });
    await this.logger.log("INFO", "APPROVAL", "Review approved", {
      reviewId,
      approvalId: approval.id
    });
    return approval;
  }

  public async reject(reviewId: string, input: unknown): Promise<ReviewRejection> {
    const request = (
      await import("@muneeb-systems/shared-schemas")
    ).rejectReviewRequestSchema.parse(input ?? {});
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    const rejection: ReviewRejection = {
      schemaVersion: 1,
      id: `rejection_${randomUUID()}`,
      draftId: review.draftId,
      reviewId,
      reviewRevisionId: review.revisionIds.at(-1) ?? null,
      reason: request.reason,
      notes: request.notes,
      rejectedAt: new Date().toISOString()
    };
    const rejections = await this.reviews.listRejections();
    all[index] = {
      ...review,
      status: "REJECTED",
      rejectionId: rejection.id,
      version: review.version + 1,
      updatedAt: rejection.rejectedAt
    };
    await this.reviews.saveRejections([...rejections, rejection]);
    await this.reviews.saveReviews(all);
    await this.audit("REVIEW_REJECTED", reviewId, {
      rejectionId: rejection.id,
      reason: rejection.reason
    });
    return rejection;
  }

  public async reopen(reviewId: string): Promise<DraftReview> {
    const all = await this.reviews.listReviews();
    const index = all.findIndex((review) => review.id === reviewId);
    if (index === -1) throw notFound();
    const review = all[index];
    if (!review) throw notFound();
    const next = {
      ...review,
      status: "IN_REVIEW" as const,
      version: review.version + 1,
      updatedAt: new Date().toISOString()
    };
    all[index] = next;
    await this.reviews.saveReviews(all);
    await this.audit("REVIEW_REOPENED", reviewId, {});
    return next;
  }

  public async compare(
    reviewId: string,
    leftId?: string,
    rightId?: string
  ): Promise<RevisionComparison> {
    const review = await this.requireReview(reviewId);
    const revisions = await this.reviews.listRevisions(reviewId);
    const left = (leftId ? revisions.find((revision) => revision.id === leftId) : revisions[0])
      ?.content;
    const right =
      (rightId ? revisions.find((revision) => revision.id === rightId) : revisions.at(-1))
        ?.content ?? review.workingCopy.content;
    if (!left || !right)
      throw new GeneratorError("REVISION_NOT_FOUND", "Comparison revisions were not found.", 404);
    return {
      leftId: leftId ?? revisions[0]?.id ?? "working",
      rightId: rightId ?? revisions.at(-1)?.id ?? "working",
      fields: Object.keys(right).map((field) => {
        const before = (left as Record<string, unknown>)[field] ?? null;
        const after = (right as Record<string, unknown>)[field] ?? null;
        return {
          field,
          state: JSON.stringify(before) === JSON.stringify(after) ? "UNCHANGED" : "MODIFIED",
          before,
          after
        };
      })
    };
  }

  public async approvals(): Promise<ReviewApproval[]> {
    return this.reviews.listApprovals();
  }

  private async requireDraft(draftId: string): Promise<GeneratedProjectDraft> {
    const draft = await this.drafts.get(draftId);
    if (!draft) throw new GeneratorError("DRAFT_NOT_FOUND", "Draft artifact was not found.", 404);
    return draft;
  }

  private async requireReview(reviewId: string): Promise<DraftReview> {
    const review = (await this.reviews.listReviews()).find((item) => item.id === reviewId);
    if (!review) throw notFound();
    return review;
  }

  private async validateContent(content: ReviewContent, mapping: ReviewMapping) {
    const parsed = reviewContentSchema.safeParse(content);
    const errors = parsed.success
      ? []
      : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
    const projects = await this.publicProjects();
    if (mapping.type === "UNMAPPED") errors.push("Mapping decision is required.");
    if (!mapping.slug) errors.push("Public project slug is required.");
    if (
      mapping.slug &&
      projects.some(
        (project) => project.slug === mapping.slug && project.id !== mapping.projectId
      ) &&
      !mapping.acknowledgedDuplicate
    ) {
      errors.push(`Duplicate public project slug: ${mapping.slug}`);
    }
    const warnings = [
      content.impactVerified ? null : "Impact is not marked as verified.",
      content.missingInformation.length
        ? `Missing information remains: ${content.missingInformation.join(", ")}`
        : null,
      /best|revolutionary|guaranteed|massive/i.test(`${content.summary} ${content.description}`)
        ? "Marketing or unsupported claim language detected."
        : null
    ].filter((warning): warning is string => Boolean(warning));
    return {
      valid: errors.length === 0,
      blockingErrors: errors,
      warnings,
      checkedAt: new Date().toISOString(),
      contentHash: hash(JSON.stringify(content))
    };
  }

  private async publicProjects(): Promise<Project[]> {
    return JSON.parse(
      await readFile(path.join(this.config.dataDirectory, "projects.json"), "utf8")
    ) as Project[];
  }

  private async audit(eventType: string, reviewId: string, metadata: Record<string, unknown>) {
    await this.reviews.appendAudit({
      id: `audit_${randomUUID()}`,
      eventType,
      reviewId,
      timestamp: new Date().toISOString(),
      metadata
    });
  }
}

function draftToReviewContent(draft: GeneratedProjectDraft): ReviewContent {
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    summary: draft.summary,
    description: draft.description,
    problem: draft.problem,
    realWorldExample: "",
    solution: draft.solution,
    approachSteps: [],
    features: draft.features,
    architecture: draft.architecture,
    challenges: draft.challenges,
    technicalHighlights: [],
    technologies: draft.technologies,
    categories: draft.categories,
    tags: draft.tags,
    impact: draft.impact,
    impactVerified: false,
    limitations: draft.limitations,
    missingInformation: draft.missingInformation,
    confidenceNotes: draft.confidenceNotes,
    slug: slugify(draft.title)
  };
}

function defaultMapping(slug: string): ReviewMapping {
  return { type: "NEW_PROJECT", projectId: null, slug, acknowledgedDuplicate: false, notes: "" };
}

function flags(mapping: ReviewMapping, validation: { warnings: string[] }) {
  return {
    hasManualEdits: false,
    sourceChanged: false,
    hasValidationWarnings: validation.warnings.length > 0,
    mappedToExistingProject: mapping.type === "EXISTING_PROJECT",
    createsNewProject: mapping.type === "NEW_PROJECT",
    includedInPublishingBundle: false
  };
}

function assertVersion(review: DraftReview, expectedVersion: number): void {
  if (review.version !== expectedVersion) {
    throw new GeneratorError(
      "REVIEW_VERSION_CONFLICT",
      "Review was changed after this copy loaded.",
      409,
      [{ expectedVersion, actualVersion: review.version }]
    );
  }
}

function notFound(): GeneratorError {
  return new GeneratorError("REVIEW_NOT_FOUND", "Draft review was not found.", 404);
}

function slugify(value: string): string {
  return (
    value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || `project-${randomUUID().slice(0, 8)}`
  );
}

function hash(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}
