import { useMemo, useState } from "react";
import type {
  GitDiffSummary,
  PublishingConfirmationToken,
  PublishingPreflightResult,
  PublishingRun
} from "@muneeb-systems/shared-types";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { useApiResource } from "../../hooks/use-api-resource";
import { toFriendlyError } from "../../services/api-client/api-error";
import { generatorApiClient } from "../../services/api-client/api-client";

const commitMessage = "content(portfolio): publish approved portfolio updates";
const applyPhrase = "APPLY APPROVED CONTENT LOCALLY";

export function PublishingPage() {
  const bundles = useApiResource((signal) => generatorApiClient.publishingBundles(signal), []);
  const runs = useApiResource((signal) => generatorApiClient.publishingRuns(signal), []);
  const readiness = useApiResource((signal) => generatorApiClient.gitPushReadiness(signal), []);
  const token = useApiResource((signal) => generatorApiClient.githubAuthCheck(signal), []);
  const [selectedBundleId, setSelectedBundleId] = useState("");
  const [run, setRun] = useState<PublishingRun | null>(null);
  const [preflight, setPreflight] = useState<PublishingPreflightResult | null>(null);
  const [diff, setDiff] = useState<GitDiffSummary | null>(null);
  const [gitDiff, setGitDiff] = useState<GitDiffSummary | null>(null);
  const [applyText, setApplyText] = useState("");
  const [applyConfirmation, setApplyConfirmation] = useState<PublishingConfirmationToken | null>(
    null
  );
  const [commitConfirmation, setCommitConfirmation] = useState<PublishingConfirmationToken | null>(
    null
  );
  const [pushConfirmation, setPushConfirmation] = useState<PublishingConfirmationToken | null>(
    null
  );
  const [rollbackConfirmation, setRollbackConfirmation] =
    useState<PublishingConfirmationToken | null>(null);
  const [message, setMessage] = useState(commitMessage);
  const { notify } = useToast();

  const readyBundles = useMemo(
    () =>
      bundles.data?.items.filter(
        (bundle) => bundle.status === "PREPARED" || bundle.status === "VALIDATED"
      ) ?? [],
    [bundles.data]
  );
  const activeRun = run ?? runs.data?.items[0] ?? null;

  async function act<T>(action: () => Promise<T>, onSuccess: (value: T) => void, label: string) {
    try {
      const value = await action();
      onSuccess(value);
      notify(label);
      await runs.refresh();
      await readiness.refresh();
    } catch (error) {
      notify(toFriendlyError(error));
    }
  }

  if (bundles.loading && !bundles.data) {
    return <LoadingState label="Loading publishing bundles" />;
  }

  if (bundles.error && !bundles.data) {
    return <ErrorState message={bundles.error} onRetry={() => void bundles.refresh()} />;
  }

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">PUBLISH</p>
        <h1>Safe Local Publishing</h1>
        <p>GITHUB PUSH IS THE FINAL AUTOMATED STEP. NO VERCEL DEPLOYMENT WILL BE PERFORMED.</p>
      </header>

      <div className="status-grid">
        <article className="metric-card">
          <p>Ready Bundles</p>
          <strong>{readyBundles.length}</strong>
        </article>
        <article className="metric-card">
          <p>Git State</p>
          <strong>{readiness.data?.workingTreeState ?? "UNKNOWN"}</strong>
        </article>
        <article className="metric-card">
          <p>GitHub API</p>
          <strong>{token.data?.configured ? "TOKEN CONFIGURED" : "TOKEN NOT CONFIGURED"}</strong>
        </article>
      </div>

      <div className="content-layout">
        <aside className="panel file-list">
          <h2>Select Bundle</h2>
          {readyBundles.map((bundle) => (
            <button
              key={bundle.id}
              aria-pressed={selectedBundleId === bundle.id}
              type="button"
              onClick={() => setSelectedBundleId(bundle.id)}
            >
              <span>{bundle.id}</span>
              <small>
                {bundle.status} / {bundle.approvalIds.length} APPROVALS
              </small>
              <small>{bundle.validation.valid ? "VALID" : "INVALID"}</small>
            </button>
          ))}
          {readyBundles.length === 0 ? <p className="muted">NO READY BUNDLES</p> : null}
        </aside>

        <article className="panel editor-panel">
          <h2>Publishing Wizard</h2>
          <Step title="1. SELECT BUNDLE" state={selectedBundleId ? "READY" : "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!selectedBundleId}
                onClick={() =>
                  void act(
                    () => generatorApiClient.createPublishingRun(selectedBundleId),
                    (value) => setRun(value),
                    "Publishing run created"
                  )
                }
              >
                CREATE RUN
              </button>
            </div>
          </Step>

          <Step title="2. PREFLIGHT" state={activeRun?.currentStage ?? "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.runPublishingPreflight(activeRun?.id ?? ""),
                    (value) => {
                      setPreflight(value);
                      setApplyConfirmation(value.confirmation);
                    },
                    "Preflight complete"
                  )
                }
              >
                RUN PREFLIGHT
              </button>
            </div>
            {preflight ? (
              <ul className="issue-list">
                {preflight.checks.map((check) => (
                  <li key={check.name}>
                    {check.status} / {check.name} / {check.message}
                  </li>
                ))}
              </ul>
            ) : null}
          </Step>

          <Step title="3. REVIEW CHANGES" state={diff ? "READY" : "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.publishingRunDiff(activeRun?.id ?? ""),
                    setDiff,
                    "Structured diff loaded"
                  )
                }
              >
                LOAD STRUCTURED DIFF
              </button>
            </div>
            {diff ? <pre className="json-viewer">{JSON.stringify(diff, null, 2)}</pre> : null}
          </Step>

          <Step title="4. CREATE BACKUP" state={activeRun?.backupId ? "READY" : "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.createPublishingBackup(activeRun?.id ?? ""),
                    () => undefined,
                    "Backup created"
                  )
                }
              >
                CREATE BACKUP
              </button>
            </div>
          </Step>

          <Step title="5. APPLY CONTENT" state={activeRun?.currentStage ?? "WAITING"}>
            <label className="field">
              <span>Confirmation phrase</span>
              <input value={applyText} onChange={(event) => setApplyText(event.target.value)} />
              <small>{applyPhrase}</small>
            </label>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun || !applyConfirmation || applyText !== applyPhrase}
                onClick={() =>
                  void act(
                    () =>
                      generatorApiClient.applyPublishingRun(
                        activeRun?.id ?? "",
                        applyConfirmation?.token ?? ""
                      ),
                    setRun,
                    "Content applied locally"
                  )
                }
              >
                APPLY APPROVED CONTENT LOCALLY
              </button>
            </div>
          </Step>

          <Step title="6. VALIDATE PORTFOLIO" state={activeRun?.currentStage ?? "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.validatePublishingRun(activeRun?.id ?? ""),
                    () => undefined,
                    "Public content validated"
                  )
                }
              >
                VALIDATE CONTENT
              </button>
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.buildPublishingRun(activeRun?.id ?? ""),
                    () => undefined,
                    "Portfolio build validation complete"
                  )
                }
              >
                BUILD AND TEST PORTFOLIO
              </button>
            </div>
          </Step>

          <Step title="7. REVIEW GIT DIFF" state={gitDiff ? "READY" : "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.publishingGitDiff(activeRun?.id ?? ""),
                    setGitDiff,
                    "Git diff loaded"
                  )
                }
              >
                LOAD GIT DIFF
              </button>
            </div>
            {gitDiff ? <pre className="json-viewer">{JSON.stringify(gitDiff, null, 2)}</pre> : null}
          </Step>

          <Step title="8. CREATE COMMIT" state={activeRun?.commitHash ? "COMMITTED" : "WAITING"}>
            <label className="field">
              <span>Commit message</span>
              <input value={message} onChange={(event) => setMessage(event.target.value)} />
            </label>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.prepareCommitConfirmation(activeRun?.id ?? ""),
                    setCommitConfirmation,
                    "Commit confirmation prepared"
                  )
                }
              >
                PREPARE COMMIT CONFIRMATION
              </button>
              <button
                type="button"
                disabled={!activeRun || !commitConfirmation}
                onClick={() =>
                  void act(
                    () =>
                      generatorApiClient.commitPublishingRun(activeRun?.id ?? "", {
                        message,
                        confirmationToken: commitConfirmation?.token ?? ""
                      }),
                    () => undefined,
                    "Commit created"
                  )
                }
              >
                CREATE COMMIT
              </button>
            </div>
          </Step>

          <Step
            title="9. PUSH TO GITHUB"
            state={activeRun?.pushResult?.pushed ? "PUSHED" : "WAITING"}
          >
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.preparePushConfirmation(activeRun?.id ?? ""),
                    setPushConfirmation,
                    "Push confirmation prepared"
                  )
                }
              >
                PREPARE PUSH CONFIRMATION
              </button>
              <button
                type="button"
                disabled={!activeRun || !pushConfirmation}
                onClick={() =>
                  void act(
                    () =>
                      generatorApiClient.pushPublishingRun(
                        activeRun?.id ?? "",
                        pushConfirmation?.token ?? ""
                      ),
                    () => undefined,
                    "Push attempted"
                  )
                }
              >
                PUSH TO GITHUB
              </button>
            </div>
          </Step>

          <Step title="10. COMPLETE / ROLLBACK" state={activeRun?.currentStage ?? "WAITING"}>
            <div className="toolbar">
              <button
                type="button"
                disabled={!activeRun}
                onClick={() =>
                  void act(
                    () => generatorApiClient.prepareRollbackConfirmation(activeRun?.id ?? ""),
                    setRollbackConfirmation,
                    "Rollback confirmation prepared"
                  )
                }
              >
                PREPARE ROLLBACK
              </button>
              <button
                type="button"
                disabled={!activeRun || !rollbackConfirmation}
                onClick={() =>
                  void act(
                    () =>
                      generatorApiClient.rollbackPublishingRun(
                        activeRun?.id ?? "",
                        rollbackConfirmation?.token ?? ""
                      ),
                    () => undefined,
                    "Rollback attempted"
                  )
                }
              >
                ROLLBACK LOCAL CONTENT
              </button>
            </div>
          </Step>
        </article>
      </div>

      <GitHubSetupPanel />
    </section>
  );
}

