import { useEffect, useState } from "react";
import type { GeneratedProjectDraft, ProcessingJob } from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function QueuePage({ embedded = false }: { embedded?: boolean }) {
  const queue = useApiResource((signal) => generatorApiClient.queue(signal), []);
  const ai = useApiResource((signal) => generatorApiClient.aiRuntime(signal), []);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (queue.data?.state !== "RUNNING") return;
    const timer = window.setInterval(() => void refreshAll(), 1500);
    return () => window.clearInterval(timer);
  });

  useEffect(() => {
    const refreshForSelection = () => void refreshAll();
    window.addEventListener("repository-selection-changed", refreshForSelection);
    return () => window.removeEventListener("repository-selection-changed", refreshForSelection);
  });

  async function refreshAll() {
    await Promise.all([queue.refresh(), ai.refresh()]);
  }

  async function act(label: string, action: () => Promise<unknown>) {
    await action();
    notify(label);
    await refreshAll();
  }

  async function deleteSummary(draftId: string) {
    try {
      await generatorApiClient.deleteDraft(draftId);
      notify("Generated summary deleted. This repository can now be generated again.");
      if (activeDraftId === draftId) setActiveDraftId(null);
      await refreshAll();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not delete generated summary.");
    }
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
      <header className="page-header" id={embedded ? "repository-queue" : undefined}>
        <p className="eyebrow">QUEUE</p>
        <h1>{embedded ? "Generate repository descriptions" : "Sequential AI processing queue"}</h1>
        <p>
          Only manually selected repositories can be queued. Jobs run one at a time and persist
          every transition.
        </p>
      </header>

      <div className="queue-status-strip" aria-label="Queue status">
        <span>
          <small>Queue</small>
          <strong>{friendlyStatus(data.state)}</strong>
        </span>
        <span>
          <small>AI</small>
          <strong>{friendlyStatus(ai.data?.status ?? "UNKNOWN")}</strong>
        </span>
        <span>
          <small>Waiting</small>
          <strong>{data.metrics.pending}</strong>
        </span>
        <span>
          <small>Generating</small>
          <strong>{data.metrics.active}</strong>
        </span>
        <span>
          <small>Completed</small>
          <strong>{data.metrics.completed}</strong>
        </span>
        <span>
          <small>Needs attention</small>
          <strong>{data.metrics.failed + data.metrics.interrupted}</strong>
        </span>
      </div>

      {embedded ? (
        <section className="panel embedded-queue-action">
          <div>
            <strong>Ready to process your selection</strong>
            <p className="muted">
              Start adds selected repositories and generates one final project summary at a time.
            </p>
          </div>
          <button
            className="primary-action"
            type="button"
            disabled={data.state === "RUNNING"}
            onClick={() =>
              void act("Selected repositories are being processed.", async () => {
                await generatorApiClient.checkAi();
                await generatorApiClient.warmAi();
                await generatorApiClient.enqueueRepositories({
                  mode: "SELECTED",
                  regenerateCompleted: false
                });
                await generatorApiClient.startQueue();
              })
            }
          >
            START SELECTED
          </button>
          {data.state === "RUNNING" ? (
            <button
              type="button"
              onClick={() => void act("Queue paused.", () => generatorApiClient.pauseQueue())}
            >
              PAUSE
            </button>
          ) : null}
        </section>
      ) : (
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
      )}

      {!embedded ? (
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
      ) : null}

      <article className="panel repository-list">
        <h2>Jobs / {jobs.length}</h2>
        <div className="job-list">
          {jobs.map((job) => (
            <div className="job-with-summary" key={job.id}>
              <JobRow
                job={job}
                onRefresh={refreshAll}
                compact={embedded}
                onToggle={() => (job.draftId ? setActiveDraftId(job.draftId) : undefined)}
                onDelete={deleteSummary}
              />
            </div>
          ))}
          {jobs.length === 0 ? <p className="muted">No jobs in this view.</p> : null}
        </div>
      </article>
      {activeDraftId ? (
        <DraftPreview draftId={activeDraftId} onClose={() => setActiveDraftId(null)} />
      ) : null}
    </section>
  );
}

function DraftPreview({ draftId, onClose }: { draftId: string; onClose: () => void }) {
  const resource = useApiResource((signal) => generatorApiClient.draft(draftId, signal), [draftId]);
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose]);
  return (
    <div
      className="summary-modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="summary-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Generated project summary"
      >
        <button
          className="summary-modal-close"
          type="button"
          aria-label="Close summary"
          onClick={onClose}
        >
          ×
        </button>
        {!resource.data ? (
          <div className="summary-modal-loading">Loading summary…</div>
        ) : (
          <FullDraft draft={resource.data} />
        )}
      </section>
    </div>
  );
}

