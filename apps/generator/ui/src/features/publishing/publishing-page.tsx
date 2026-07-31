import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

export function PublishingPage() {
  const status = useApiResource((signal) => generatorApiClient.publishingStatus(signal), []);
  const bundles = useApiResource((signal) => generatorApiClient.publishingBundles(signal), []);
  const { notify } = useToast();

  async function prepare() {
    try {
      await generatorApiClient.preparePublishingBundle();
      notify("Publishing bundle prepared");
      await status.refresh();
      await bundles.refresh();
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  if (status.loading && !status.data) {
    return <LoadingState label="Loading publishing status" />;
  }

  if (status.error && !status.data) {
    return <ErrorState message={status.error} onRetry={() => void status.refresh()} />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">PUBLISH</p>
        <h1>Publishing Bundle</h1>
        <p>
          Prepare a manual publishing bundle. This workflow never commits, pushes, or deploys
          generated content.
        </p>
      </header>
      <div className="content-layout">
        <article className="panel">
          <h2>Status</h2>
          <dl className="key-value-list">
            <div>
              <dt>Bundles</dt>
              <dd>{status.data?.bundles ?? 0}</dd>
            </div>
            <div>
              <dt>Current</dt>
              <dd>{status.data?.currentBundleId ?? "NONE"}</dd>
            </div>
            <div>
              <dt>Ready</dt>
              <dd>{status.data?.readyForManualPublish ? "YES" : "NO"}</dd>
            </div>
            <div>
              <dt>Notice</dt>
              <dd>{status.data?.notice}</dd>
            </div>
          </dl>
          <div className="toolbar">
            <button type="button" onClick={() => void prepare()}>
              PREPARE BUNDLE
            </button>
          </div>
        </article>
        <aside className="panel file-list">
          <h2>Bundles</h2>
          {bundles.loading ? <LoadingState label="Loading bundles" /> : null}
          {bundles.error ? (
            <ErrorState message={bundles.error} onRetry={() => void bundles.refresh()} />
          ) : null}
          {bundles.data?.items.map((bundle) => (
            <button key={bundle.id} type="button">
              <span>{bundle.id}</span>
              <small>
                {bundle.status} / {bundle.diff.length} DIFFS / {bundle.approvalIds.length} APPROVALS
              </small>
            </button>
          ))}
        </aside>
      </div>
    </section>
  );
}
