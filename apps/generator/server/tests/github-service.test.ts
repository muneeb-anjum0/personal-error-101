import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type {
  GitHubRateLimitStatus,
  RepositoryLanguage,
  RepositoryReadme
} from "@muneeb-systems/shared-types";
import type { GeneratorAppConfig } from "../src/config/app-config";
import { GitHubService } from "../src/application/services/github-service";
import { ContentStatusService } from "../src/application/services/content-status-service";
import { StaticContentInspector } from "../src/infrastructure/filesystem/static-content-inspector";
import { JsonGitHubStateRepository } from "../src/infrastructure/github/json-github-state-repository";
import { ApplicationLogger } from "../src/infrastructure/logging/application-logger";
import { detectChangeSet } from "../src/infrastructure/github/github-repository-mapper";
import { parseNextLink } from "../src/infrastructure/github/github-pagination";
import { sanitizeGitHubError } from "../src/infrastructure/github/github-error-mapper";
import type {
  GitHubListResult,
  GitHubRepositoryApiRecord,
  GitHubRepositorySource,
  RepositoryDiscoveryOptions,
  RepositoryIdentifier
} from "../src/infrastructure/github/github-types";

describe("GitHub synchronization service", () => {
  it("runs full sync, normalizes repositories, persists selections, and supports incremental unchanged detection", async () => {
    const harness = await createHarness(
      new FakeSource([repositoryRecord({ pushed_at: "2026-01-02T00:00:00Z" })])
    );

    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    const full = await harness.service.getRepositories({});

    expect(full.total).toBe(1);
    expect(full.items[0]).toMatchObject({
      id: "101",
      fullName: "muneeb-anjum0/personal-error-101",
      visibility: "PUBLIC",
      readme: { status: "AVAILABLE" },
      primaryLanguage: "TypeScript",
      mapping: { status: "MATCHED" },
      changeSet: { state: "NEW" }
    });

    await harness.service.updateSelection("101", {
      selectedForProcessing: true,
      selectedForPortfolio: true,
      notes: "Needs screenshot review."
    });
    await harness.service.startSync("INCREMENTAL", {});
    await waitForSync(harness.service);
    const incremental = await harness.service.getRepository("101");

    expect(incremental.changeSet.state).toBe("UNCHANGED");
    expect(incremental.selection).toMatchObject({
      selectedForProcessing: true,
      selectedForPortfolio: true,
      notes: "Needs screenshot review."
    });

    await rm(harness.root, { recursive: true, force: true });
  });

  it("detects source, README, visibility, archive, rename, and inaccessible changes deterministically", async () => {
    const harness = await createHarness(
      new FakeSource([repositoryRecord({ pushed_at: "2026-01-02T00:00:00Z" })])
    );
    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);

    harness.source.records = [
      repositoryRecord({
        name: "renamed-error-101",
        full_name: "muneeb-anjum0/renamed-error-101",
        private: true,
        visibility: "private",
        archived: true,
        pushed_at: "2026-01-03T00:00:00Z"
      })
    ];
    harness.source.readmeSha = "readme-v2";
    harness.source.commitSha = "commit-v2";
    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    const renamed = await harness.service.getRepository("101");

    expect(renamed.previousFullNames).toContain("muneeb-anjum0/personal-error-101");
    expect(renamed.changeSet.flags).toMatchObject({
      sourceChanged: true,
      readmeChanged: true,
      visibilityChanged: true,
      archiveStateChanged: true
    });

    harness.source.records = [];
    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    const inaccessible = await harness.service.getRepository("101");
    expect(inaccessible.changeSet.state).toBe("DELETED_OR_INACCESSIBLE");
    expect(inaccessible.selection.selectedForProcessing).toBe(false);

    await rm(harness.root, { recursive: true, force: true });
  });

  it("supports cancellation, bulk selection, notes, filtering, sorting, pagination parsing, and token redaction", async () => {
    const harness = await createHarness(
      new FakeSource([
        repositoryRecord({ id: 101, name: "alpha", full_name: "muneeb-anjum0/alpha" }),
        repositoryRecord({
          id: 102,
          name: "beta",
          full_name: "muneeb-anjum0/beta",
          fork: true,
          language: "Go"
        })
      ])
    );

    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    const selected = await harness.service.bulkSelection({
      operation: "SELECT_VISIBLE",
      query: { search: "alpha" }
    });
    expect(selected.affected).toBe(1);

    await harness.service.updateNotes("101", { notes: "Local-only note." });
    const filtered = await harness.service.getRepositories({
      search: "alpha",
      sort: "name",
      direction: "asc",
      limit: 1
    });
    expect(filtered.items).toHaveLength(1);
    const filteredRepository = filtered.items[0];
    expect(filteredRepository).toBeDefined();
    if (!filteredRepository) {
      throw new Error("expected filtered repository");
    }
    expect(filteredRepository.selection.notes).toBe("Local-only note.");

    expect(parseNextLink('<https://api.github.com/user/repos?page=2>; rel="next"')).toContain(
      "page=2"
    );
    expect(sanitizeGitHubError(new Error("bad ghp_secretvalue"))).toBe("bad [REDACTED_TOKEN]");

    const unchanged = detectChangeSet(filteredRepository, filteredRepository);
    expect(unchanged.state).toBe("UNCHANGED");

    await rm(harness.root, { recursive: true, force: true });
  });

  it("does not mark repositories inaccessible when detail failures make a sync partial", async () => {
    const source = new FakeSource([
      repositoryRecord({ id: 101, name: "alpha", full_name: "muneeb-anjum0/alpha" }),
      repositoryRecord({ id: 102, name: "beta", full_name: "muneeb-anjum0/beta" })
    ]);
    const harness = await createHarness(source);

    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    source.records = [
      repositoryRecord({ id: 101, name: "alpha", full_name: "muneeb-anjum0/alpha" })
    ];
    source.failReadmeIds.add("101");

    await harness.service.startSync("FULL", {});
    await waitForSync(harness.service);
    const repositories = await harness.service.getRepositories({ limit: 100 });

    expect(repositories.items).toHaveLength(2);
    expect(
      repositories.items.some((repository) => repository.changeSet.flags.becameUnavailable)
    ).toBe(false);

    await rm(harness.root, { recursive: true, force: true });
  });
});

