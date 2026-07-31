import { createHash, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, realpath, rename, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  CommitResult,
  ExperienceEntry,
  GitDiffSummary,
  GitPushReadiness,
  GitRepositoryStatus,
  GitWorkingTreeClassification,
  PortfolioBuildCommandResult,
  PortfolioBuildResult,
  PublicContentBackup,
  PublicContentValidationResult,
  PublishingAuditEvent,
  PublishingBundle,
  PublishingCheck,
  PublishingConfirmationAction,
  PublishingConfirmationToken,
  PublishingPreflightResult,
  PublishingRun,
  PushResult,
  Project,
  RollbackResult,
  StagedContentBundle
} from "@muneeb-systems/shared-types";
import {
  activityItemSchema,
  commitRequestSchema,
  contentBundleSchema,
  createPublishingRunRequestSchema,
  experienceEntrySchema,
  profileSchema,
  projectSchema,
  publicContentBackupSchema,
  publishingConfirmationTokenSchema,
  publishingRunSchema,
  pushConfirmationSchema,
  rollbackRequestSchema,
  skillCategorySchema,
  stagedContentBundleSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";
import type { PublishingBundleRepository } from "../../infrastructure/publishing/publishing-bundle-repository.js";
import type { PublishingRunRepository } from "../../infrastructure/publishing/publishing-run-repository.js";
import { SafeGit, clean } from "../../infrastructure/git/safe-git.js";

const execFileAsync = promisify(execFile);
const allowedFiles = [
  "profile.json",
  "projects.json",
  "experience.json",
  "skills.json",
  "activity.json"
] as const;
const publicFilePaths = allowedFiles.map((file) => `data/${file}`);
const terminalStages = new Set(["COMPLETED", "ROLLED_BACK", "CANCELLED", "FAILED"]);

export class PublishingExecutionService {
  private readonly git: SafeGit;

  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly bundles: PublishingBundleRepository,
    private readonly runs: PublishingRunRepository,
    private readonly logger: ApplicationLogger
  ) {
    this.git = new SafeGit(config.repositoryRoot);
  }

  public async executionStatus() {
    const runs = await this.runs.listRuns();
    const latestRun = runs[0] ?? null;
    return {
      activeRunId: latestRun && !terminalStages.has(latestRun.currentStage) ? latestRun.id : null,
      locked: Boolean(latestRun && !terminalStages.has(latestRun.currentStage)),
      latestRun
    };
  }

  public async listRuns() {
    const items = await this.runs.listRuns();
    return { items, total: items.length };
  }

  public async getRun(runId: string): Promise<PublishingRun> {
    const run = await this.runs.getRun(runId);
    if (!run)
      throw new GeneratorError("PUBLISHING_RUN_NOT_FOUND", "Publishing run was not found.", 404);
    return run;
  }

  public async createRun(input: unknown): Promise<PublishingRun> {
    const request = createPublishingRunRequestSchema.parse(input ?? {});
    const bundle = await this.requireBundle(request.bundleId);
    if (!(bundle.status === "PREPARED" || bundle.status === "VALIDATED")) {
      throw new GeneratorError(
        "PUBLISHING_BUNDLE_NOT_READY",
        "Selected bundle is not ready for publishing.",
        422
      );
    }
    const existing = (await this.runs.listRuns()).find(
      (run) => !terminalStages.has(run.currentStage)
    );
    if (existing) {
      throw new GeneratorError(
        "PUBLISHING_RUN_LOCKED",
        "A publishing run is already active.",
        409,
        [existing.id]
      );
    }
    const git = await this.gitStatus();
    const data = await this.requireBundleData(bundle.id);
    const now = new Date().toISOString();
    const run: PublishingRun = publishingRunSchema.parse({
      schemaVersion: 1,
      id: `publish_${randomUUID()}`,
      bundleId: bundle.id,
      bundleHash: bundle.bundleHash,
      baselineCommit: git.headCommit,
      baselineContentHashes: this.fileHashes(await readPublicFiles(this.config.dataDirectory)),
      proposedContentHashes: this.fileHashes(bundleToFiles(data)),
      currentGitBranch: git.branch,
      gitRemote: git.remote,
      createdAt: now,
      startedAt: now,
      updatedAt: now,
      completedAt: null,
      currentStage: "CREATED",
      previousStages: [],
      validationResults: null,
      buildResults: null,
      gitDiffSummary: null,
      commitHash: null,
      pushResult: null,
      backupId: null,
      rollbackStatus: "NONE",
      error: null,
      warnings: [],
      userConfirmations: [],
      auditEventIds: []
    });
    await this.runs.saveRun(run);
    await this.audit(run.id, "PUBLISHING_RUN_CREATED", "Publishing run created", {
      bundleId: bundle.id
    });
    return run;
  }

  public async preflight(runId: string): Promise<PublishingPreflightResult> {
    let run = await this.transition(runId, "PREFLIGHT_CHECKING");
    const bundle = await this.requireBundle(run.bundleId);
    const data = await this.requireBundleData(bundle.id);
    const currentFiles = await readPublicFiles(this.config.dataDirectory);
    const proposedFiles = bundleToFiles(data);
    const git = await this.gitStatus();
    const baselineHash = hash(currentFiles);
    const validation = validatePublicFiles(data);
    const projects = projectSchema.array().parse(data.projects);
    const checks: PublishingCheck[] = [
      check("Bundle exists", true, bundle.id),
      check(
        "Bundle immutable",
        bundle.bundleHash === hash(data),
        "Stored bundle hash matches data"
      ),
      check(
        "Bundle ready",
        bundle.status === "PREPARED" || bundle.status === "VALIDATED",
        bundle.status
      ),
      check(
        "Bundle validation",
        bundle.validation.valid,
        bundle.validation.errors.join("; ") || "Bundle validation passes"
      ),
      check(
        "Baseline current",
        bundle.baselineHash === baselineHash,
        "Current public baseline matches bundle baseline"
      ),
      check(
        "Approvals exist",
        bundle.approvalIds.length > 0,
        `${bundle.approvalIds.length} approvals`
      ),
      check(
        "Public data writable",
        await canWrite(this.config.dataDirectory),
        this.config.dataDirectory
      ),
      check("Git repository", git.repositoryValid, git.headCommit ?? "Repository unavailable"),
      check(
        "Working tree safe",
        git.workingTreeState === "CLEAN" ||
          git.workingTreeState === "ONLY_EXPECTED_GENERATOR_STATE",
        git.workingTreeState
      ),
      check(
        "Public content valid",
        validation.valid,
        validation.errors.join("; ") || "Public schema validation passes"
      ),
      check(
        "No duplicate project IDs",
        !hasDuplicates(projects.map((project) => project.id)),
        "Project IDs are unique"
      ),
      check(
        "No duplicate slugs",
        !hasDuplicates(projects.map((project) => project.slug ?? project.id)),
        "Project slugs are unique"
      ),
      check(
        "Allowed public files",
        Object.keys(proposedFiles).every((file) =>
          allowedFiles.includes(file as (typeof allowedFiles)[number])
        ),
        "Only approved data files"
      )
    ];
    const valid = checks.every((item) => item.status !== "FAIL");
    const confirmation = valid ? this.confirmation(run, "APPLY", baselineHash, git.branch) : null;
    if (confirmation) await this.runs.saveConfirmation(confirmation);
    run = await this.replace(run, {
      currentStage: valid ? "READY_TO_APPLY" : "PREFLIGHT_FAILED",
      error: valid ? null : "Preflight checks failed.",
      warnings: checks.filter((item) => item.status === "WARN").map((item) => item.message),
      userConfirmations: confirmation
        ? [...run.userConfirmations, confirmation]
        : run.userConfirmations
    });
    await this.audit(run.id, "PREFLIGHT_COMPLETED", "Publishing preflight completed", { valid });
    return {
      valid,
      checks,
      baselineHash,
      changedFiles: changedPublicFiles(currentFiles, proposedFiles),
      confirmation
    };
  }

  public async structuredDiff(runId: string): Promise<GitDiffSummary> {
    const run = await this.getRun(runId);
    const data = await this.requireBundleData(run.bundleId);
    return structuredDiff(await readPublicFiles(this.config.dataDirectory), bundleToFiles(data));
  }

  public async createBackup(runId: string): Promise<PublicContentBackup> {
    let run = await this.transition(runId, "BACKING_UP");
    const bundle = await this.requireBundle(run.bundleId);
    const git = await this.gitStatus();
    const files = await readPublicFiles(this.config.dataDirectory);
    const backupId = `backup_${randomUUID()}`;
    const directory = path.join(this.config.publishingBackupDirectory, backupId);
    await mkdir(directory, { recursive: true });
    for (const file of allowedFiles) {
      await copyFile(path.join(this.config.dataDirectory, file), path.join(directory, file));
    }
    const sizes: Record<string, number> = Object.fromEntries(
      await Promise.all(
        allowedFiles.map(
          async (file): Promise<[string, number]> => [
            file,
            (await stat(path.join(directory, file))).size
          ]
        )
      )
    );
    const backup: PublicContentBackup = publicContentBackupSchema.parse({
      schemaVersion: 1,
      id: backupId,
      publishingRunId: run.id,
      bundleId: bundle.id,
      createdAt: new Date().toISOString(),
      gitBranch: git.branch,
      baselineCommit: git.headCommit,
      directory,
      fileHashes: this.fileHashes(files),
      fileSizes: sizes,
      validationStatus: validatePublicFiles(filesToBundle(files)).valid ? "VALID" : "INVALID",
      restoreEligibility: "ELIGIBLE"
    });
    await this.runs.saveBackupManifest(backup);
    await readFile(path.join(directory, "manifest.json"), "utf8");
    run = await this.replace(run, {
      backupId,
      rollbackStatus: "AVAILABLE",
      currentStage: "READY_TO_APPLY"
    });
    await this.audit(run.id, "BACKUP_CREATED", "Public content backup created", { backupId });
    return backup;
  }

  public async apply(runId: string, input: unknown): Promise<PublishingRun> {
    const token = await this.requireConfirmation(input, "APPLY", runId);
    let run = await this.transition(runId, "APPLYING_CONTENT");
    const bundle = await this.requireBundle(run.bundleId);
    const data = await this.requireBundleData(bundle.id);
    const currentHash = hash(await readPublicFiles(this.config.dataDirectory));
    if (currentHash !== token.baselineHash || bundle.baselineHash !== currentHash) {
      throw new GeneratorError(
        "BASELINE_MISMATCH",
        "Public baseline changed since confirmation.",
        409
      );
    }
    if (!run.backupId) {
      await this.createBackup(runId);
      run = await this.getRun(runId);
      await this.transition(runId, "APPLYING_CONTENT");
    }
    const files = bundleToFiles(data);
    const tempDirectory = path.join(
      this.config.publishingDirectory,
      "apply-temp",
      `${run.id}-${Date.now()}`
    );
    await mkdir(tempDirectory, { recursive: true });
    const replaced: string[] = [];
    try {
      await assertAllowedTargets(this.config.dataDirectory);
      validatePublicFiles(data, true);
      for (const [file, value] of Object.entries(files)) {
        await writeFile(
          path.join(tempDirectory, file),
          `${JSON.stringify(value, null, 2)}\n`,
          "utf8"
        );
      }
      validatePublicFiles(
        filesToBundle(
          Object.fromEntries(
            await Promise.all(
              allowedFiles.map(
                async (file): Promise<[string, unknown]> => [
                  file,
                  JSON.parse(await readFile(path.join(tempDirectory, file), "utf8")) as unknown
                ]
              )
            )
          ) as Record<string, unknown>
        ),
        true
      );
      for (const file of allowedFiles) {
        const target = path.join(this.config.dataDirectory, file);
        const temp = path.join(tempDirectory, file);
        if (process.platform === "win32") await rm(target, { force: true });
        await rename(temp, target);
        replaced.push(file);
      }
      validatePublicFiles(filesToBundle(await readPublicFiles(this.config.dataDirectory)), true);
      const finalHash = hash(await readPublicFiles(this.config.dataDirectory));
      if (finalHash !== hash(files)) {
        throw new Error("Final public content hash does not match bundle hash.");
      }
      run = await this.replace(run, { currentStage: "CONTENT_APPLIED", error: null });
      await this.audit(run.id, "CONTENT_APPLIED", "Approved content applied locally", {
        files: allowedFiles
      });
      return run;
    } catch (error) {
      await this.restoreFromBackup(run, replaced);
      await this.replace(run, { currentStage: "FAILED", error: String(error) });
      throw error;
    } finally {
      await rm(tempDirectory, { recursive: true, force: true });
    }
  }

  public async validate(runId: string): Promise<PublicContentValidationResult> {
    const run = await this.transition(runId, "VALIDATING_CONTENT");
    const result = validatePublicFiles(
      filesToBundle(await readPublicFiles(this.config.dataDirectory))
    );
    await this.replace(run, {
      currentStage: result.valid ? "READY_FOR_GIT_REVIEW" : "VALIDATION_FAILED",
      validationResults: result,
      error: result.valid ? null : result.errors.join("; ")
    });
    await this.audit(run.id, "PUBLIC_CONTENT_VALIDATED", "Public content validation completed", {
      valid: result.valid
    });
    return result;
  }

  public async build(runId: string): Promise<PortfolioBuildResult> {
    const run = await this.transition(runId, "BUILDING_PORTFOLIO");
    const startedAt = new Date().toISOString();
    const commands = [
      ["pnpm", ["--filter", "@muneeb-systems/portfolio", "lint"]],
      ["pnpm", ["--filter", "@muneeb-systems/portfolio", "typecheck"]],
      ["pnpm", ["--filter", "@muneeb-systems/portfolio", "test"]],
      ["pnpm", ["--filter", "@muneeb-systems/portfolio", "build"]]
    ] as const;
    const results: PortfolioBuildCommandResult[] = [];
    for (const [command, args] of commands) {
      results.push(await this.runValidationCommand(command, args));
    }
    const endedAt = new Date().toISOString();
    const result: PortfolioBuildResult = {
      valid: results.every((item) => item.exitCode === 0),
      commands: results,
      startedAt,
      endedAt
    };
    await this.replace(run, {
      currentStage: result.valid ? "AWAITING_COMMIT_CONFIRMATION" : "BUILD_FAILED",
      buildResults: result,
      error: result.valid ? null : "Portfolio validation command failed."
    });
    return result;
  }

  public async gitDiff(runId: string): Promise<GitDiffSummary> {
    const run = await this.getRun(runId);
    const summary = await this.gitDiffForAllowedFiles();
    await this.replace(run, {
      gitDiffSummary: summary,
      currentStage: "AWAITING_COMMIT_CONFIRMATION"
    });
    return summary;
  }

  public async prepareCommitConfirmation(runId: string): Promise<PublishingConfirmationToken> {
    const run = await this.getRun(runId);
    const token = this.confirmation(
      run,
      "COMMIT",
      hash(await readPublicFiles(this.config.dataDirectory)),
      run.currentGitBranch
    );
    await this.runs.saveConfirmation(token);
    await this.replace(run, {
      userConfirmations: [...run.userConfirmations, token],
      currentStage: "AWAITING_COMMIT_CONFIRMATION"
    });
    return token;
  }

  public async commit(runId: string, input: unknown): Promise<CommitResult> {
    const request = commitRequestSchema.parse(input ?? {});
    await this.requireConfirmation(
      { confirmationToken: request.confirmationToken },
      "COMMIT",
      runId
    );
    let run = await this.transition(runId, "COMMITTING");
    const git = await this.gitStatus();
    if (git.conflictingPublicFiles.length === 0 && git.unrelatedFiles.length > 0) {
      throw new GeneratorError(
        "UNRELATED_CHANGES_PRESENT",
        "Unrelated working-tree changes block publishing commit.",
        409,
        git.unrelatedFiles
      );
    }
    const changedAllowed = git.changedFiles.filter((file) => publicFilePaths.includes(file));
    if (changedAllowed.length === 0) {
      throw new GeneratorError(
        "NO_PUBLIC_CONTENT_CHANGES",
        "No approved public content files changed.",
        422
      );
    }
    await this.git.run(["add", "--", ...changedAllowed]);
    const staged = await this.git.run(["diff", "--cached", "--name-only"]);
    const stagedFiles = staged.stdout.split(/\r?\n/).filter(Boolean);
    if (!stagedFiles.every((file) => publicFilePaths.includes(file))) {
      throw new GeneratorError(
        "UNRELATED_STAGED_FILES",
        "Refusing to commit unrelated staged files.",
        409,
        stagedFiles
      );
    }
    const commit = await this.git.run(["commit", "-m", request.message], 30_000);
    if (commit.exitCode !== 0) {
      const result: CommitResult = {
        committed: false,
        commitHash: null,
        stagedFiles,
        message: request.message,
        error: commit.stderr || commit.stdout
      };
      await this.replace(run, { currentStage: "COMMIT_FAILED", error: result.error });
      return result;
    }
    const commitHash = (await this.git.run(["rev-parse", "HEAD"])).stdout.trim();
    const result: CommitResult = {
      committed: true,
      commitHash,
      stagedFiles,
      message: request.message,
      error: null
    };
    run = await this.replace(run, { currentStage: "COMMITTED", commitHash, error: null });
    await this.audit(run.id, "CONTENT_COMMITTED", "Approved content committed", {
      commitHash,
      stagedFiles
    });
    return result;
  }

  public async preparePushConfirmation(runId: string): Promise<PublishingConfirmationToken> {
    const run = await this.replace(await this.getRun(runId), {
      currentStage: "AWAITING_PUSH_CONFIRMATION"
    });
    const token = this.confirmation(
      run,
      "PUSH",
      hash(await readPublicFiles(this.config.dataDirectory)),
      run.currentGitBranch
    );
    await this.runs.saveConfirmation(token);
    await this.replace(run, { userConfirmations: [...run.userConfirmations, token] });
    return token;
  }

  public async push(runId: string, input: unknown): Promise<PushResult> {
    await this.requireConfirmation(input, "PUSH", runId);
    let run = await this.transition(runId, "PUSHING");
    const branch = run.currentGitBranch ?? "main";
    const push = await this.git.run(["push", "origin", branch], 60_000);
    const output = truncate(`${push.stdout}\n${push.stderr}`, 4000);
    const result: PushResult = {
      pushed: push.exitCode === 0,
      remote: run.gitRemote,
      branch,
      category: push.exitCode === 0 ? "SUCCESS" : classifyPushFailure(output, push.timedOut),
      output,
      error: push.exitCode === 0 ? null : output
    };
    run = await this.replace(run, {
      currentStage: result.pushed ? "COMPLETED" : "PUSH_FAILED",
      completedAt: result.pushed ? new Date().toISOString() : null,
      pushResult: result,
      error: result.error
    });
    await this.audit(run.id, result.pushed ? "PUSHED" : "PUSH_FAILED", "Git push completed", {
      category: result.category
    });
    return result;
  }

  public async rollback(runId: string, input: unknown): Promise<RollbackResult> {
    await this.requireConfirmation(input, "ROLLBACK", runId);
    const run = await this.transition(runId, "ROLLING_BACK");
    if (!run.backupId)
      return {
        rolledBack: false,
        backupId: null,
        restoredFiles: [],
        error: "No backup is available."
      };
    await this.restoreFromBackup(run, [...allowedFiles]);
    await this.replace(run, {
      currentStage: "ROLLED_BACK",
      rollbackStatus: "RESTORED",
      completedAt: new Date().toISOString()
    });
    await this.audit(run.id, "ROLLED_BACK", "Public content restored from backup", {
      backupId: run.backupId
    });
    return {
      rolledBack: true,
      backupId: run.backupId,
      restoredFiles: [...allowedFiles],
      error: null
    };
  }

  public async prepareRollbackConfirmation(runId: string): Promise<PublishingConfirmationToken> {
    const run = await this.replace(await this.getRun(runId), {
      currentStage: "ROLLBACK_AVAILABLE"
    });
    const token = this.confirmation(
      run,
      "ROLLBACK",
      hash(await readPublicFiles(this.config.dataDirectory)),
      run.currentGitBranch
    );
    await this.runs.saveConfirmation(token);
    return token;
  }

  public async listBackups() {
    const items = await this.runs.listBackups();
    return { items, total: items.length };
  }

  public getBackup(backupId: string) {
    return this.runs.getBackup(backupId);
  }

  public async gitPushReadiness(): Promise<GitPushReadiness> {
    const status = await this.gitStatus();
    const blockers = [
      ...(status.repositoryValid ? [] : ["Git repository is unavailable."]),
      ...(status.branch ? [] : ["Current Git branch is unknown."]),
      ...(status.remote ? [] : ["Git remote origin is unavailable."]),
      ...(status.workingTreeState === "CONFLICTING_PUBLIC_CONTENT_CHANGES"
        ? ["Public content has uncommitted changes."]
        : [])
    ];
    return { ...status, ready: blockers.length === 0, blockers };
  }

  public githubTokenStatus() {
    return {
      configured: this.config.githubConfigured,
      authenticated: this.config.githubConfigured,
      username: this.config.githubUsername || null,
      privateRepositoryAccess: this.config.githubConfigured
        ? this.config.includePrivateRepositories
        : null,
      scopesOrPermissionsSummary: this.config.githubConfigured
        ? [
            "Token present server-side. Fine-grained token permissions are not exposed by GitHub in a reliable generic header."
          ]
        : [],
      statusLabel: this.config.githubConfigured
        ? "GITHUB TOKEN CONFIGURED"
        : "GITHUB TOKEN NOT CONFIGURED",
      error: null
    };
  }

  private async requireBundle(bundleId: string): Promise<PublishingBundle> {
    const bundle = await this.bundles.get(bundleId);
    if (!bundle)
      throw new GeneratorError(
        "PUBLISHING_BUNDLE_NOT_FOUND",
        "Publishing bundle was not found.",
        404
      );
    return bundle;
  }

  private async requireBundleData(bundleId: string): Promise<StagedContentBundle> {
    return stagedContentBundleSchema.parse(await this.bundles.getData(bundleId));
  }

  private async transition(
    runId: string,
    stage: PublishingRun["currentStage"]
  ): Promise<PublishingRun> {
    const run = await this.getRun(runId);
    return this.replace(run, { currentStage: stage });
  }

  private async replace(run: PublishingRun, patch: Partial<PublishingRun>): Promise<PublishingRun> {
    const next = publishingRunSchema.parse({
      ...run,
      ...patch,
      previousStages:
        patch.currentStage && patch.currentStage !== run.currentStage
          ? [...run.previousStages, run.currentStage]
          : run.previousStages,
      updatedAt: new Date().toISOString()
    });
    await this.runs.saveRun(next);
    return next;
  }

  private confirmation(
    run: PublishingRun,
    action: PublishingConfirmationAction,
    baselineHash: string,
    branch: string | null
  ): PublishingConfirmationToken {
    return publishingConfirmationTokenSchema.parse({
      token: `confirm_${randomUUID()}`,
      action,
      publishingRunId: run.id,
      bundleHash: run.bundleHash,
      baselineHash,
      branch,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString()
    });
  }

  private async requireConfirmation(
    input: unknown,
    action: PublishingConfirmationAction,
    runId: string
  ): Promise<PublishingConfirmationToken> {
    const request = pushConfirmationSchema.or(rollbackRequestSchema).parse(input ?? {});
    const token = await this.runs.getConfirmation(request.confirmationToken);
    if (!token || token.action !== action || token.publishingRunId !== runId) {
      throw new GeneratorError(
        "CONFIRMATION_REQUIRED",
        "A valid action-specific confirmation token is required.",
        403
      );
    }
    if (Date.parse(token.expiresAt) <= Date.now()) {
      throw new GeneratorError("CONFIRMATION_EXPIRED", "Confirmation token expired.", 403);
    }
    return token;
  }

  private async gitStatus(): Promise<GitRepositoryStatus> {
    const root = await this.git.run(["rev-parse", "--show-toplevel"]);
    const branch = await this.git.run(["branch", "--show-current"]);
    const head = await this.git.run(["rev-parse", "HEAD"]);
    const remote = await this.git.run(["remote", "get-url", "origin"]);
    const status = await this.git.run(["status", "--porcelain=v1"]);
    const changedFiles = status.stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .map((line) => line.slice(3).trim().replace(/\\/g, "/"));
    const conflictingPublicFiles = changedFiles.filter((file) => publicFilePaths.includes(file));
    const unrelatedFiles = changedFiles.filter(
      (file) => !publicFilePaths.includes(file) && !file.startsWith("data/publishing/")
    );
    const workingTreeState: GitWorkingTreeClassification =
      status.exitCode !== 0
        ? "UNKNOWN"
        : conflictingPublicFiles.length
          ? "CONFLICTING_PUBLIC_CONTENT_CHANGES"
          : unrelatedFiles.length
            ? "UNRELATED_USER_CHANGES"
            : changedFiles.length
              ? "ONLY_EXPECTED_GENERATOR_STATE"
              : "CLEAN";
    const gh = await hasCommand("gh", ["auth", "status"]);
    return {
      repositoryValid:
        root.exitCode === 0 &&
        path.resolve(root.stdout.trim()) === path.resolve(this.config.repositoryRoot),
      branch: branch.stdout.trim() || null,
      remote: sanitizeRemote(remote.stdout.trim() || null),
      remoteType: remoteType(remote.stdout.trim()),
      headCommit: head.stdout.trim() || null,
      workingTreeState,
      changedFiles,
      conflictingPublicFiles,
      unrelatedFiles,
      ahead: null,
      behind: null,
      credentialMechanism:
        process.platform === "win32"
          ? "Git Credential Manager may be available to direct Windows mode."
          : null,
      githubCliAvailable: gh.available,
      githubCliAuthenticated: gh.exitCode === 0,
      pushDryRunSupported: true,
      warnings: process.env.CONTAINER ? ["Docker may not have access to host Git credentials."] : []
    };
  }

  private async gitDiffForAllowedFiles(): Promise<GitDiffSummary> {
    const statResult = await this.git.run(["diff", "--numstat", "--", ...publicFilePaths]);
    const files = await Promise.all(
      statResult.stdout
        .split(/\r?\n/)
        .filter(Boolean)
        .map(async (line) => {
          const [additions = "0", deletions = "0", file = ""] = line.split(/\t/);
          const diff = await this.git.run(["diff", "--", file]);
          return {
            path: file,
            status: "MODIFIED",
            additions: Number(additions) || 0,
            deletions: Number(deletions) || 0,
            diff: truncate(diff.stdout, 20_000)
          };
        })
    );
    return {
      filesChanged: files.length,
      additions: files.reduce((total, file) => total + file.additions, 0),
      deletions: files.reduce((total, file) => total + file.deletions, 0),
      files,
      truncated: files.some((file) => file.diff.length >= 20_000)
    };
  }

  private async runValidationCommand(
    command: string,
    args: readonly string[]
  ): Promise<PortfolioBuildCommandResult> {
    const startedAt = new Date().toISOString();
    let stdout = "";
    let stderr = "";
    let exitCode = 0;
    try {
      const result = await execFileAsync(command, args, {
        cwd: this.config.repositoryRoot,
        timeout: 120_000,
        windowsHide: true,
        maxBuffer: 1024 * 1024
      });
      stdout = clean(result.stdout);
      stderr = clean(result.stderr);
    } catch (error) {
      const failure = error as { code?: number; stdout?: string; stderr?: string };
      exitCode = failure.code ?? 1;
      stdout = clean(failure.stdout ?? "");
      stderr = clean(failure.stderr ?? "");
    }
    const endedAt = new Date().toISOString();
    const logPath = path.join(
      this.config.publishingBuildLogDirectory,
      `${Date.now()}-${command}-${args.at(-1)}.log`
    );
    await mkdir(this.config.publishingBuildLogDirectory, { recursive: true });
    await writeFile(logPath, `${stdout}\n${stderr}`, "utf8");
    return {
      command: `${command} ${args.join(" ")}`,
      startedAt,
      endedAt,
      exitCode,
      stdoutSummary: truncate(stdout, 1000),
      stderrSummary: truncate(stderr, 1000),
      logPath
    };
  }

  private async restoreFromBackup(run: PublishingRun, files: string[]): Promise<void> {
    if (!run.backupId) return;
    const backup = await this.runs.getBackup(run.backupId);
    if (!backup) return;
    for (const file of files) {
      if (!allowedFiles.includes(file as (typeof allowedFiles)[number])) continue;
      await copyFile(path.join(backup.directory, file), path.join(this.config.dataDirectory, file));
    }
  }

  private fileHashes(files: Record<string, unknown>): Record<string, string> {
    return Object.fromEntries(Object.entries(files).map(([file, value]) => [file, hash(value)]));
  }

  private async audit(
    runId: string,
    category: string,
    message: string,
    details: Record<string, unknown>
  ): Promise<void> {
    const event: PublishingAuditEvent = {
      id: `audit_${randomUUID()}`,
      publishingRunId: runId,
      category,
      createdAt: new Date().toISOString(),
      message,
      details
    };
    await this.runs.appendAudit(event);
    await this.logger.log("INFO", "PUBLISHING_BUNDLE", message, {
      publishingRunId: runId,
      category
    });
  }
}

