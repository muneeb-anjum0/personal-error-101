import type {
  DiscoveredRepository,
  GitHubAuthenticationMode,
  GitHubAuthenticationState,
  GitHubBulkSelectionRequest,
  GitHubRepositoriesResponse,
  GitHubRepositoryQuery,
  GitHubSelectionUpdate,
  GitHubSnapshotCompleteness,
  GitHubStatusResponse,
  GitHubSyncMode,
  GitHubSyncProgress,
  Project,
  RepositorySelection
} from "@muneeb-systems/shared-types";
import {
  githubBulkSelectionRequestSchema,
  githubRepositoryQuerySchema,
  githubSelectionUpdateSchema,
  githubSyncRequestSchema,
  githubNotesUpdateSchema
} from "@muneeb-systems/shared-schemas";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { GeneratorError } from "../../domain/errors/generator-error.js";
import type { ContentStatusService } from "./content-status-service.js";
import type { ApplicationLogger } from "../../infrastructure/logging/application-logger.js";
import { GitHubApiClient } from "../../infrastructure/github/github-api-client.js";
import type { JsonGitHubStateRepository } from "../../infrastructure/github/json-github-state-repository.js";
import { summarizeRepositories } from "../../infrastructure/github/json-github-state-repository.js";
import {
  defaultSelection,
  detectChangeSet,
  mapGitHubRepository,
  unavailableRepository
} from "../../infrastructure/github/github-repository-mapper.js";
import type {
  GitHubRepositoryApiRecord,
  GitHubRepositorySource,
  GitHubSyncState
} from "../../infrastructure/github/github-types.js";

export class GitHubService {
  private activeSync: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  private progress: GitHubSyncProgress;

  public constructor(
    private readonly config: GeneratorAppConfig,
    private readonly state: JsonGitHubStateRepository,
    private readonly content: ContentStatusService,
    private readonly logger: ApplicationLogger,
    private readonly source: GitHubRepositorySource = new GitHubApiClient(config.githubToken)
  ) {
    this.progress = state.progress("IDLE");
  }

  public async getStatus(): Promise<GitHubStatusResponse> {
    const [repositories, syncState] = await Promise.all([
      this.state.getRepositories(),
      this.currentState()
    ]);
    const counts = summarizeRepositories(repositories);
    const tokenConfigured = this.config.githubToken.trim().length > 0;
    return {
      configuredUsername: this.config.githubUsername,
      authenticationState: authenticationState(syncState, tokenConfigured),
      authenticationMode: this.authenticationMode(),
      tokenStatus: tokenConfigured ? "TOKEN CONFIGURED" : "TOKEN NOT CONFIGURED",
      includePrivateRepositories: this.config.includePrivateRepositories,
      privateRepositoriesAvailable: tokenConfigured && this.config.includePrivateRepositories,
      lastSuccessfulSyncAt: syncState.lastSuccessfulCompleteSyncAt,
      lastAttemptedSyncAt: syncState.lastAttemptedSyncAt,
      lastSyncMode: syncState.lastSyncMode,
      snapshotCompleteness: syncState.snapshotCompleteness,
      rateLimit: syncState.rateLimit,
      counts,
      warnings: syncState.warnings,
      errors: syncState.errors
    };
  }

  public async getRepositories(rawQuery: unknown): Promise<GitHubRepositoriesResponse> {
    const query = githubRepositoryQuerySchema.parse(rawQuery);
    const repositories = applySorting(
      applyFilters(await this.state.getRepositories(), query),
      query
    );
    return {
      items: repositories.slice(query.offset, query.offset + query.limit),
      total: repositories.length,
      pagination: {
        limit: query.limit,
        offset: query.offset,
        hasMore: query.offset + query.limit < repositories.length
      },
      sort: { field: query.sort, direction: query.direction },
      summary: summarizeRepositories(repositories)
    };
  }

  public async getRateLimit() {
    return this.source.getRateLimit();
  }

  public async getRepository(repositoryId: string): Promise<DiscoveredRepository> {
    const repository = (await this.state.getRepositories()).find(
      (item) => item.id === repositoryId
    );
    if (!repository) {
      throw new GeneratorError("REPOSITORY_NOT_FOUND", "Repository snapshot was not found.", 404);
    }
    return repository;
  }

