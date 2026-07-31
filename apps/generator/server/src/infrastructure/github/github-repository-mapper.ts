import { createHash } from "node:crypto";
import type {
  DiscoveredRepository,
  Project,
  RepositoryReadme,
  RepositorySelection
} from "@muneeb-systems/shared-types";
import type { GitHubRepositoryApiRecord } from "./github-types.js";

export function mapGitHubRepository(
  record: GitHubRepositoryApiRecord,
  configuredUsername: string,
  previous: DiscoveredRepository | undefined,
  selection: RepositorySelection,
  projects: Project[],
  readme = emptyReadme(),
  languages = previous?.languages ?? [],
  latestCommitSha = previous?.latestCommitSha ?? null,
  synchronizedAt = new Date().toISOString()
): DiscoveredRepository {
  const owner = record.owner.login;
  const visibility = record.private
    ? "PRIVATE"
    : record.visibility === "internal"
      ? "INTERNAL"
      : "PUBLIC";
  const previousFullNames =
    previous && previous.fullName !== record.full_name
      ? [...new Set([...previous.previousFullNames, previous.fullName])]
      : (previous?.previousFullNames ?? []);
  const primaryLanguage = languages[0]?.name ?? record.language ?? null;
  const base = {
    id: String(record.id),
    nodeId: record.node_id ?? null,
    name: record.name,
    fullName: record.full_name,
    previousFullNames,
    owner,
    description: record.description,
    homepageUrl: normalizeNullableUrl(record.homepage),
    htmlUrl: record.html_url,
    cloneUrl: record.clone_url,
    sshUrl: record.ssh_url,
    defaultBranch: record.default_branch,
    visibility,
    isPrivate: record.private,
    isFork: record.fork,
    isArchived: record.archived,
    isDisabled: record.disabled,
    isTemplate: Boolean(record.is_template),
    isMirror: Boolean(record.mirror_url),
    isEmpty: record.size === 0,
    isOwnedByConfiguredUser: owner.toLowerCase() === configuredUsername.toLowerCase(),
    forkParent: record.parent?.full_name ?? null,
    createdAt: normalizeDate(record.created_at),
    updatedAt: normalizeDate(record.updated_at),
    pushedAt: normalizeDate(record.pushed_at),
    unavailableSince: null,
    sizeKb: Math.max(0, record.size),
    stargazerCount: Math.max(0, record.stargazers_count),
    watcherCount: Math.max(0, record.watchers_count),
    forkCount: Math.max(0, record.forks_count),
    openIssueCount: Math.max(0, record.open_issues_count),
    primaryLanguage,
    languages,
    topics: [...new Set(record.topics ?? [])].sort((a, b) => a.localeCompare(b)),
    license: record.license?.spdx_id ?? record.license?.name ?? null,
    readme,
    defaultBranchSha: latestCommitSha,
    latestCommitSha,
    discoveredAt: previous?.discoveredAt ?? synchronizedAt,
    lastSynchronizedAt: synchronizedAt,
    selection,
    mapping: mapPortfolioProject(record, projects),
    warnings: repositoryWarnings(record),
    errors: [] as string[]
  };
  const repositorySnapshotHash = snapshotHash(base);
  const next = { ...base, repositorySnapshotHash } as DiscoveredRepository;
  return { ...next, changeSet: detectChangeSet(previous, next) };
}

export function unavailableRepository(
  previous: DiscoveredRepository,
  timestamp: string
): DiscoveredRepository {
  return {
    ...previous,
    unavailableSince: previous.unavailableSince ?? timestamp,
    lastSynchronizedAt: timestamp,
    selection: {
      ...previous.selection,
      selectedForProcessing: false,
      selectionUpdatedAt: timestamp,
      selectionSource: "SYSTEM"
    },
    warnings: [...previous.warnings, "NO LONGER ACCESSIBLE IN THE LATEST COMPLETE SYNC"],
    changeSet: {
      state: "DELETED_OR_INACCESSIBLE",
      flags: {
        isNew: false,
        sourceChanged: false,
        readmeChanged: false,
        metadataChanged: false,
        visibilityChanged: false,
        archiveStateChanged: false,
        becameUnavailable: true
      },
      messages: ["NO LONGER ACCESSIBLE IN THE LATEST COMPLETE SYNC"]
    }
  };
}

export function defaultSelection(
  repositoryId: string,
  selected: boolean,
  timestamp: string
): RepositorySelection {
  return {
    repositoryId,
    selectedForProcessing: selected,
    selectedForPortfolio: false,
    featuredCandidate: false,
    hidden: false,
    manualOrder: null,
    selectionUpdatedAt: timestamp,
    selectionSource: "DEFAULT",
    notes: ""
  };
}