function bundleToFiles(bundle: StagedContentBundle): Record<string, unknown> {
  return {
    "profile.json": bundle.profile,
    "projects.json": bundle.projects,
    "experience.json": bundle.experience,
    "skills.json": bundle.skills,
    "activity.json": bundle.activity
  };
}

function filesToBundle(files: Record<string, unknown>): StagedContentBundle {
  return stagedContentBundleSchema.parse({
    schemaVersion: 1,
    profile: files["profile.json"],
    projects: files["projects.json"],
    experience: files["experience.json"],
    skills: files["skills.json"],
    activity: files["activity.json"],
    metadata: {
      updatedAt: new Date().toISOString(),
      updatedBy: "Muneeb Anjum",
      source: "MANUAL_EDIT"
    }
  });
}

async function readPublicFiles(dataDirectory: string): Promise<Record<string, unknown>> {
  const entries: Array<[string, unknown]> = await Promise.all(
    allowedFiles.map(
      async (file): Promise<[string, unknown]> => [
        file,
        JSON.parse(await readFile(path.join(dataDirectory, file), "utf8")) as unknown
      ]
    )
  );
  return Object.fromEntries(entries);
}

function validatePublicFiles(
  value: StagedContentBundle,
  throwOnInvalid = false
): PublicContentValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  let projects: Project[] = [];
  let experience: ExperienceEntry[] = [];
  try {
    profileSchema.parse(value.profile);
    projects = projectSchema.array().parse(value.projects);
    experience = experienceEntrySchema.array().parse(value.experience);
    skillCategorySchema.array().parse(value.skills);
    activityItemSchema.array().parse(value.activity);
    contentBundleSchema.omit({ generatorState: true }).parse({
      profile: value.profile,
      projects: value.projects,
      experience: value.experience,
      skills: value.skills,
      activity: value.activity
    });
  } catch (error) {
    errors.push(String(error));
  }
  const projectIds = projects.map((project) => project.id);
  const slugs = projects.map((project) => project.slug ?? project.id);
  if (hasDuplicates(projectIds)) errors.push("Duplicate project IDs detected.");
  if (hasDuplicates(slugs)) errors.push("Duplicate project slugs detected.");
  const missingExperienceRefs = experience.flatMap((entry) =>
    entry.relatedProjectIds.filter((id) => !projectIds.includes(id))
  );
  if (missingExperienceRefs.length)
    errors.push(`Missing related project references: ${missingExperienceRefs.join(", ")}`);
  if (projects.some((project) => project.featured && project.hidden))
    warnings.push("Featured hidden projects will not be visible.");
  const result = {
    valid: errors.length === 0,
    errors,
    warnings,
    checkedAt: new Date().toISOString()
  };
  if (throwOnInvalid && !result.valid) {
    throw new GeneratorError(
      "PUBLIC_CONTENT_VALIDATION_FAILED",
      "Public content validation failed.",
      422,
      errors
    );
  }
  return result;
}