async function createHarness(source: FakeSource) {
  const root = await mkdtemp(path.join(os.tmpdir(), "github-sync-"));
  const dataDirectory = path.join(root, "data");
  await mkdir(dataDirectory, { recursive: true });
  await writeFile(
    path.join(dataDirectory, "projects.json"),
    JSON.stringify([
      {
        slug: "personal-error-101",
        title: "Personal Error 101",
        shortDescription: "Portfolio system",
        description: "Portfolio system",
        category: "platform",
        status: "active",
        technologies: [],
        highlights: [],
        links: [{ label: "GitHub", url: "https://github.com/muneeb-anjum0/personal-error-101" }],
        featured: true,
        source: "manual",
        starter: { prompt: "test" }
      }
    ]),
    "utf8"
  );
  const config: GeneratorAppConfig = {
    host: "127.0.0.1",
    port: 4000,
    corsOrigins: [],
    version: "0.0.0",
    phase: "phase-5-local-ai-runtime-queue",
    environment: "test",
    repositoryRoot: root,
    dataDirectory,
    logDirectory: path.join(dataDirectory, "logs"),
    settingsPath: path.join(dataDirectory, "generator-settings.json"),
    settingsBackupDirectory: path.join(dataDirectory, "backups", "settings"),
    githubStateDirectory: path.join(dataDirectory, "github"),
    githubRepositoriesPath: path.join(dataDirectory, "github", "repositories.json"),
    githubSyncStatePath: path.join(dataDirectory, "github", "sync-state.json"),
    githubSelectionsPath: path.join(dataDirectory, "github", "selections.json"),
    githubHistoryDirectory: path.join(dataDirectory, "github", "history"),
    githubBackupDirectory: path.join(dataDirectory, "github", "backups"),
    aiStateDirectory: path.join(dataDirectory, "ai"),
    aiRuntimeStatePath: path.join(dataDirectory, "ai", "runtime-state.json"),
    aiQueuePath: path.join(dataDirectory, "ai", "queue.json"),
    aiQueueEventsPath: path.join(dataDirectory, "ai", "queue-events.jsonl"),
    aiDraftDirectory: path.join(dataDirectory, "ai", "drafts"),
    aiCheckpointDirectory: path.join(dataDirectory, "ai", "checkpoints"),
    aiBackupDirectory: path.join(dataDirectory, "ai", "backups"),
    aiLogDirectory: path.join(dataDirectory, "ai", "logs"),
    reviewDirectory: path.join(dataDirectory, "review"),
    reviewStatePath: path.join(dataDirectory, "review", "reviews.json"),
    reviewApprovalsPath: path.join(dataDirectory, "review", "approvals.json"),
    reviewRejectionsPath: path.join(dataDirectory, "review", "rejections.json"),
    reviewAuditPath: path.join(dataDirectory, "review", "audit-events.jsonl"),
    reviewRevisionDirectory: path.join(dataDirectory, "review", "revisions"),
    reviewBackupDirectory: path.join(dataDirectory, "review", "backups"),
    stagedDirectory: path.join(dataDirectory, "staged"),
    stagedMetadataPath: path.join(dataDirectory, "staged", "metadata.json"),
    stagedBackupDirectory: path.join(dataDirectory, "staged", "backups"),
    previewDirectory: path.join(dataDirectory, "preview"),
    previewSessionsDirectory: path.join(dataDirectory, "preview", "sessions"),
    previewCurrentPath: path.join(dataDirectory, "preview", "current.json"),
    publishingDirectory: path.join(dataDirectory, "publishing"),
    publishingBundlesDirectory: path.join(dataDirectory, "publishing", "bundles"),
    publishingCurrentPath: path.join(dataDirectory, "publishing", "current.json"),
    publishingDiffDirectory: path.join(dataDirectory, "publishing", "diffs"),
    publishingBackupDirectory: path.join(dataDirectory, "publishing", "backups"),
    portfolioPath: path.join(root, "apps", "portfolio"),
    generatorUiPort: 4173,
    modelPath: "model.gguf",
    modelName: "model",
    modelBaseUrl: "http://localhost:8080/v1",
    aiHostBaseUrl: "http://127.0.0.1:8080/v1",
    aiApiKey: "local",
    aiContextSize: 8192,
    aiParallelRequests: 1,
    aiGpuLayers: 28,
    aiMaxVramGb: 5,
    aiServerPort: 8080,
    aiServerHost: "127.0.0.1",
    aiServerExecutable: "",
    aiRuntimeMode: "external",
    githubUsername: "muneeb-anjum0",
    includePrivateRepositories: false,
    githubToken: "",
    githubRepositoryLimit: 500,
    githubConcurrency: 3,
    githubConfigured: false,
    aiConfigured: true,
    serverStartedAt: new Date()
  };
  const content = new ContentStatusService(new StaticContentInspector(dataDirectory));
  const logger = new ApplicationLogger(config.logDirectory);
  const service = new GitHubService(
    config,
    new JsonGitHubStateRepository(config),
    content,
    logger,
    source
  );
  return { root, source, service };
}