export function detectChangeSet(
  previous: DiscoveredRepository | undefined,
  next: DiscoveredRepository
) {
  if (!previous) {
    return {
      state: "NEW" as const,
      flags: {
        isNew: true,
        sourceChanged: false,
        readmeChanged: false,
        metadataChanged: false,
        visibilityChanged: false,
        archiveStateChanged: false,
        becameUnavailable: false
      },
      messages: ["New repository in local snapshot."]
    };
  }

  const sourceChanged = previous.latestCommitSha !== next.latestCommitSha;
  const readmeChanged =
    previous.readme.sha !== next.readme.sha || previous.readme.hash !== next.readme.hash;
  const visibilityChanged = previous.visibility !== next.visibility;
  const archiveStateChanged = previous.isArchived !== next.isArchived;
  const metadataChanged =
    previous.repositorySnapshotHash !== next.repositorySnapshotHash &&
    !sourceChanged &&
    !readmeChanged &&
    !visibilityChanged &&
    !archiveStateChanged;

  const messages: string[] = [];
  if (sourceChanged) messages.push("Default branch source changed.");
  if (readmeChanged) messages.push("README changed.");
  if (visibilityChanged) messages.push("Visibility changed.");
  if (archiveStateChanged)
    messages.push(next.isArchived ? "Repository archived." : "Repository unarchived.");
  if (metadataChanged) messages.push("Repository metadata changed.");

  return {
    state: stateFor(
      { sourceChanged, readmeChanged, visibilityChanged, archiveStateChanged, metadataChanged },
      next
    ),
    flags: {
      isNew: false,
      sourceChanged,
      readmeChanged,
      metadataChanged,
      visibilityChanged,
      archiveStateChanged,
      becameUnavailable: false
    },
    messages
  };
}

function stateFor(
  flags: {
    sourceChanged: boolean;
    readmeChanged: boolean;
    visibilityChanged: boolean;
    archiveStateChanged: boolean;
    metadataChanged: boolean;
  },
  next: DiscoveredRepository
) {
  if (flags.visibilityChanged) return "VISIBILITY_CHANGED" as const;
  if (flags.archiveStateChanged)
    return next.isArchived ? ("ARCHIVED" as const) : ("UNARCHIVED" as const);
  if (flags.sourceChanged) return "SOURCE_CHANGED" as const;
  if (flags.readmeChanged) return "README_CHANGED" as const;
  if (flags.metadataChanged) return "METADATA_CHANGED" as const;
  return "UNCHANGED" as const;
}

function snapshotHash(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(value, stableKeys)).digest("hex");
}

function stableKeys(_key: string, value: unknown): unknown {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return Object.fromEntries(
      Object.entries(value).sort(([left], [right]) => left.localeCompare(right))
    );
  }
  return value;
}

function emptyReadme(): RepositoryReadme {
  return {
    status: "MISSING" as const,
    path: null,
    sha: null,
    hash: null,
    sizeBytes: 0,
    content: null,
    truncated: false,
    fetchedAt: null,
    warning: null
  };
}

function normalizeNullableUrl(value: string | null): string | null {
  if (!value || value.trim().length === 0) {
    return null;
  }
  return value;
}

function normalizeDate(value: string | null): string | null {
  return value && !Number.isNaN(Date.parse(value)) ? new Date(value).toISOString() : null;
}

function repositoryWarnings(record: GitHubRepositoryApiRecord): string[] {
  return [
    record.fork ? "Forks are not selected by default." : null,
    record.archived ? "Archived repositories are not selected by default." : null,
    record.size === 0 ? "Empty repositories are not selected by default." : null,
    record.is_template ? "Template repositories require explicit selection." : null,
    record.mirror_url ? "Mirror repositories are not selected by default." : null
  ].filter((value): value is string => Boolean(value));
}

function mapPortfolioProject(record: GitHubRepositoryApiRecord, projects: Project[]) {
  const matches = projects.filter((project) =>
    project.links.some((link) => link.url.toLowerCase().includes(record.full_name.toLowerCase()))
  );
  if (matches.length === 1) {
    return {
      status: "MATCHED" as const,
      projectSlug: matches[0]?.slug ?? null,
      confidence: 1,
      reason: "Existing project links to this repository."
    };
  }
  if (matches.length > 1) {
    return {
      status: "CONFLICT" as const,
      projectSlug: null,
      confidence: 0.5,
      reason: "Multiple public projects link to similar repository URLs."
    };
  }
  const bySlug = projects.find((project) => project.slug?.includes(record.name.toLowerCase()));
  if (bySlug) {
    return {
      status: "POSSIBLE_MATCH" as const,
      projectSlug: bySlug.slug,
      confidence: 0.45,
      reason: "Repository name resembles an existing project slug."
    };
  }
  return {
    status: "UNMATCHED" as const,
    projectSlug: null,
    confidence: 0,
    reason: "No public project mapping found."
  };
}
