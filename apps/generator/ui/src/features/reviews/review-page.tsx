import { useEffect, useMemo, useState } from "react";
import type { DraftReview, ReviewContent } from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

const arrayFields = [
  "features",
  "technologies",
  "categories",
  "tags",
  "missingInformation"
] as const;

export function ReviewPage() {
  const reviews = useApiResource((signal) => generatorApiClient.reviews(signal), []);
  const selectedId = new URLSearchParams(window.location.search).get("reviewId");
  const reviewId = selectedId ?? reviews.data?.items[0]?.id ?? "";
  const review = useApiResource(
    (signal) => (reviewId ? generatorApiClient.review(reviewId, signal) : Promise.resolve(null)),
    [reviewId]
  );
  const [draft, setDraft] = useState<DraftReview | null>(null);
  const [contentText, setContentText] = useState("");
  const [dirty, setDirty] = useState(false);
  const [comparison, setComparison] = useState<string>("");
  const { notify } = useToast();

  useEffect(() => {
    if (review.data) {
      setDraft(review.data);
      const recovery = window.localStorage.getItem(recoveryKey(review.data.id));
      setContentText(recovery ?? JSON.stringify(review.data.workingCopy.content, null, 2));
      setDirty(Boolean(recovery));
    }
  }, [review.data]);

  useEffect(() => {
    if (!draft || !dirty) {
      return;
    }
    window.localStorage.setItem(recoveryKey(draft.id), contentText);
    const beforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, [contentText, dirty, draft]);

  const validation = draft?.workingCopy.validation;
  const parsedContent = useMemo(() => {
    try {
      return JSON.parse(contentText) as ReviewContent;
    } catch {
      return null;
    }
  }, [contentText]);

  async function run(action: () => Promise<unknown>, message: string) {
    try {
      await action();
      notify(message);
      setDirty(false);
      if (draft) {
        window.localStorage.removeItem(recoveryKey(draft.id));
      }
      await review.refresh();
      await reviews.refresh();
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  if (reviews.loading && !reviews.data) {
    return <LoadingState label="Loading reviews" />;
  }

  if (reviews.error && !reviews.data) {
    return <ErrorState message={reviews.error} onRetry={() => void reviews.refresh()} />;
  }

  if (!reviewId) {
    return (
      <section className="page-stack">
        <header className="page-header">
          <p className="eyebrow">REVIEW</p>
          <h1>No Reviews Yet</h1>
          <p>Open a generated draft first, then edit, validate, approve, or reject it here.</p>
        </header>
      </section>
    );
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">REVIEW</p>
        <h1>{draft?.workingCopy.content.title ?? "Draft Review"}</h1>
        <p>{draft?.repositoryFullName ?? "Loading review details"}</p>
      </header>
      <div className="content-layout review-layout">
        <div className="panel file-list">
          {reviews.data?.items.map((item) => (
            <button
              key={item.id}
              aria-pressed={item.id === reviewId}
              type="button"
              onClick={() => {
                window.history.pushState(
                  null,
                  "",
                  `/review?reviewId=${encodeURIComponent(item.id)}`
                );
                window.dispatchEvent(new PopStateEvent("popstate"));
              }}
            >
              <span>{item.title}</span>
              <small>
                {item.status} / {item.validationState}
              </small>
              <small>{item.repositoryFullName}</small>
            </button>
          ))}
        </div>
        <article className="panel editor-panel">
          {review.loading && !draft ? <LoadingState label="Loading review" /> : null}
          {review.error ? (
            <ErrorState message={review.error} onRetry={() => void review.refresh()} />
          ) : null}
          {draft ? (
            <>
              <div className="toolbar">
                <button
                  type="button"
                  disabled={!parsedContent}
                  onClick={() =>
                    void run(
                      () =>
                        generatorApiClient.updateReviewWorkingCopy(draft.id, {
                          expectedVersion: draft.version,
                          reviewerLabel: "Muneeb Anjum",
                          content: parsedContent as ReviewContent
                        }),
                      "Working copy saved"
                    )
                  }
                >
                  SAVE WORKING COPY
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run(
                      () =>
                        generatorApiClient.saveReviewRevision(draft.id, {
                          expectedVersion: draft.version,
                          authorLabel: "Muneeb Anjum",
                          changeSummary: dirty ? "Manual content edits" : "Review checkpoint"
                        }),
                      "Revision saved"
                    )
                  }
                >
                  SAVE REVISION
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run(() => generatorApiClient.validateReview(draft.id), "Review validated")
                  }
                >
                  VALIDATE
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run(
                      () =>
                        generatorApiClient.approveReview(draft.id, {
                          expectedVersion: draft.version,
                          reviewerLabel: "Muneeb Anjum",
                          acknowledgedWarnings: validation?.warnings ?? [],
                          approvalNotes: ""
                        }),
                      "Review approved"
                    )
                  }
                >
                  APPROVE
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void run(
                      () =>
                        generatorApiClient.rejectReview(draft.id, {
                          reason: "OTHER",
                          notes: "Rejected during manual review."
                        }),
                      "Review rejected"
                    )
                  }
                >
                  REJECT
                </button>
              </div>
              <dl className="key-value-list">
                <div>
                  <dt>Status</dt>
                  <dd>
                    {draft.status} / version {draft.version}
                  </dd>
                </div>
                <div>
                  <dt>Validation</dt>
                  <dd>
                    {validation
                      ? `${validation.valid ? "VALID" : "BLOCKED"} / ${validation.warnings.length} WARNINGS`
                      : "NOT VALIDATED"}
                  </dd>
                </div>
                <div>
                  <dt>Mapping</dt>
                  <dd>
                    {draft.mapping.type} /{" "}
                    {draft.mapping.slug ?? draft.mapping.projectId ?? "UNMAPPED"}
                  </dd>
                </div>
              </dl>
              <label className="field">
                <span>Editable Review JSON</span>
                <textarea
                  className="json-editor"
                  value={contentText}
                  onChange={(event) => {
                    setContentText(event.target.value);
                    setDirty(true);
                  }}
                />
              </label>
              <section className="panel inner-panel">
                <h2>Quick Fields</h2>
                <dl className="key-value-list">
                  {parsedContent ? (
                    <>
                      <div>
                        <dt>Slug</dt>
                        <dd>{parsedContent.slug}</dd>
                      </div>
                      <div>
                        <dt>Subtitle</dt>
                        <dd>{parsedContent.subtitle}</dd>
                      </div>
                      {arrayFields.map((field) => (
                        <div key={field}>
                          <dt>{field}</dt>
                          <dd>{parsedContent[field].join(", ") || "NONE"}</dd>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div>
                      <dt>JSON</dt>
                      <dd>INVALID</dd>
                    </div>
                  )}
                </dl>
              </section>
              <div className="toolbar">
                <button
                  type="button"
                  onClick={() =>
                    void generatorApiClient
                      .compareReview(draft.id)
                      .then((next) => setComparison(JSON.stringify(next, null, 2)))
                      .catch((error) => notify(toFriendlyError(error)))
                  }
                >
                  COMPARE REVISIONS
                </button>
              </div>
              {comparison ? <pre className="json-viewer">{comparison}</pre> : null}
            </>
          ) : null}
        </article>
      </div>
    </section>
  );
}

function recoveryKey(reviewId: string) {
  return `muneeb.systems.review.${reviewId}`;
}
