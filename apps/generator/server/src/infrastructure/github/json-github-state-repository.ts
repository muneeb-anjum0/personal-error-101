import { readFile } from "node:fs/promises";
import {
  discoveredRepositorySchema,
  githubRateLimitStatusSchema,
  githubSyncProgressSchema,
  repositorySelectionSchema
} from "@muneeb-systems/shared-schemas";
import type {
  DiscoveredRepository,
  GitHubAuthenticationMode,
  GitHubSnapshotCompleteness,
  GitHubSyncMode,
  GitHubSyncProgress,
  RepositorySelection
} from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../../config/app-config.js";
import { SafeFileWriter } from "../filesystem/safe-file-writer.js";
import type {
  GitHubPersistedRepositories,
  GitHubPersistedSelections,
  GitHubSyncState
} from "./github-types.js";

export class JsonGitHubStateRepository {
  private readonly writer: SafeFileWriter;

  public constructor(private readonly config: GeneratorAppConfig) {
    this.writer = new SafeFileWriter(config.dataDirectory);
  }

  public async getRepositories(): Promise<DiscoveredRepository[]> {
    try {
      const parsed = JSON.parse(
        await readFile(this.config.githubRepositoriesPath, "utf8")
      ) as GitHubPersistedRepositories;
      return discoveredRepositorySchema.array().parse(parsed.repositories ?? []);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  public async saveRepositories(repositories: DiscoveredRepository[]): Promise<void> {
    const sorted = [...repositories].sort((left, right) =>
      left.fullName.localeCompare(right.fullName)
    );
    await this.writer.writeJsonWithBackup(
      this.config.githubRepositoriesPath,
      { schemaVersion: 1, repositories: sorted },
      this.config.githubBackupDirectory,
      "repositories",
      10
    );
  }

  public async getSelections(): Promise<Record<string, RepositorySelection>> {
    try {
      const parsed = JSON.parse(
        await readFile(this.config.githubSelectionsPath, "utf8")
      ) as GitHubPersistedSelections;
      const selections = parsed.selections ?? {};
      return Object.fromEntries(
        Object.entries(selections).map(([id, selection]) => [
          id,
          repositorySelectionSchema.parse(selection)
        ])
      );
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return {};
      }
      throw error;
    }
  }

  public async saveSelections(selections: Record<string, RepositorySelection>): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.githubSelectionsPath,
      { schemaVersion: 1, selections },
      this.config.githubBackupDirectory,
      "selections",
      10
    );
  }

  public async getSyncState(
    account: string,
    mode: GitHubAuthenticationMode
  ): Promise<GitHubSyncState> {
    try {
      const parsed = JSON.parse(
        await readFile(this.config.githubSyncStatePath, "utf8")
      ) as GitHubSyncState;
      return {
        ...this.defaults(account, mode),
        ...parsed,
        rateLimit: githubRateLimitStatusSchema.parse(parsed.rateLimit),
        progress: githubSyncProgressSchema.parse(parsed.progress)
      };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        return this.defaults(account, mode);
      }
      throw error;
    }
  }

  public async saveSyncState(state: GitHubSyncState): Promise<void> {
    await this.writer.writeJsonWithBackup(
      this.config.githubSyncStatePath,
      state,
      this.config.githubBackupDirectory,
      "sync-state",
      10
    );
  }

  public progress(
    phase: GitHubSyncProgress["phase"],
    mode: GitHubSyncMode | null = null,
    startedAt: string | null = null
  ): GitHubSyncProgress {
    return {
      running:
        phase !== "IDLE" && phase !== "COMPLETED" && phase !== "FAILED" && phase !== "CANCELLED",
      mode,
      phase,
      currentRepository: null,
      repositoriesDiscovered: 0,
      readmesFetched: 0,
      languagesFetched: 0,
      completed: 0,
      failed: 0,
      skippedUnchanged: 0,
      total: null,
      elapsedMs: 0,
      cancellationRequested: false,
      snapshotCompleteness: null,
      startedAt,
      finishedAt: null,
      warnings: [],
      errors: []
    };
  }

  private defaults(account: string, authenticationMode: GitHubAuthenticationMode): GitHubSyncState {
    return {
      schemaVersion: 1,
      lastAttemptedSyncAt: null,
      lastSuccessfulCompleteSyncAt: null,
      lastSyncMode: null,
      account,
      authenticationMode,
      snapshotCompleteness: null,
      rateLimit: {
        limit: 0,
        remaining: 0,
        used: 0,
        resetAt: null,
        retryAfterSeconds: null,
        authenticationMode,
        lastUpdatedAt: null
      },
      counts: {
        total: 0,
        selectedForProcessing: 0,
        selectedForPortfolio: 0,
        newRepositories: 0,
        changedRepositories: 0,
        inaccessibleRepositories: 0,
        privateRepositories: 0,
        publicRepositories: 0
      },
      warnings: [],
      errors: [],
      progress: this.progress("IDLE")
    };
  }
}

export function summarizeRepositories(repositories: DiscoveredRepository[]) {
  return {
    total: repositories.length,
    selectedForProcessing: repositories.filter((item) => item.selection.selectedForProcessing)
      .length,
    selectedForPortfolio: repositories.filter((item) => item.selection.selectedForPortfolio).length,
    newRepositories: repositories.filter((item) => item.changeSet.flags.isNew).length,
    changedRepositories: repositories.filter(
      (item) =>
        item.changeSet.flags.sourceChanged ||
        item.changeSet.flags.readmeChanged ||
        item.changeSet.flags.metadataChanged ||
        item.changeSet.flags.visibilityChanged ||
        item.changeSet.flags.archiveStateChanged
    ).length,
    inaccessibleRepositories: repositories.filter((item) => item.changeSet.flags.becameUnavailable)
      .length,
    privateRepositories: repositories.filter((item) => item.isPrivate).length,
    publicRepositories: repositories.filter((item) => !item.isPrivate).length
  };
}

export function completenessFromError(error: unknown): GitHubSnapshotCompleteness {
  return error instanceof Error && error.name === "AbortError" ? "CANCELLED" : "FAILED";
}
