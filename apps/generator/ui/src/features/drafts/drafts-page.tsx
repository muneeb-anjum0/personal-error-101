import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

export function DraftsPage() {
  const drafts = useApiResource((signal) => generatorApiClient.drafts(signal), []);
  const reviews = useApiResource((signal) => generatorApiClient.reviews(signal), []);
  const { notify } = useToast();

  if (drafts.loading && !drafts.data) {
    return <LoadingState label="Loading generated drafts" />;
  }

  if (drafts.error && !drafts.data) {
    return <ErrorState message={drafts.error} onRetry={() => void drafts.refresh()} />;
  }

  async function openDraft(draftId: string) {
    try {
      const review = await generatorApiClient.openReview({
        draftId,
        reviewerLabel: "Muneeb Anjum"
      });
      window.history.pushState(null, "", `/review?reviewId=${encodeURIComponent(review.id)}`);
      window.dispatchEvent(new PopStateEvent("popstate"));
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">DRAFTS</p>
        <h1>Generated Drafts</h1>
        <p>
          Open private AI drafts into the manual review workflow before anything reaches public
          content.
        </p>
      </header>
      <div className="content-layout">
        <div className="panel file-list">
          {drafts.data?.items.length ? (
            drafts.data.items.map((draft) => {
              const review = reviews.data?.items.find((item) => item.draftId === draft.id);
              return (
                <button key={draft.id} type="button" onClick={() => void openDraft(draft.id)}>
                  <span>{draft.title}</span>
                  <small>{draft.repositoryFullName}</small>
                  <small>{review ? `REVIEW ${review.status}` : "NOT REVIEWED"}</small>
                </button>
              );
            })
          ) : (
            <p className="muted">NO DRAFTS AVAILABLE</p>
          )}
        </div>
        <article className="panel">
          <h2>Review Queue</h2>
          <dl className="key-value-list">
            <div>
              <dt>Drafts</dt>
              <dd>{drafts.data?.total ?? 0}</dd>
            </div>
            <div>
              <dt>Reviews</dt>
              <dd>{reviews.data?.total ?? 0}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
  );
}
