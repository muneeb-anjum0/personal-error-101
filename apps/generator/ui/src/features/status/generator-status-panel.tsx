import { StatusIndicator } from "../../components/status-indicator";
import { useHealthStatus } from "../../hooks/use-health-status";

export function GeneratorStatusPanel() {
  const backendStatus = useHealthStatus();
  const backendTone =
    backendStatus.kind === "healthy"
      ? "ready"
      : backendStatus.kind === "error"
        ? "error"
        : "pending";

  return (
    <main className="app-shell">
      <section className="status-panel" aria-labelledby="generator-title">
        <h1 id="generator-title">Portfolio Generator</h1>
        <div className="status-list" aria-live="polite">
          <StatusIndicator label="Backend Status" value={backendStatus.label} tone={backendTone} />
          <StatusIndicator label="GitHub" value="Not Configured" tone="pending" />
          <StatusIndicator label="AI Model" value="Not Configured" tone="pending" />
          <StatusIndicator label="Content Storage" value="Ready" tone="ready" />
        </div>
        {backendStatus.kind === "error" ? (
          <p className="error-message">{backendStatus.message}</p>
        ) : null}
      </section>
    </main>
  );
}