function structuredDiff(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>
): GitDiffSummary {
  const files = Object.keys(proposed)
    .filter((file) => JSON.stringify(current[file]) !== JSON.stringify(proposed[file]))
    .map((file) => ({
      path: `data/${file}`,
      status: current[file] ? "MODIFIED" : "ADDED",
      additions: 0,
      deletions: 0,
      diff: JSON.stringify(
        { before: current[file] ?? null, after: proposed[file] ?? null },
        null,
        2
      )
    }));
  return { filesChanged: files.length, additions: 0, deletions: 0, files, truncated: false };
}

function changedPublicFiles(
  current: Record<string, unknown>,
  proposed: Record<string, unknown>
): string[] {
  return Object.keys(proposed)
    .filter((file) => JSON.stringify(current[file]) !== JSON.stringify(proposed[file]))
    .map((file) => `data/${file}`);
}

async function assertAllowedTargets(dataDirectory: string): Promise<void> {
  const root = await realpath(dataDirectory);
  for (const file of allowedFiles) {
    const target = await realpath(path.join(dataDirectory, file));
    if (!target.startsWith(`${root}${path.sep}`)) {
      throw new GeneratorError(
        "PUBLIC_CONTENT_PATH_ESCAPE",
        "Public content target escapes data directory.",
        400,
        [file]
      );
    }
  }
}

