import { useEffect, useMemo, useState } from "react";
import { GeneratorApiClient } from "../services/generator-api-client";

type HealthState =
  | { kind: "loading"; label: "Checking..." }
  | { kind: "healthy"; label: "Healthy" }
  | { kind: "error"; label: "Unavailable"; message: string };

export function useHealthStatus(): HealthState {
  const apiUrl = import.meta.env.VITE_GENERATOR_API_URL ?? "http://localhost:4000";
  const client = useMemo(() => new GeneratorApiClient(apiUrl), [apiUrl]);
  const [state, setState] = useState<HealthState>({ kind: "loading", label: "Checking..." });

  useEffect(() => {
    const controller = new AbortController();

    async function poll(): Promise<void> {
      try {
        const health = await client.getHealth(controller.signal);
        setState(health.status === "healthy" ? { kind: "healthy", label: "Healthy" } : state);
      } catch (error) {
        if (!controller.signal.aborted) {
          const message = error instanceof Error ? error.message : "Generator API is unavailable.";
          setState({ kind: "error", label: "Unavailable", message });
        }
      }
    }

    void poll();
    const interval = window.setInterval(() => {
      void poll();
    }, 10_000);

    return () => {
      controller.abort();
      window.clearInterval(interval);
    };
  }, [client]);

  return state;
}
