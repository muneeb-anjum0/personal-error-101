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
  const [expandedDraftId, setExpandedDraftId] = useState<string | null>(null);
  const { notify } = useToast();

  useEffect(() => {
    if (queue.data?.state !== "RUNNING") return;
    const timer = window.setInterval(() => void refreshAll(), 1500);
    return () => window.clearInterval(timer);
  });

  async function refreshAll() {
    await Promise.all([queue.refresh(), ai.refresh()]);
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
                expanded={Boolean(job.draftId && expandedDraftId === job.draftId)}
                onToggle={() =>
                  job.draftId
                    ? setExpandedDraftId((current) =>
                        current === job.draftId ? null : job.draftId
                      )
                    : undefined
                }
              />
              {job.draftId && expandedDraftId === job.draftId ? (
                <DraftPreview
                  draftId={job.draftId}
                  repositoryName={job.repositoryFullName}
                  onDeleted={async () => {
                    setExpandedDraftId(null);
                    await refreshAll();
                  }}
                />
              ) : null}
            </div>
          ))}
          {jobs.length === 0 ? <p className="muted">No jobs in this view.</p> : null}
        </div>
      </article>
    </section>
  );
}

function DraftPreview({
  draftId,
  repositoryName,
  onDeleted
}: {
  draftId: string;
  repositoryName: string;
  onDeleted: () => Promise<void>;
}) {
  const resource = useApiResource((signal) => generatorApiClient.draft(draftId, signal), [draftId]);
  if (!resource.data) {
    return (
      <article className="generated-draft draft-loading">Loading {repositoryName} summary…</article>
    );
  }
  return <FullDraft draft={resource.data} onDeleted={onDeleted} />;
}

function FullDraft({
  draft,
  onDeleted
}: {
  draft: GeneratedProjectDraft;
  onDeleted: () => Promise<void>;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { notify } = useToast();

  async function deleteSummary() {
    if (!confirmingDelete) {
      setConfirmingDelete(true);
      return;
    }
    setDeleting(true);
    try {
      await generatorApiClient.deleteDraft(draft.id);
      notify("Generated summary deleted. This repository can now be generated again.");
      await onDeleted();
    } catch (error) {
      notify(error instanceof Error ? error.message : "Could not delete generated summary.");
      setDeleting(false);
      setConfirmingDelete(false);
    }
  }

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
      <div className="draft-final-actions">
        <div>
          <strong>This summary is final</strong>
          <p className="muted">Delete it first if you want to generate a replacement.</p>
        </div>
        {confirmingDelete ? (
          <button type="button" onClick={() => setConfirmingDelete(false)} disabled={deleting}>
            KEEP SUMMARY
          </button>
        ) : null}
        <button
          className="danger-action"
          type="button"
          disabled={deleting}
          onClick={() => void deleteSummary()}
        >
          {deleting
            ? "DELETING"
            : confirmingDelete
              ? "CONFIRM DELETE"
              : "DELETE SUMMARY"}
        </button>
      </div>
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
  expanded = false,
  onToggle
}: {
  job: ProcessingJob;
  onRefresh: () => Promise<void>;
  compact?: boolean;
  expanded?: boolean;
  onToggle: () => void;
}) {
  const expandable = job.state === "COMPLETED" && Boolean(job.draftId);
  return (
    <article className="log-entry">
      <button
        className="job-summary-button"
        type="button"
        aria-expanded={expandable ? expanded : undefined}
        disabled={!expandable}
        onClick={onToggle}
      >
        <span>{job.state}</span>
        <span>{job.repositoryFullName}</span>
        <span>{job.progressMessage.replaceAll("Draft", "Summary").replaceAll("draft", "summary")}</span>
        <span>{job.draftId ? (expanded ? "Close summary" : "Open summary") : "Summary pending"}</span>
      </button>
      {!compact ? (
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
      ) : null}
      {job.error ? <p className="notice">{job.error}</p> : null}
    </article>
  );
}