function FullDraft({ draft }: { draft: GeneratedProjectDraft }) {
  return (
    <article className="generated-draft job-draft-expansion">
      <header>
        <p className="eyebrow">GENERATED PROJECT SUMMARY</p>
        <h2>{draft.title}</h2>
        {draft.subtitle ? <p className="draft-subtitle">{draft.subtitle}</p> : null}
        <p className="draft-summary">{draft.summary}</p>
      </header>
      <div className="draft-body">
        <DraftText title="Overview" value={draft.description} />
        <DraftText title="Problem" value={draft.problem} />
        <DraftText title="Solution" value={draft.solution} />
        <DraftList title="Key features" items={draft.features} />
        <DraftList title="Architecture" items={draft.architecture} />
        <DraftList title="Engineering challenges" items={draft.challenges} />
        <DraftText title="Impact" value={draft.impact} />
        <DraftList title="Limitations" items={draft.limitations} />
        <DraftList title="Missing information" items={draft.missingInformation} />
        <DraftList title="Confidence notes" items={draft.confidenceNotes} />
      </div>
      <footer>
        <div className="draft-tags">
          {draft.technologies.map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
        <p className="muted">Source: {draft.repositoryFullName}</p>
      </footer>
    </article>
  );
}

function DraftText({ title, value }: { title: string; value: string }) {
  return value ? (
    <section>
      <h3>{title}</h3>
      <p>{value}</p>
    </section>
  ) : null;
}

function DraftList({ title, items }: { title: string; items: string[] }) {
  return items.length ? (
    <section>
      <h3>{title}</h3>
      <ul>
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  ) : null;
}

function friendlyStatus(value: string): string {
  return value.replace(/^EXTERNAL_SERVER_/, "").replaceAll("_", " ");
}

function JobRow({
  job,
  onRefresh,
  compact = false,
  onToggle,
  onDelete
}: {
  job: ProcessingJob;
  onRefresh: () => Promise<void>;
  compact?: boolean;
  onToggle: () => void;
  onDelete: (draftId: string) => Promise<void>;
}) {
  const expandable = job.state === "COMPLETED" && Boolean(job.draftId);
  const progress = job.runtimeProgress;
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  async function removeSummary() {
    if (!job.draftId) return;
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await onDelete(job.draftId);
    } finally {
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }
  return (
    <article className={`log-entry job-card job-state-${job.state.toLowerCase()}`}>
      <button
        className="job-summary-button"
        type="button"
        aria-haspopup={expandable ? "dialog" : undefined}
        disabled={!expandable}
        onClick={onToggle}
      >
        <span className="job-state-label">{job.state}</span>
        <span className="job-repository">
          <strong>{job.repositoryFullName}</strong>
          <small>
            {job.progressMessage.replaceAll("Draft", "Summary").replaceAll("draft", "summary")}
          </small>
        </span>
        <span className="job-open-label">
          {job.draftId ? "VIEW SUMMARY ↗" : "SUMMARY PENDING"}
        </span>
      </button>
      {progress ? (
        <div className="job-runtime-progress" aria-live="polite">
          <div className="job-progress-copy">
            <strong>
              {progress.phase === "PROMPT_PROCESSING"
                ? "ANALYSING PROJECT CONTEXT"
                : "DRAFTING CASE STUDY"}
            </strong>
            <span>
              {progress.phase === "PROMPT_PROCESSING"
                ? `${promptPercent(progress.promptTokensProcessed, progress.promptTokensTotal)}% CONTEXT PROCESSED · ${progress.promptTokensProcessed.toLocaleString()} / ${progress.promptTokensTotal.toLocaleString()} TOKENS`
                : `${progress.generatedTokens.toLocaleString()} TOKENS WRITTEN · OUTPUT IN PROGRESS`}
              {job.startedAt ? ` · ${elapsed(job.startedAt)}` : ""}
            </span>
          </div>
          <div
            className={`job-progress-track ${progress.phase === "WRITING" ? "is-writing" : ""}`}
            role="progressbar"
            aria-label={
              progress.phase === "PROMPT_PROCESSING"
                ? "Project context analysis progress"
                : "Case study is being drafted"
            }
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={
              progress.phase === "PROMPT_PROCESSING"
                ? promptPercent(progress.promptTokensProcessed, progress.promptTokensTotal)
                : undefined
            }
          >
            <span
              style={
                progress.phase === "PROMPT_PROCESSING"
                  ? {
                      width: `${promptPercent(progress.promptTokensProcessed, progress.promptTokensTotal)}%`
                    }
                  : undefined
              }
            />
          </div>
        </div>
      ) : null}
      {job.draftId ? (
        <div className="job-delete-actions">
          {confirmingDelete ? (
            <button type="button" disabled={deleting} onClick={() => setConfirmingDelete(false)}>
              KEEP
            </button>
          ) : null}
          <button
            className="danger-text-button"
            type="button"
            disabled={deleting}
            onClick={() => void removeSummary()}
          >
            {deleting ? "DELETING…" : confirmingDelete ? "CONFIRM DELETE" : "DELETE"}
          </button>
        </div>
      ) : null}
      {job.state === "PENDING" || ["FAILED", "INTERRUPTED", "CANCELLED"].includes(job.state) ? (
        <div className="button-row">
          {!compact && job.state === "PENDING" ? (
            <button
              type="button"
              onClick={() => void generatorApiClient.cancelQueueJob(job.id).then(onRefresh)}
            >
              CANCEL
            </button>
          ) : null}
          <button
            className="danger-text-button"
            type="button"
            onClick={() => void generatorApiClient.deleteQueueJob(job.id).then(onRefresh)}
          >
            DELETE
          </button>
          {["FAILED", "INTERRUPTED", "CANCELLED"].includes(job.state) ? (
            <button
              type="button"
              onClick={() => void generatorApiClient.retryQueueJob(job.id).then(onRefresh)}
            >
              RETRY
            </button>
          ) : null}
        </div>
      ) : null}
      {job.error ? <p className="notice">{job.error}</p> : null}
    </article>
  );
}

function promptPercent(processed: number, total: number): number {
  return total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0;
}

function elapsed(startedAt: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - Date.parse(startedAt)) / 1000));
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return minutes > 0 ? `${minutes}M ${remainder}S ELAPSED` : `${remainder}S ELAPSED`;
}