async function canWrite(directory: string): Promise<boolean> {
  try {
    const probe = path.join(directory, `.publish-probe-${process.pid}-${Date.now()}`);
    await writeFile(probe, "ok", "utf8");
    await rm(probe, { force: true });
    return true;
  } catch {
    return false;
  }
}

async function hasCommand(command: string, args: string[]) {
  try {
    const result = await execFileAsync(command, args, {
      timeout: 10_000,
      windowsHide: true,
      maxBuffer: 1024 * 256
    });
    return { available: true, exitCode: 0, output: clean(`${result.stdout}\n${result.stderr}`) };
  } catch (error) {
    const failure = error as { code?: number | string; stdout?: string; stderr?: string };
    return {
      available: failure.code !== "ENOENT",
      exitCode: failure.code ?? 1,
      output: clean(`${failure.stdout ?? ""}\n${failure.stderr ?? ""}`)
    };
  }
}

function sanitizeRemote(remote: string | null): string | null {
  if (!remote) return null;
  return remote.replace(/https:\/\/[^/@]+@/i, "https://REDACTED@");
}

function remoteType(remote: string): "HTTPS" | "SSH" | "OTHER" | "UNKNOWN" {
  if (!remote) return "UNKNOWN";
  if (remote.startsWith("https://")) return "HTTPS";
  if (remote.startsWith("git@") || remote.startsWith("ssh://")) return "SSH";
  return "OTHER";
}

function classifyPushFailure(output: string, timedOut: boolean): PushResult["category"] {
  if (timedOut) return "TIMEOUT";
  if (/authentication|permission denied|could not read username/i.test(output))
    return "AUTHENTICATION_FAILED";
  if (/non-fast-forward|fetch first|rejected/i.test(output)) return "NON_FAST_FORWARD";
  if (/network|timed out|could not resolve|failed to connect/i.test(output)) return "NETWORK";
  return "UNKNOWN";
}

function check(name: string, passed: boolean, message: string): PublishingCheck {
  return { name, status: passed ? "PASS" : "FAIL", message };
}

function hash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value)).digest("hex");
}

function hasDuplicates(values: string[]): boolean {
  return new Set(values).size !== values.length;
}

function truncate(value: string, max: number): string {
  return value.length > max ? `${value.slice(0, max)}\n[truncated]` : value;
}