async function waitForSync(service: GitHubService) {
  for (let index = 0; index < 100; index += 1) {
    if (!service.syncStatus().running) {
      await service.waitForActiveSync();
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  throw new Error("sync did not finish");
}

class FakeSource implements GitHubRepositorySource {
  public readmeSha = "readme-v1";
  public commitSha = "commit-v1";
  public failReadmeIds = new Set<string>();

  public constructor(public records: GitHubRepositoryApiRecord[]) {}

  public listRepositories(options: RepositoryDiscoveryOptions): Promise<GitHubListResult> {
    void options;
    return Promise.resolve({ repositories: this.records, complete: true, warnings: [] });
  }

  public getReadme(repository: RepositoryIdentifier): Promise<RepositoryReadme> {
    if (this.failReadmeIds.has(repository.id)) {
      return Promise.reject(new Error("README_FETCH_FAILED"));
    }
    const content = `# ${this.readmeSha}\n\n<script>alert('x')</script>`;
    return Promise.resolve({
      status: "AVAILABLE",
      path: "README.md",
      sha: this.readmeSha,
      hash: this.readmeSha,
      sizeBytes: content.length,
      content,
      truncated: false,
      fetchedAt: new Date().toISOString(),
      warning: null
    });
  }

  public getLanguages(): Promise<RepositoryLanguage[]> {
    return Promise.resolve([
      { name: "TypeScript", bytes: 900, percentage: 90 },
      { name: "CSS", bytes: 100, percentage: 10 }
    ]);
  }

  public getLatestCommitSha(): Promise<string | null> {
    return Promise.resolve(this.commitSha);
  }

  public getRateLimit(): Promise<GitHubRateLimitStatus> {
    return Promise.resolve({
      limit: 60,
      remaining: 58,
      used: 2,
      resetAt: "2026-01-01T00:00:00.000Z",
      retryAfterSeconds: null,
      authenticationMode: "ANONYMOUS",
      lastUpdatedAt: "2026-01-01T00:00:00.000Z"
    });
  }
}

function repositoryRecord(
  overrides: Partial<GitHubRepositoryApiRecord> = {}
): GitHubRepositoryApiRecord {
  return {
    id: 101,
    node_id: "node-101",
    name: "personal-error-101",
    full_name: "muneeb-anjum0/personal-error-101",
    owner: { login: "muneeb-anjum0" },
    description: "Portfolio platform",
    homepage: null,
    html_url: "https://github.com/muneeb-anjum0/personal-error-101",
    clone_url: "https://github.com/muneeb-anjum0/personal-error-101.git",
    ssh_url: "git@github.com:muneeb-anjum0/personal-error-101.git",
    default_branch: "main",
    visibility: "public",
    private: false,
    fork: false,
    archived: false,
    disabled: false,
    is_template: false,
    mirror_url: null,
    size: 100,
    stargazers_count: 3,
    watchers_count: 3,
    forks_count: 1,
    open_issues_count: 0,
    language: "TypeScript",
    topics: ["portfolio"],
    license: { spdx_id: "MIT" },
    created_at: "2025-01-01T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    pushed_at: "2026-01-02T00:00:00Z",
    parent: null,
    ...overrides
  };
}