  public async startSync(mode: GitHubSyncMode, body: unknown): Promise<GitHubSyncProgress> {
    const request = githubSyncRequestSchema.parse(body ?? {});
    if (this.activeSync) {
      throw new GeneratorError(
        "GITHUB_SYNC_ALREADY_RUNNING",
        "A GitHub synchronization is already running.",
        409
      );
    }
    if (this.config.githubUsername.trim().length === 0) {
      throw new GeneratorError("GITHUB_USERNAME_MISSING", "GitHub account is not configured.", 400);
    }

    const startedAt = new Date().toISOString();
    this.abortController = new AbortController();
    this.progress = this.state.progress("AUTHENTICATING", mode, startedAt);
    await this.persistProgress(
      { warnings: [], errors: [], snapshotCompleteness: null },
      startedAt,
      mode
    );

    this.activeSync = this.runSync(
      mode,
      Math.min(request.limit ?? this.config.githubRepositoryLimit, 500)
    )
      .catch(() => undefined)
      .finally(() => {
        this.activeSync = null;
        this.abortController = null;
      });

    return this.progressSnapshot();
  }

  public async cancelSync(): Promise<GitHubSyncProgress> {
    if (!this.activeSync || !this.abortController) {
      return this.progressSnapshot();
    }
    this.progress = { ...this.progress, cancellationRequested: true };
    this.abortController.abort();
    await this.logger.log("WARN", "GITHUB", "GitHub sync cancellation requested");
    return this.progressSnapshot();
  }

  public syncStatus(): GitHubSyncProgress {
    return this.progressSnapshot();
  }

  public async waitForActiveSync(): Promise<void> {
    await this.activeSync;
  }

  public async updateSelection(repositoryId: string, input: unknown): Promise<RepositorySelection> {
    const update: GitHubSelectionUpdate = githubSelectionUpdateSchema.parse(input);
    const repositories = await this.state.getRepositories();
    const index = repositories.findIndex((repository) => repository.id === repositoryId);
    if (index === -1) {
      throw new GeneratorError("REPOSITORY_NOT_FOUND", "Repository snapshot was not found.", 404);
    }
    const repository = repositories[index];
    if (!repository) {
      throw new GeneratorError("REPOSITORY_NOT_FOUND", "Repository snapshot was not found.", 404);
    }
    const selection = {
      ...repository.selection,
      ...update,
      repositoryId,
      selectionUpdatedAt: new Date().toISOString(),
      selectionSource: "MANUAL" as const
    };
    repositories[index] = { ...repository, selection };
    await this.saveSelectionsAndRepositories(repositories);
    await this.logger.log("INFO", "GITHUB", "Repository selection changed", { repositoryId });
    return selection;
  }

  public async updateNotes(repositoryId: string, input: unknown): Promise<RepositorySelection> {
    const update = githubNotesUpdateSchema.parse(input);
    return this.updateSelection(repositoryId, { notes: update.notes });
  }

  public async bulkSelection(
    input: unknown
  ): Promise<{ affected: number; selections: RepositorySelection[]; message: string }> {
    const request: GitHubBulkSelectionRequest = githubBulkSelectionRequestSchema.parse(input);
    const all = await this.state.getRepositories();
    const targetIds = new Set(targetRepositories(all, request).map((repository) => repository.id));
    const timestamp = new Date().toISOString();
    let affected = 0;
    const next = all.map((repository) => {
      if (!targetIds.has(repository.id)) {
        return repository;
      }
      const selection = mutateSelection(repository.selection, request.operation, timestamp);
      if (JSON.stringify(selection) !== JSON.stringify(repository.selection)) {
        affected += 1;
      }
      return { ...repository, selection };
    });

    await this.saveSelectionsAndRepositories(next);
    await this.logger.log("INFO", "GITHUB", "Bulk repository selection changed", {
      operation: request.operation,
      affected
    });
    return {
      affected,
      selections: next
        .filter((repository) => targetIds.has(repository.id))
        .map((repository) => repository.selection),
      message: `${affected} repositories updated.`
    };
  }

