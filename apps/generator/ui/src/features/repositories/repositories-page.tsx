import { useEffect, useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import type {
  DiscoveredRepository,
  GitHubRepositoryQuery,
  GitHubSyncProgress,
  ProcessingJob
} from "@muneeb-systems/shared-types";
import { MetricCard } from "../../components/data-display/metric-card";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

const selectionOptions = ["all", "selected", "unselected"] as const;
const changeOptions = [
  "ALL",
  "NEW",
  "SOURCE_CHANGED",
  "README_CHANGED",
  "METADATA_CHANGED",
  "VISIBILITY_CHANGED",
  "ARCHIVED",
  "UNARCHIVED",
  "DELETED_OR_INACCESSIBLE",
  "SYNC_FAILED",
  "UNCHANGED"
] as const;
const typeOptions = [
  "ALL",
  "OWNED",
  "FORK",
  "ARCHIVED",
  "TEMPLATE",
  "MIRROR",
  "EMPTY",
  "INACCESSIBLE"
] as const;
const readmeOptions = [
  "ALL",
  "AVAILABLE",
  "MISSING",
  "EMPTY",
  "TOO_LARGE",
  "UNSUPPORTED_ENCODING",
  "FETCH_FAILED"
] as const;
const sortOptions = ["pushed", "name", "synchronized", "stars", "change", "manualOrder"] as const;

type RepositoryQueryState = {
  search: string;
  selection: string;
  changeState: string;
  repositoryType: string;
  readmeStatus: string;
  sort: string;
  direction: string;
  limit: string;
  offset: string;
};

export function RepositoriesPage() {
  const { notify } = useToast();
  const [query, setQuery] = useState<RepositoryQueryState>({
    search: "",
    selection: localStorage.getItem("github.selection") ?? "all",
    changeState: localStorage.getItem("github.changeState") ?? "ALL",
    repositoryType: localStorage.getItem("github.repositoryType") ?? "ALL",
    readmeStatus: localStorage.getItem("github.readmeStatus") ?? "ALL",
    sort: localStorage.getItem("github.sort") ?? "pushed",
    direction: localStorage.getItem("github.direction") ?? "desc",
    limit: "25",
    offset: "0"
  });
  const [selectedRepository, setSelectedRepository] = useState<DiscoveredRepository | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams(query);
    return `?${params.toString()}`;
  }, [query]);

  const status = useApiResource((signal) => generatorApiClient.githubStatus(signal), []);
  const repositories = useApiResource(
    (signal) => generatorApiClient.githubRepositories(queryString, signal),
    [queryString]
  );
  const queue = useApiResource((signal) => generatorApiClient.queue(signal), []);
  const sync = useApiResource((signal) => generatorApiClient.githubSyncStatus(signal), []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (sync.data?.running) {
        void sync.refresh();
        void repositories.refresh();
        void status.refresh();
        void queue.refresh();
      }
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue, repositories, status, sync]);

  useEffect(() => {
    localStorage.setItem("github.selection", query.selection);
    localStorage.setItem("github.changeState", query.changeState);
    localStorage.setItem("github.repositoryType", query.repositoryType);
    localStorage.setItem("github.readmeStatus", query.readmeStatus);
    localStorage.setItem("github.sort", query.sort);
    localStorage.setItem("github.direction", query.direction);
  }, [query]);

  async function runSync(full = false) {
    const response = full
      ? await generatorApiClient.fullSyncGithub()
      : await generatorApiClient.syncGithub();
    notify(full ? "Full GitHub synchronization started." : "GitHub synchronization started.");
    await sync.refresh();
    return response;
  }

  async function cancelSync() {
    await generatorApiClient.cancelGithubSync();
    notify("GitHub synchronization cancellation requested.");
    await sync.refresh();
  }

  async function toggleSelection(repository: DiscoveredRepository, selected: boolean) {
    await generatorApiClient.updateGithubSelection(repository.id, {
      selectedForProcessing: selected
    });
    notify(`${repository.fullName} ${selected ? "selected" : "deselected"}.`);
    await repositories.refresh();
    await status.refresh();
    await queue.refresh();
  }

  async function enqueueSelected(mode: "SELECTED" | "NEW_SELECTED" | "CHANGED_SELECTED") {
    const result = await generatorApiClient.enqueueRepositories({
      mode,
      regenerateCompleted: false
    });
    notify(`${result.enqueued} repositories queued. ${result.skipped} skipped.`);
    await queue.refresh();
  }

  async function bulk(
    operation:
      | "SELECT_VISIBLE"
      | "DESELECT_VISIBLE"
      | "SELECT_OWNED_NON_ARCHIVED"
      | "DESELECT_ALL"
      | "SELECT_NEW"
      | "SELECT_CHANGED"
      | "CLEAR_INACCESSIBLE"
  ) {
    const result = await generatorApiClient.bulkGithubSelection({
      operation,
      query: operation.includes("VISIBLE") ? toApiQuery(query) : undefined
    });
    notify(result.message);
    await repositories.refresh();
    await status.refresh();
  }

  if ((status.loading || repositories.loading) && !status.data && !repositories.data) {
    return <LoadingState label="Loading repository workspace" />;
  }

  if ((status.error || repositories.error) && !repositories.data) {
    return (
      <ErrorState
        message={`GENERATOR API OFFLINE / ${status.error ?? repositories.error}`}
        onRetry={() => {
          void status.refresh();
          void repositories.refresh();
        }}
      />
    );
  }

  const items = repositories.data?.items ?? [];
  const githubStatus = status.data;
  const syncStatus = sync.data;

  return (
    <section className="page-stack repository-page">
      <header className="page-header">
        <p className="eyebrow">REPOSITORIES</p>
        <h1>GitHub repository discovery</h1>
        <p>
          Fetch repository metadata, inspect README and language data, then choose what is eligible
          for future processing.
        </p>
      </header>

      {githubStatus ? (
        <section className="status-grid">
          <article className="panel">
            <p className="eyebrow">CONNECTION</p>
            <StatusIndicator
              status={
                githubStatus.authenticationState === "AUTHENTICATION_FAILED" ? "invalid" : "ready"
              }
              label={githubStatus.authenticationState}
            />
            <small>{githubStatus.tokenStatus}</small>
          </article>
          <MetricCard label="Stored repositories" value={githubStatus.counts.total} />
          <MetricCard label="Selected" value={githubStatus.counts.selectedForProcessing} />
          <MetricCard label="Changed" value={githubStatus.counts.changedRepositories} />
          <MetricCard label="Inaccessible" value={githubStatus.counts.inaccessibleRepositories} />
          <MetricCard
            label="Rate remaining"
            value={`${githubStatus.rateLimit.remaining}/${githubStatus.rateLimit.limit}`}
          />
        </section>
      ) : null}

      <section
        className="panel repository-controls"
        aria-label="Repository synchronization controls"
      >
        <div>
          <h2>Synchronization</h2>
          <p className="muted">
            {githubStatus?.configuredUsername
              ? `${githubStatus.configuredUsername} / ${githubStatus.authenticationMode} / ${githubStatus.includePrivateRepositories ? "private requested when allowed" : "public repositories only"}`
              : "GITHUB ACCOUNT NOT CONFIGURED"}
          </p>
        </div>
        <div className="button-row">
          <button type="button" onClick={() => void runSync(false)} disabled={syncStatus?.running}>
            SYNC REPOSITORIES
          </button>
          <button type="button" onClick={() => void runSync(true)} disabled={syncStatus?.running}>
            FULL SYNC
          </button>
          <button type="button" onClick={() => void cancelSync()} disabled={!syncStatus?.running}>
            CANCEL SYNC
          </button>
          <button
            type="button"
            onClick={() => {
              void status.refresh();
              void repositories.refresh();
              void sync.refresh();
            }}
          >
            REFRESH STATUS
          </button>
        </div>
        {syncStatus ? <SyncProgress status={syncStatus} /> : null}
        {githubStatus?.authenticationMode === "ANONYMOUS" ? (
          <p className="notice">
            PUBLIC REPOSITORIES ONLY / private access requires a server-side token.
          </p>
        ) : null}
      </section>

      <section className="panel repository-controls" aria-label="Repository filters">
        <label>
          Search
          <input
            value={query.search}
            onChange={(event) => setQueryValue(setQuery, "search", event.target.value)}
          />
        </label>
        <label>
          Selection
          <select
            value={query.selection}
            onChange={(event) => setQueryValue(setQuery, "selection", event.target.value)}
          >
            {selectionOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Change
          <select
            value={query.changeState}
            onChange={(event) => setQueryValue(setQuery, "changeState", event.target.value)}
          >
            {changeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Type
          <select
            value={query.repositoryType}
            onChange={(event) => setQueryValue(setQuery, "repositoryType", event.target.value)}
          >
            {typeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          README
          <select
            value={query.readmeStatus}
            onChange={(event) => setQueryValue(setQuery, "readmeStatus", event.target.value)}
          >
            {readmeOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <label>
          Sort
          <select
            value={query.sort}
            onChange={(event) => setQueryValue(setQuery, "sort", event.target.value)}
          >
            {sortOptions.map((option) => (
              <option key={option}>{option}</option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() =>
            setQuery((current) => ({
              ...current,
              search: "",
              selection: "all",
              changeState: "ALL",
              repositoryType: "ALL",
              readmeStatus: "ALL",
              offset: "0"
            }))
          }
        >
          CLEAR FILTERS
        </button>
      </section>

      <section className="panel repository-controls" aria-label="Bulk selection">
        <button type="button" onClick={() => void bulk("SELECT_VISIBLE")}>
          SELECT VISIBLE
        </button>
        <button type="button" onClick={() => void bulk("DESELECT_VISIBLE")}>
          DESELECT VISIBLE
        </button>
        <button type="button" onClick={() => void bulk("SELECT_OWNED_NON_ARCHIVED")}>
          SELECT OWNED ACTIVE
        </button>
        <button type="button" onClick={() => void bulk("SELECT_NEW")}>
          SELECT NEW
        </button>
        <button type="button" onClick={() => void bulk("SELECT_CHANGED")}>
          SELECT CHANGED
        </button>
        <button type="button" onClick={() => void bulk("CLEAR_INACCESSIBLE")}>
          CLEAR INACCESSIBLE
        </button>
        <button type="button" onClick={() => void enqueueSelected("SELECTED")}>
          ADD SELECTED TO QUEUE
        </button>
        <button type="button" onClick={() => void enqueueSelected("CHANGED_SELECTED")}>
          ADD CHANGED SELECTED TO QUEUE
        </button>
      </section>

      <RepositoryList
        items={items}
        total={repositories.data?.total ?? 0}
        onToggle={toggleSelection}
        onDetails={setSelectedRepository}
        jobs={queue.data?.jobs ?? []}
      />

      {selectedRepository ? (
        <RepositoryDetail
          repository={selectedRepository}
          onClose={() => setSelectedRepository(null)}
          onNotesSaved={async (notes) => {
            const selection = await generatorApiClient.updateGithubNotes(selectedRepository.id, {
              notes
            });
            setSelectedRepository({ ...selectedRepository, selection });
            notify("Repository notes saved.");
            await repositories.refresh();
          }}
        />
      ) : null}
    </section>
  );
}

function RepositoryList({
  items,
  total,
  onToggle,
  onDetails,
  jobs
}: {
  items: DiscoveredRepository[];
  total: number;
  onToggle: (repository: DiscoveredRepository, selected: boolean) => Promise<void>;
  onDetails: (repository: DiscoveredRepository) => void;
  jobs: ProcessingJob[];
}) {
  if (total === 0) {
    return (
      <article className="panel empty-panel">
        <h2>REPOSITORIES HAVE NOT BEEN SYNCHRONIZED</h2>
        <p className="muted">Run synchronization to fetch accessible GitHub repositories.</p>
      </article>
    );
  }
  if (items.length === 0) {
    return (
      <article className="panel empty-panel">
        <h2>NO ACCESSIBLE REPOSITORIES FOUND</h2>
        <p className="muted">Clear filters or run a full synchronization.</p>
      </article>
    );
  }
  return (
    <article className="panel repository-list">
      <h2>Repository snapshots / {total}</h2>
      <div className="repo-table" role="table" aria-label="GitHub repositories">
        <div role="row" className="repo-row repo-header">
          <span role="columnheader">Selection</span>
          <span role="columnheader">Repository</span>
          <span role="columnheader">Visibility</span>
          <span role="columnheader">Language</span>
          <span role="columnheader">README</span>
          <span role="columnheader">Queue</span>
          <span role="columnheader">Last pushed</span>
          <span role="columnheader">Sync state</span>
          <span role="columnheader">Actions</span>
        </div>
        {items.map((repository) => (
          <div role="row" className="repo-row" key={repository.id}>
            <label className="checkbox-cell">
              <input
                type="checkbox"
                checked={repository.selection.selectedForProcessing}
                onChange={(event) => void onToggle(repository, event.target.checked)}
              />
              <span className="sr-only">Select {repository.fullName}</span>
            </label>
            <span className="repo-name">
              <strong>{repository.fullName}</strong>
              <small>{repository.description ?? "No description"}</small>
              <small>{repository.topics.slice(0, 4).join(" / ")}</small>
            </span>
            <span>{repository.visibility}</span>
            <span>{repository.primaryLanguage ?? "NONE"}</span>
            <span>{repository.readme.status}</span>
            <span>{queueLabel(repository, jobs)}</span>
            <span>{formatDate(repository.pushedAt)}</span>
            <span>{repository.changeSet.state}</span>
            <button type="button" onClick={() => onDetails(repository)}>
              DETAILS
            </button>
          </div>
        ))}
      </div>
    </article>
  );
}

function queueLabel(repository: DiscoveredRepository, jobs: ProcessingJob[]): string {
  const job = jobs.find((item) => item.repositoryId === repository.id);
  if (job) return `${job.state}${job.draftId ? " / DRAFT" : ""}`;
  return repository.selection.selectedForProcessing ? "SELECTED / NOT QUEUED" : "NOT SELECTED";
}

function SyncProgress({ status }: { status: GitHubSyncProgress }) {
  return (
    <div className="sync-progress" aria-live="polite">
      <strong>{status.phase}</strong>
      <span>
        {status.running ? "RUNNING" : "IDLE"} / {status.snapshotCompleteness ?? "NO SNAPSHOT"}
      </span>
      <span>
        {status.completed} completed / {status.failed} failed / {status.skippedUnchanged} skipped
      </span>
      <span>
        {status.total === null
          ? "discovering repositories"
          : `${status.repositoriesDiscovered}/${status.total} discovered`}
      </span>
      {status.currentRepository ? <span>Inspecting {status.currentRepository}</span> : null}
      {status.warnings.map((warning) => (
        <span key={warning} className="notice">
          {warning}
        </span>
      ))}
    </div>
  );
}

function RepositoryDetail({
  repository,
  onClose,
  onNotesSaved
}: {
  repository: DiscoveredRepository;
  onClose: () => void;
  onNotesSaved: (notes: string) => Promise<void>;
}) {
  const [notes, setNotes] = useState(repository.selection.notes);
  return (
    <div className="detail-backdrop" role="presentation">
      <aside
        className="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`${repository.fullName} details`}
      >
        <button type="button" className="close-button" onClick={onClose}>
          CLOSE
        </button>
        <p className="eyebrow">
          {repository.visibility} / {repository.changeSet.state}
        </p>
        <h2>{repository.fullName}</h2>
        <p>{repository.description ?? "No repository description."}</p>
        <div className="detail-actions">
          <a href={repository.htmlUrl} target="_blank" rel="noreferrer">
            OPEN GITHUB
          </a>
          {repository.homepageUrl ? (
            <a href={repository.homepageUrl} target="_blank" rel="noreferrer">
              OPEN HOMEPAGE
            </a>
          ) : null}
        </div>
        <dl className="key-value-list">
          <div>
            <dt>Default branch</dt>
            <dd>{repository.defaultBranch ?? "unknown"}</dd>
          </div>
          <div>
            <dt>Latest commit</dt>
            <dd>{repository.latestCommitSha ?? "unknown"}</dd>
          </div>
          <div>
            <dt>License</dt>
            <dd>{repository.license ?? "none"}</dd>
          </div>
          <div>
            <dt>Mapping</dt>
            <dd>
              {repository.mapping.status} / {repository.mapping.projectSlug ?? "none"}
            </dd>
          </div>
          <div>
            <dt>Snapshot hash</dt>
            <dd>{repository.repositorySnapshotHash.slice(0, 16)}</dd>
          </div>
        </dl>
        <h3>Languages</h3>
        <div className="language-bars">
          {repository.languages.map((language) => (
            <p key={language.name}>
              <span>{language.name}</span>
              <strong>{language.percentage}%</strong>
            </p>
          ))}
        </div>
        <h3>Detected changes</h3>
        <ul>
          {repository.changeSet.messages.length ? (
            repository.changeSet.messages.map((message) => <li key={message}>{message}</li>)
          ) : (
            <li>No changes detected.</li>
          )}
        </ul>
        <h3>README preview</h3>
        <div className="readme-preview">{renderMarkdownPreview(repository)}</div>
        <label>
          Local notes
          <textarea
            maxLength={2000}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <button type="button" onClick={() => void onNotesSaved(notes)}>
          SAVE NOTES
        </button>
      </aside>
    </div>
  );
}

function renderMarkdownPreview(repository: DiscoveredRepository) {
  if (repository.readme.status !== "AVAILABLE" && repository.readme.status !== "EMPTY") {
    return (
      <p>
        {repository.readme.status} / {repository.readme.warning ?? "No README body stored."}
      </p>
    );
  }
  const content = repository.readme.content ?? "";
  return content
    .slice(0, 4000)
    .split("\n")
    .filter((line) => !line.trim().startsWith("<"))
    .slice(0, 80)
    .map((line, index) => (
      <p key={`${index}-${line.slice(0, 12)}`}>
        {line.replace(/\[([^\]]+)\]\((javascript:[^)]+)\)/gi, "$1")}
      </p>
    ));
}

function setQueryValue(
  setQuery: Dispatch<SetStateAction<RepositoryQueryState>>,
  key: string,
  value: string
) {
  setQuery((current) => ({ ...current, [key]: value, offset: "0" }));
}

function toApiQuery(query: RepositoryQueryState): Partial<GitHubRepositoryQuery> {
  return {
    search: query.search,
    selection: query.selection as GitHubRepositoryQuery["selection"],
    changeState: query.changeState as GitHubRepositoryQuery["changeState"],
    repositoryType: query.repositoryType as GitHubRepositoryQuery["repositoryType"],
    readmeStatus: query.readmeStatus as GitHubRepositoryQuery["readmeStatus"],
    sort: query.sort as GitHubRepositoryQuery["sort"],
    direction: query.direction as GitHubRepositoryQuery["direction"],
    limit: Number(query.limit),
    offset: Number(query.offset)
  };
}

function formatDate(value: string | null): string {
  return value
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value))
    : "UNKNOWN";
}
