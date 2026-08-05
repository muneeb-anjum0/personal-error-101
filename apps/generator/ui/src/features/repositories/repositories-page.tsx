import { useEffect, useRef, useState } from "react";
import type {
  DiscoveredRepository,
  GitHubSyncProgress,
  ProcessingJob
} from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";
import { QueuePage } from "../queue/queue-page";

const repositoryQuery =
  "?selection=all&changeState=ALL&repositoryType=ALL&readmeStatus=ALL&sort=pushed&direction=desc&limit=100&offset=0";

export function RepositoriesPage() {
  const { notify } = useToast();
  const repositoriesRef = useRef<HTMLElement>(null);
  const [scrollAfterSync, setScrollAfterSync] = useState(false);
  const status = useApiResource((signal) => generatorApiClient.githubStatus(signal), []);
  const repositories = useApiResource(
    (signal) => generatorApiClient.githubRepositories(repositoryQuery, signal),
    []
  );
  const queue = useApiResource((signal) => generatorApiClient.queue(signal), []);
  const sync = useApiResource((signal) => generatorApiClient.githubSyncStatus(signal), []);

  useEffect(() => {
    if (!sync.data?.running) return;
    const timer = window.setInterval(() => {
      void sync.refresh();
      void repositories.refresh();
      void status.refresh();
      void queue.refresh();
    }, 1500);
    return () => window.clearInterval(timer);
  }, [queue, repositories, status, sync]);

  useEffect(() => {
    if (!scrollAfterSync || !sync.data || sync.data.running) return;
    setScrollAfterSync(false);
    void repositories.refresh().then(() => {
      repositoriesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [repositories, scrollAfterSync, sync.data]);

  async function runSync() {
    setScrollAfterSync(true);
    await generatorApiClient.syncGithub();
    notify("Repository synchronization started.");
    await sync.refresh();
  }

  async function toggleSelection(repository: DiscoveredRepository, selected: boolean) {
    await generatorApiClient.updateGithubSelection(repository.id, {
      selectedForProcessing: selected
    });
    await Promise.all([repositories.refresh(), status.refresh(), queue.refresh()]);
  }

  async function toggleVisibleSelection(selected: boolean) {
    await generatorApiClient.bulkGithubSelection({
      operation: selected ? "SELECT_VISIBLE" : "DESELECT_VISIBLE",
      query: {
        selection: "all",
        changeState: "ALL",
        repositoryType: "ALL",
        readmeStatus: "ALL",
        sort: "pushed",
        direction: "desc",
        limit: 100,
        offset: 0
      }
    });
    await Promise.all([repositories.refresh(), status.refresh(), queue.refresh()]);
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
  const allVisibleSelected =
    items.length > 0 && items.every((item) => item.selection.selectedForProcessing);

  return (
    <section className="page-stack repository-page">
      <header className="page-header">
        <p className="eyebrow">REPOSITORIES</p>
        <h1>Choose repositories and generate descriptions</h1>
        <p>Sync GitHub, select the projects you want, then start the AI queue below.</p>
      </header>

      <section className="panel sync-card" aria-label="Repository synchronization controls">
        <div className="sync-identity">
          <StatusIndicator
            status={
              githubStatus?.authenticationState === "AUTHENTICATION_FAILED" ? "invalid" : "ready"
            }
            label={githubStatus?.authenticationState ?? "CHECKING"}
          />
          <span>
            <strong>{githubStatus?.configuredUsername ?? "GitHub account"}</strong>
            <small>
              {githubStatus
                ? `${githubStatus.counts.total} repositories · ${githubStatus.counts.selectedForProcessing} selected`
                : "Loading repository status"}
            </small>
          </span>
          {syncStatus && !syncStatus.running ? <SyncProgress status={syncStatus} /> : null}
        </div>
        <button
          className="primary-action"
          type="button"
          onClick={() => void runSync()}
          disabled={syncStatus?.running}
        >
          {syncStatus?.running ? "SYNCING…" : "SYNC GITHUB"}
        </button>
        {syncStatus?.running ? <SyncProgress status={syncStatus} /> : null}
      </section>

      <RepositoryList
        ref={repositoriesRef}
        items={items}
        total={repositories.data?.total ?? 0}
        allSelected={allVisibleSelected}
        onToggleAll={toggleVisibleSelection}
        onToggle={toggleSelection}
        jobs={queue.data?.jobs ?? []}
      />

      <section className="repository-workflow-step" aria-label="Repository AI queue">
        <QueuePage embedded />
      </section>
    </section>
  );
}

function RepositoryList({
  ref,
  items,
  total,
  allSelected,
  onToggleAll,
  onToggle,
  jobs
}: {
  ref: React.Ref<HTMLElement>;
  items: DiscoveredRepository[];
  total: number;
  allSelected: boolean;
  onToggleAll: (selected: boolean) => Promise<void>;
  onToggle: (repository: DiscoveredRepository, selected: boolean) => Promise<void>;
  jobs: ProcessingJob[];
}) {
  if (total === 0) {
    return (
      <article ref={ref} className="panel empty-panel">
        <h2>No repository snapshot yet</h2>
        <p className="muted">Sync GitHub to load your repositories.</p>
      </article>
    );
  }

  return (
    <article ref={ref} className="panel repository-list repository-picker">
      <div className="repository-list-heading">
        <div>
          <p className="eyebrow">STEP 2</p>
          <h2>Select repositories / {total}</h2>
        </div>
        <label className="select-all-control">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={(event) => void onToggleAll(event.target.checked)}
          />
          Select all shown
        </label>
      </div>
      <div className="simple-repo-list" role="list" aria-label="GitHub repositories">
        {items.map((repository, index) => (
          <label
            className={`simple-repo-row${repository.selection.selectedForProcessing ? " is-selected" : ""}`}
            key={repository.id}
          >
            <span className="repo-index">{String(index + 1).padStart(2, "0")}</span>
            <input
              className="repo-checkbox"
              type="checkbox"
              checked={repository.selection.selectedForProcessing}
              onChange={(event) => void onToggle(repository, event.target.checked)}
            />
            <span className="repo-name">
              <strong>{repository.fullName}</strong>
              <small>{repository.description ?? "No description yet"}</small>
            </span>
            <span className="repo-fact">
              <small>Language</small>
              {repository.primaryLanguage ?? "—"}
            </span>
            <span className="repo-fact">
              <small>Snapshot</small>
              {repository.changeSet.state}
            </span>
            <span className="repo-queue-state">{queueLabel(repository, jobs)}</span>
          </label>
        ))}
      </div>
    </article>
  );
}

function queueLabel(repository: DiscoveredRepository, jobs: ProcessingJob[]): string {
  const job = jobs.find((item) => item.repositoryId === repository.id);
  if (job) return job.draftId ? "SUMMARY READY" : job.state;
  return repository.selection.selectedForProcessing ? "READY" : "NOT SELECTED";
}

function SyncProgress({ status }: { status: GitHubSyncProgress }) {
  if (!status.running) {
    return (
      <p className="sync-summary muted">
        Last snapshot: {status.snapshotCompleteness ?? "not available"}
      </p>
    );
  }
  return (
    <div className="sync-progress-simple" aria-live="polite">
      <span>{status.phase}</span>
      <progress value={status.completed} max={status.total ?? 1} />
      <span>{status.total === null ? "Discovering…" : `${status.completed}/${status.total}`}</span>
    </div>
  );
}