  private async runSync(mode: GitHubSyncMode, limit: number): Promise<void> {
    const startedAt = this.progress.startedAt ?? new Date().toISOString();
    const errors: string[] = [];
    const warnings: string[] = [];
    let completeness: GitHubSnapshotCompleteness = "FAILED";

    try {
      await this.logger.log("INFO", "GITHUB", "GitHub sync started", {
        mode,
        account: this.config.githubUsername,
        authenticationMode: this.authenticationMode()
      });
      this.updateProgress("FETCHING_REPOSITORY_LIST");
      const previous = await this.state.getRepositories();
      const previousMap = new Map(previous.map((repository) => [repository.id, repository]));
      const selections = await this.state.getSelections();
      const list = await this.source.listRepositories({
        username: this.config.githubUsername,
        includePrivate: this.config.includePrivateRepositories,
        tokenConfigured: this.config.githubToken.trim().length > 0,
        limit,
        mode,
        signal: this.abortController?.signal ?? new AbortController().signal,
        previousRepositories: previousMap
      });
      warnings.push(...list.warnings);
      this.progress = {
        ...this.progress,
        repositoriesDiscovered: list.repositories.length,
        total: list.repositories.length
      };
      this.updateProgress("COMPARING_SNAPSHOTS");
      const projects = await this.getProjects();
      this.updateProgress("FETCHING_DETAILS");
      const synchronizedAt = new Date().toISOString();
      const current: DiscoveredRepository[] = [];

      for (const record of list.repositories) {
        if (this.abortController?.signal.aborted) {
          completeness = "CANCELLED";
          warnings.push(
            "Synchronization cancelled after preserving completed repository snapshots."
          );
          break;
        }
        this.progress = { ...this.progress, currentRepository: record.full_name };
        try {
          const previousRepository = previousMap.get(String(record.id));
          const selection =
            selections[String(record.id)] ??
            previousRepository?.selection ??
            defaultSelection(String(record.id), false, synchronizedAt);
          const unchangedForIncremental =
            mode === "INCREMENTAL" &&
            previousRepository &&
            previousRepository.updatedAt === normalizeDate(record.updated_at) &&
            previousRepository.pushedAt === normalizeDate(record.pushed_at) &&
            previousRepository.defaultBranch === record.default_branch &&
            previousRepository.visibility === visibility(record) &&
            previousRepository.isArchived === record.archived;
          if (unchangedForIncremental) {
            const unchanged = {
              ...previousRepository,
              lastSynchronizedAt: synchronizedAt,
              selection
            };
            current.push({ ...unchanged, changeSet: detectChangeSet(unchanged, unchanged) });
            this.progress = {
              ...this.progress,
              skippedUnchanged: this.progress.skippedUnchanged + 1,
              completed: this.progress.completed + 1
            };
            continue;
          }
          this.updateProgress("FETCHING_READMES");
          const identifier = {
            id: String(record.id),
            owner: record.owner.login,
            name: record.name
          };
          const [readme, languages, latestCommitSha] = await Promise.all([
            this.source.getReadme(
              identifier,
              this.abortController?.signal ?? new AbortController().signal
            ),
            this.source.getLanguages(
              identifier,
              this.abortController?.signal ?? new AbortController().signal
            ),
            this.source.getLatestCommitSha(
              identifier,
              record.default_branch,
              this.abortController?.signal ?? new AbortController().signal
            )
          ]);
          this.progress = {
            ...this.progress,
            readmesFetched: this.progress.readmesFetched + 1,
            languagesFetched: this.progress.languagesFetched + 1
          };
          current.push(
            mapGitHubRepository(
              record,
              this.config.githubUsername,
              previousRepository,
              selection,
              projects,
              readme,
              languages,
              latestCommitSha,
              synchronizedAt
            )
          );
          this.progress = { ...this.progress, completed: this.progress.completed + 1 };
        } catch (error) {
          errors.push(
            `${record.full_name}: ${error instanceof Error ? error.message : "Repository sync failed."}`
          );
          this.progress = { ...this.progress, failed: this.progress.failed + 1 };
        }
      }

      const seen = new Set(current.map((repository) => repository.id));
      if (list.complete && errors.length === 0 && !this.abortController?.signal.aborted) {
        for (const repository of previous) {
          if (!seen.has(repository.id)) {
            current.push(unavailableRepository(repository, synchronizedAt));
          }
        }
      } else {
        for (const repository of previous) {
          if (!seen.has(repository.id)) {
            current.push(repository);
          }
        }
      }

      completeness = this.abortController?.signal.aborted
        ? "CANCELLED"
        : list.complete && errors.length === 0
          ? "COMPLETE"
          : "PARTIAL";
      this.updateProgress("PERSISTING_RESULTS");
      await this.state.saveRepositories(current);
      await this.state.saveSelections(
        Object.fromEntries(current.map((repository) => [repository.id, repository.selection]))
      );
      this.updateProgress("FINALIZING");
      const finishedAt = new Date().toISOString();
      this.progress = {
        ...this.progress,
        running: false,
        phase:
          completeness === "CANCELLED" ? "CANCELLED" : errors.length > 0 ? "FAILED" : "COMPLETED",
        snapshotCompleteness: completeness,
        finishedAt,
        elapsedMs: Date.parse(finishedAt) - Date.parse(startedAt),
        warnings,
        errors
      };
      await this.persistProgress(
        { warnings, errors, snapshotCompleteness: completeness },
        startedAt,
        mode
      );
      await this.logger.log(
        errors.length > 0 ? "WARN" : "INFO",
        "GITHUB",
        "GitHub sync completed",
        {
          mode,
          completeness,
          repositories: current.length,
          errors: errors.length
        }
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "GitHub synchronization failed.";
      const finishedAt = new Date().toISOString();
      this.progress = {
        ...this.progress,
        running: false,
        phase: this.abortController?.signal.aborted ? "CANCELLED" : "FAILED",
        snapshotCompleteness: this.abortController?.signal.aborted ? "CANCELLED" : completeness,
        finishedAt,
        elapsedMs: Date.parse(finishedAt) - Date.parse(startedAt),
        errors: [...errors, message],
        warnings
      };
      await this.persistProgress(
        {
          warnings,
          errors: [...errors, message],
          snapshotCompleteness: this.progress.snapshotCompleteness
        },
        startedAt,
        mode
      );
      await this.logger.log("ERROR", "GITHUB", "GitHub sync failed", { mode, message });
    }
  }

  private async persistProgress(
    result: {
      warnings: string[];
      errors: string[];
      snapshotCompleteness: GitHubSnapshotCompleteness | null;
    },
    startedAt: string,
    mode: GitHubSyncMode
  ): Promise<void> {
    const repositories = await this.state.getRepositories();
    const current = await this.currentState();
    await this.state.saveSyncState({
      ...current,
      lastAttemptedSyncAt: startedAt,
      lastSuccessfulCompleteSyncAt:
        result.snapshotCompleteness === "COMPLETE"
          ? this.progress.finishedAt
          : current.lastSuccessfulCompleteSyncAt,
      lastSyncMode: mode,
      snapshotCompleteness: result.snapshotCompleteness,
      authenticationMode: this.authenticationMode(),
      account: this.config.githubUsername,
      rateLimit: await this.source.getRateLimit(),
      counts: summarizeRepositories(repositories),
      warnings: result.warnings,
      errors: result.errors,
      progress: this.progressSnapshot()
    });
  }

  private updateProgress(phase: GitHubSyncProgress["phase"]): void {
    this.progress = { ...this.progress, phase, elapsedMs: elapsed(this.progress.startedAt) };
  }

  private progressSnapshot(): GitHubSyncProgress {
    return { ...this.progress, elapsedMs: elapsed(this.progress.startedAt) };
  }

  private async currentState(): Promise<GitHubSyncState> {
    return this.state.getSyncState(this.config.githubUsername, this.authenticationMode());
  }

  private authenticationMode(): GitHubAuthenticationMode {
    return this.config.githubToken.trim().length > 0 ? "TOKEN" : "ANONYMOUS";
  }

  private async saveSelectionsAndRepositories(repositories: DiscoveredRepository[]): Promise<void> {
    await this.state.saveRepositories(repositories);
    await this.state.saveSelections(
      Object.fromEntries(repositories.map((repository) => [repository.id, repository.selection]))
    );
  }

  private async getProjects(): Promise<Project[]> {
    const detail = await this.content.inspectDetail("projects");
    return Array.isArray(detail.json) ? (detail.json as Project[]) : [];
  }
}

function authenticationState(
  state: GitHubSyncState,
  tokenConfigured: boolean
): GitHubAuthenticationState {
  if (state.errors.some((error) => error.includes("authentication"))) {
    return "AUTHENTICATION_FAILED";
  }
  if (state.errors.some((error) => error.includes("permission"))) {
    return "INSUFFICIENT_PERMISSIONS";
  }
  if (state.errors.some((error) => error.includes("rate limit"))) {
    return "RATE_LIMITED";
  }
  return tokenConfigured ? "AUTHENTICATED" : "ANONYMOUS";
}

function elapsed(startedAt: string | null): number {
  return startedAt ? Math.max(0, Date.now() - Date.parse(startedAt)) : 0;
}

function normalizeDate(value: string | null): string | null {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
}

function visibility(record: GitHubRepositoryApiRecord) {
  return record.private ? "PRIVATE" : record.visibility === "internal" ? "INTERNAL" : "PUBLIC";
}

function applyFilters(
  repositories: DiscoveredRepository[],
  query: GitHubRepositoryQuery
): DiscoveredRepository[] {
  return repositories.filter((repository) => {
    const search = query.search?.trim().toLowerCase();
    return (
      (!search ||
        repository.fullName.toLowerCase().includes(search) ||
        (repository.description ?? "").toLowerCase().includes(search) ||
        repository.topics.some((topic) => topic.toLowerCase().includes(search))) &&
      (query.selection === "all" ||
        (query.selection === "selected" && repository.selection.selectedForProcessing) ||
        (query.selection === "unselected" && !repository.selection.selectedForProcessing)) &&
      (query.changeState === "ALL" || repository.changeSet.state === query.changeState) &&
      (query.visibility === "ALL" || repository.visibility === query.visibility) &&
      (query.readmeStatus === "ALL" || repository.readme.status === query.readmeStatus) &&
      (!query.language ||
        repository.languages.some((language) => language.name === query.language)) &&
      (query.archived === undefined || repository.isArchived === query.archived) &&
      matchesType(repository, query.repositoryType)
    );
  });
}

function matchesType(
  repository: DiscoveredRepository,
  type: GitHubRepositoryQuery["repositoryType"]
): boolean {
  switch (type) {
    case "OWNED":
      return repository.isOwnedByConfiguredUser;
    case "FORK":
      return repository.isFork;
    case "ARCHIVED":
      return repository.isArchived;
    case "TEMPLATE":
      return repository.isTemplate;
    case "MIRROR":
      return repository.isMirror;
    case "EMPTY":
      return repository.isEmpty;
    case "INACCESSIBLE":
      return repository.changeSet.flags.becameUnavailable;
    default:
      return true;
  }
}

function applySorting(
  repositories: DiscoveredRepository[],
  query: GitHubRepositoryQuery
): DiscoveredRepository[] {
  return [...repositories].sort((left, right) => {
    const direction = query.direction === "asc" ? 1 : -1;
    const compared = compareRepository(left, right, query.sort);
    return compared === 0 ? left.fullName.localeCompare(right.fullName) : compared * direction;
  });
}

function compareRepository(
  left: DiscoveredRepository,
  right: DiscoveredRepository,
  sort: GitHubRepositoryQuery["sort"]
): number {
  switch (sort) {
    case "name":
      return left.fullName.localeCompare(right.fullName);
    case "synchronized":
      return dateValue(left.lastSynchronizedAt) - dateValue(right.lastSynchronizedAt);
    case "stars":
      return left.stargazerCount - right.stargazerCount;
    case "change":
      return left.changeSet.state.localeCompare(right.changeSet.state);
    case "manualOrder":
      return (
        (left.selection.manualOrder ?? Number.MAX_SAFE_INTEGER) -
        (right.selection.manualOrder ?? Number.MAX_SAFE_INTEGER)
      );
    default:
      return dateValue(left.pushedAt) - dateValue(right.pushedAt);
  }
}

function dateValue(value: string | null): number {
  return value ? Date.parse(value) || 0 : 0;
}

function targetRepositories(
  repositories: DiscoveredRepository[],
  request: GitHubBulkSelectionRequest
): DiscoveredRepository[] {
  switch (request.operation) {
    case "SELECT_VISIBLE":
    case "DESELECT_VISIBLE":
      return applyFilters(repositories, githubRepositoryQuerySchema.parse(request.query ?? {}));
    case "SELECT_OWNED_NON_ARCHIVED":
      return repositories.filter(
        (repository) =>
          repository.isOwnedByConfiguredUser && !repository.isArchived && !repository.isEmpty
      );
    case "SELECT_NEW":
      return repositories.filter((repository) => repository.changeSet.flags.isNew);
    case "SELECT_CHANGED":
      return repositories.filter((repository) => repository.changeSet.state !== "UNCHANGED");
    case "CLEAR_INACCESSIBLE":
      return repositories.filter((repository) => repository.changeSet.flags.becameUnavailable);
    case "DESELECT_ALL":
      return repositories;
  }
}

function mutateSelection(
  selection: RepositorySelection,
  operation: GitHubBulkSelectionRequest["operation"],
  timestamp: string
): RepositorySelection {
  const selected =
    operation === "SELECT_VISIBLE" ||
    operation === "SELECT_OWNED_NON_ARCHIVED" ||
    operation === "SELECT_NEW" ||
    operation === "SELECT_CHANGED";
  return {
    ...selection,
    selectedForProcessing:
      operation === "CLEAR_INACCESSIBLE" ||
      operation === "DESELECT_ALL" ||
      operation === "DESELECT_VISIBLE"
        ? false
        : selected,
    selectionUpdatedAt: timestamp,
    selectionSource: "BULK"
  };
}
