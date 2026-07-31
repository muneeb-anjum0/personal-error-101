import type {
  DiscoveredRepository,
  GitHubAuthenticationMode,
  GitHubRateLimitStatus,
  GitHubSnapshotCompleteness,
  GitHubSyncMode,
  GitHubSyncProgress,
  RepositoryLanguage,
  RepositoryReadme
} from "@muneeb-systems/shared-types";

export interface RepositoryIdentifier {
  owner: string;
  name: string;
  id: string;
}

export interface RepositoryDiscoveryOptions {
  username: string;
  includePrivate: boolean;
  tokenConfigured: boolean;
  limit: number;
  mode: GitHubSyncMode;
  signal: AbortSignal;
  previousRepositories: Map<string, DiscoveredRepository>;
}

export interface GitHubRepositorySource {
  listRepositories(options: RepositoryDiscoveryOptions): Promise<GitHubListResult>;
  getReadme(repository: RepositoryIdentifier, signal: AbortSignal): Promise<RepositoryReadme>;
  getLanguages(
    repository: RepositoryIdentifier,
    signal: AbortSignal
  ): Promise<RepositoryLanguage[]>;
  getLatestCommitSha(
    repository: RepositoryIdentifier,
    branch: string | null,
    signal: AbortSignal
  ): Promise<string | null>;
  getRateLimit(): Promise<GitHubRateLimitStatus>;
}

export interface GitHubListResult {
  repositories: GitHubRepositoryApiRecord[];
  complete: boolean;
  warnings: string[];
}

export interface GitHubRepositoryApiRecord {
  id: number;
  node_id?: string;
  name: string;
  full_name: string;
  owner: { login: string };
  description: string | null;
  homepage: string | null;
  html_url: string;
  clone_url: string;
  ssh_url: string;
  default_branch: string | null;
  visibility?: "public" | "private" | "internal";
  private: boolean;
  fork: boolean;
  archived: boolean;
  disabled: boolean;
  is_template?: boolean;
  mirror_url?: string | null;
  size: number;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  topics?: string[];
  license?: { spdx_id?: string; name?: string } | null;
  created_at: string | null;
  updated_at: string | null;
  pushed_at: string | null;
  parent?: { full_name: string } | null;
}

export interface GitHubSyncState {
  schemaVersion: 1;
  lastAttemptedSyncAt: string | null;
  lastSuccessfulCompleteSyncAt: string | null;
  lastSyncMode: GitHubSyncMode | null;
  account: string;
  authenticationMode: GitHubAuthenticationMode;
  snapshotCompleteness: GitHubSnapshotCompleteness | null;
  rateLimit: GitHubRateLimitStatus;
  counts: {
    total: number;
    selectedForProcessing: number;
    selectedForPortfolio: number;
    newRepositories: number;
    changedRepositories: number;
    inaccessibleRepositories: number;
    privateRepositories: number;
    publicRepositories: number;
  };
  warnings: string[];
  errors: string[];
  progress: GitHubSyncProgress;
}

export interface GitHubPersistedSelections {
  schemaVersion: 1;
  selections: Record<string, DiscoveredRepository["selection"]>;
}

export interface GitHubPersistedRepositories {
  schemaVersion: 1;
  repositories: DiscoveredRepository[];
}