function Step({
  title,
  state,
  children
}: {
  title: string;
  state: string;
  children: React.ReactNode;
}) {
  return (
    <section className="publish-step">
      <div>
        <h3>{title}</h3>
        <span className="status-pill">{state}</span>
      </div>
      {children}
    </section>
  );
}

function GitHubSetupPanel() {
  return (
    <article className="panel editor-panel">
      <h2>GitHub Setup</h2>
      <div className="two-column">
        <section>
          <h3>GITHUB API ACCESS</h3>
          <ul className="issue-list">
            <li>Create a GitHub Personal Access Token, not a generic API key.</li>
            <li>Use a fine-grained token named MUNEEB.SYSTEMS Local Generator.</li>
            <li>Choose Only select repositories when you know which repositories are needed.</li>
            <li>Use Contents: Read-only and Metadata: Read-only for repository discovery.</li>
            <li>
              Store it server-side as GITHUB_TOKEN in an ignored environment file or shell session.
            </li>
          </ul>
        </section>
        <section>
          <h3>GIT PUSH AUTHENTICATION</h3>
          <ul className="issue-list">
            <li>
              Git push uses the local Git client, Git Credential Manager, GitHub CLI, SSH, or HTTPS
              credentials.
            </li>
            <li>The REST token for discovery does not need to be reused for Git push.</li>
            <li>Never paste tokens into this UI, chat, localStorage, JSON, or committed files.</li>
            <li>
              Docker may not see host Git credentials; direct Windows mode is best for authenticated
              pushes.
            </li>
          </ul>
        </section>
      </div>
    </article>
  );
}
