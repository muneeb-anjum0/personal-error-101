import { useState } from "react";
import { KeyValueList } from "../../components/data-display/key-value-list";
import { MetricCard } from "../../components/data-display/metric-card";
import { ErrorState, LoadingState } from "../../components/feedback/states";
import { useToast } from "../../components/feedback/toast-provider";
import { StatusIndicator } from "../../components/status/status-indicator";
import { useApiResource } from "../../hooks/use-api-resource";
import { generatorApiClient } from "../../services/api-client/api-client";

export function AiPage() {
  const runtime = useApiResource((signal) => generatorApiClient.aiRuntime(signal), []);
  const queue = useApiResource((signal) => generatorApiClient.queue(signal), []);
  const { notify } = useToast();
  const [prompt, setPrompt] = useState('Return {"ready":true,"message":"ok"} as JSON.');
  const [result, setResult] = useState<string>("");

  async function act(label: string, action: () => Promise<unknown>) {
    await action();
    notify(label);
    await runtime.refresh();
  }

  if (runtime.loading && !runtime.data) return <LoadingState label="Loading AI runtime" />;
  if (runtime.error && !runtime.data) {
    return (
      <ErrorState
        message={`AI RUNTIME OFFLINE / ${runtime.error}`}
        onRetry={() => void runtime.refresh()}
      />
    );
  }
  const data = runtime.data;
  if (!data) return null;

  return (
    <section className="page-stack">
      <header className="page-header">
        <p className="eyebrow">LOCAL AI</p>
        <h1>Local Qwen runtime</h1>
        <p>
          Inspect, connect, warm, and test the local OpenAI-compatible model endpoint before queue
          processing.
        </p>
      </header>

      <div className="status-grid">
        <article className="panel">
          <p className="eyebrow">RUNTIME</p>
          <StatusIndicator status={statusKind(data.status)} label={data.status} />
          <small>{data.mode}</small>
        </article>
        <MetricCard label="Context" value={data.contextSize} />
        <MetricCard label="Parallel" value={data.parallelRequests} />
        <MetricCard label="GPU layers" value={data.gpuLayers} />
        <MetricCard label="Max VRAM GB" value={data.maxVramGb} />
        <MetricCard label="Queued active" value={queue.data?.metrics.active ?? 0} />
      </div>

      <section className="panel repository-controls">
        <button
          type="button"
          onClick={() =>
            void act("AI configuration refreshed.", () => generatorApiClient.aiRuntime())
          }
        >
          CHECK CONFIGURATION
        </button>
        <button
          type="button"
          onClick={() => void act("AI endpoint checked.", () => generatorApiClient.checkAi())}
        >
          CHECK ENDPOINT
        </button>
        <button
          type="button"
          onClick={() =>
            void act("AI runtime start requested.", () => generatorApiClient.startAi())
          }
        >
          START MODEL
        </button>
        <button
          type="button"
          disabled={data.mode === "EXTERNAL_SERVER" || !data.ownsProcess}
          onClick={() => void act("AI runtime stop requested.", () => generatorApiClient.stopAi())}
        >
          STOP MODEL
        </button>
        <button
          type="button"
          onClick={() => void act("AI warm-up completed.", () => generatorApiClient.warmAi())}
        >
          WARM MODEL
        </button>
      </section>

      <section className="two-column">
        <article className="panel">
          <h2>Runtime Details</h2>
          <KeyValueList
            items={[
              { label: "Model", value: data.modelName },
              {
                label: "Model path",
                value: `${data.modelPath} / ${data.modelPathExists ? "exists" : "not found"}`
              },
              {
                label: "Executable",
                value: `${data.executablePath ?? "not configured"} / ${data.executablePathExists ? "exists" : "not found"}`
              },
              { label: "Base URL", value: data.baseUrl },
              { label: "Host URL", value: data.hostBaseUrl },
              {
                label: "Process management",
                value: data.processManagementAvailable
                  ? "available"
                  : "unavailable in current runtime"
              },
              { label: "Process ID", value: String(data.processId ?? "none") },
              { label: "Last health", value: data.lastHealthCheckAt ?? "never" },
              { label: "Last warm-up", value: data.lastWarmUpAt ?? "never" },
              { label: "Last error", value: data.lastError ?? "none" }
            ]}
          />
        </article>
        <article className="panel">
          <h2>Test Generation</h2>
          <label className="field">
            <span>Prompt</span>
            <textarea
              value={prompt}
              maxLength={1000}
              onChange={(event) => setPrompt(event.target.value)}
            />
          </label>
          <button
            type="button"
            onClick={() =>
              void generatorApiClient
                .testAiGeneration({ prompt, maxOutputTokens: 96 })
                .then((response) => setResult(response.rawText))
            }
          >
            TEST GENERATION
          </button>
          {result ? (
            <pre className="json-viewer">{result}</pre>
          ) : (
            <p className="muted">No test generation run yet.</p>
          )}
        </article>
      </section>
    </section>
  );
}

function statusKind(status: string) {
  if (status.includes("READY")) return "ready";
  if (status.includes("FAILED") || status.includes("INVALID") || status.includes("MISMATCH"))
    return "invalid";
  return "not_started";
}
