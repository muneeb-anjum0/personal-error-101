import { useState } from "react";
import type { ProcessingJob } from "@muneeb-systems/shared-types";
import { MetricCard } from "../../components/data-display/metric-card";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function QueuePage() {
  const queue = useApiResource((signal) => generatorApiClient.queue(signal), []);
  const ai = useApiResource((signal) => generatorApiClient.aiRuntime(signal), []);
  const drafts = useApiResource((signal) => generatorApiClient.drafts(signal), []);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const { notify } = useToast();

  async function refreshAll() {
    await Promise.all([queue.refresh(), ai.refresh(), drafts.refresh()]);
  }

  async function act(label: string, action: () => Promise<unknown>) {
    await action();
    notify(label);
    await refreshAll();
  }

  if (queue.loading && !queue.data) return <LoadingState label="Loading processing queue" />;
  if (queue.error && !queue.data) {
    return (
      <ErrorState
        message={`QUEUE API OFFLINE / ${queue.error}`}
        onRetry={() => void queue.refresh()}
      />
    );
  }
  const data = queue.data;
  if (!data) return null;
  const jobs = data.jobs.filter((job) => activeFilter === "ALL" || job.state === activeFilter);

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">QUEUE</p>
        <h1>Sequential AI processing queue</h1>
        <p>
          Only manually selected repositories can be queued. Jobs run one at a time and persist
          every transition.
        </p>
      </header>

      <div className="metric-grid">
        <MetricCard label="Queue state" value={data.state} />
        <MetricCard label="AI status" value={ai.data?.status ?? "UNKNOWN"} />
        <MetricCard label="Pending" value={data.metrics.pending} />
        <MetricCard label="Active" value={data.metrics.active} />
        <MetricCard label="Completed" value={data.metrics.completed} />
        <MetricCard label="Failed" value={data.metrics.failed} />
        <MetricCard label="Interrupted" value={data.metrics.interrupted} />
        <MetricCard label="Drafts" value={drafts.data?.total ?? data.metrics.completedDrafts} />
      </div>

      <section className="panel repository-controls">
        <button
          type="button"
          onClick={() =>
            void act("Selected repositories enqueued.", () =>
              generatorApiClient.enqueueRepositories({
                mode: "SELECTED",
                regenerateCompleted: false
              })
            )
          }
        >
          ADD SELECTED
        </button>
        <button
          type="button"
          onClick={() =>
            void act("New selected repositories enqueued.", () =>
              generatorApiClient.enqueueRepositories({
                mode: "NEW_SELECTED",
                regenerateCompleted: false
              })
            )
          }
        >
          ADD NEW SELECTED
        </button>
        <button
          type="button"
          onClick={() =>
            void act("Changed selected repositories enqueued.", () =>
              generatorApiClient.enqueueRepositories({
                mode: "CHANGED_SELECTED",
                regenerateCompleted: false
              })
            )
          }
        >
          ADD CHANGED SELECTED
        </button>
        <button
          type="button"
          onClick={() => void act("Queue started.", () => generatorApiClient.startQueue())}
        >
          START
        </button>
        <button
          type="button"
          onClick={() => void act("Queue paused.", () => generatorApiClient.pauseQueue())}
        >
          PAUSE
        </button>
        <button
          type="button"
          onClick={() => void act("Queue resumed.", () => generatorApiClient.resumeQueue())}
        >
          RESUME
        </button>
        <button
          type="button"
          onClick={() =>
            void act("Failed jobs queued for retry.", () => generatorApiClient.retryFailedQueue())
          }
        >
          RETRY FAILED
        </button>
      </section>

      <section className="toolbar" aria-label="Queue job filters">
        {["ALL", "PENDING", "GENERATING", "COMPLETED", "FAILED", "CANCELLED", "INTERRUPTED"].map(
          (filter) => (
            <button
              key={filter}
              type="button"
              aria-pressed={activeFilter === filter}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          )
        )}
      </section>

      <article className="panel repository-list">
        <h2>Jobs / {jobs.length}</h2>
        <div className="job-list">
          {jobs.map((job) => (
            <JobRow key={job.id} job={job} onRefresh={refreshAll} />
          ))}
          {jobs.length === 0 ? <p className="muted">No jobs in this view.</p> : null}
        </div>
      </article>

      <article className="panel">
        <h2>Drafts</h2>
        <div className="job-list">
          {(drafts.data?.items ?? []).map((draft) => (
            <p key={draft.id}>
              <strong>{draft.title}</strong> / {draft.repositoryFullName} / {draft.createdAt}
            </p>
          ))}
        </div>
      </article>
    </section>
  );
}

function JobRow({ job, onRefresh }: { job: ProcessingJob; onRefresh: () => Promise<void> }) {
  return (
    <article className="log-entry">
      <summary>
        <span>{job.state}</span>
        <span>{job.repositoryFullName}</span>
        <span>{job.progressMessage}</span>
        <span>{job.draftId ?? "no draft"}</span>
      </summary>
      <div className="button-row">
        <button
          type="button"
          onClick={() => void generatorApiClient.cancelQueueJob(job.id).then(onRefresh)}
        >
          CANCEL
        </button>
        <button
          type="button"
          onClick={() => void generatorApiClient.retryQueueJob(job.id).then(onRefresh)}
        >
          RETRY
        </button>
      </div>
      {job.error ? <p className="notice">{job.error}</p> : null}
    </article>
  );
}
