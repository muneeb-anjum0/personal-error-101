import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { PortfolioDeploymentStatus } from "@muneeb-systems/shared-types";
import { generatorApiClient } from "../../services/api-client/api-client";

interface Toast {
  id: string;
  message: string;
}

const ToastContext = createContext({ notify: (() => {}) as (message: string) => void });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((message: string) => {
    setToasts((current) => {
      if (current.some((toast) => toast.message === message)) {
        return current;
      }
      return [...current, { id: crypto.randomUUID(), message }].slice(-4);
    });
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <SaveChangesToast notify={notify} />
      <div className="toast-region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function SaveChangesToast({ notify }: { notify: (message: string) => void }) {
  const [state, setState] = useState<PortfolioDeploymentStatus | null>(null);
  const [requesting, setRequesting] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setState(await generatorApiClient.portfolioDeploymentStatus());
    } catch {
      // The global save prompt stays quiet while the local API is unavailable.
    }
  }, []);

  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2500);
    return () => window.clearInterval(timer);
  }, [refresh]);

  useEffect(() => {
    if (state?.status === "SUCCEEDED" && !state.dirty) {
      notify("Website deployed. Your live portfolio is up to date.");
    }
  }, [notify, state?.deployedAt, state?.dirty, state?.status]);

  if (!state?.dirty && state?.status !== "DEPLOYING") return null;
  const deploying = state.status === "DEPLOYING" || requesting;

  async function deploy() {
    setRequesting(true);
    try {
      setState(await generatorApiClient.deployPortfolio());
    } catch (error) {
      notify(error instanceof Error ? error.message : "Website deployment could not start.");
    } finally {
      setRequesting(false);
    }
  }

  return (
    <aside className="save-changes-toast" aria-live="polite">
      <div>
        <strong>{deploying ? "DEPLOYING WEBSITE" : "WEBSITE CHANGES READY"}</strong>
        <span>
          {state.status === "FAILED"
            ? (state.error ?? "The last deployment failed.")
            : deploying
              ? "Building and publishing the static portfolio…"
              : `${state.changeReasons.length || 1} offline change${state.changeReasons.length === 1 ? "" : "s"} waiting to go live.`}
        </span>
      </div>
      <button type="button" disabled={deploying} onClick={() => void deploy()}>
        {deploying ? "SAVING…" : state.status === "FAILED" ? "RETRY SAVE" : "SAVE CHANGES"}
      </button>
    </aside>
  );
}

function ToastMessage({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => setExiting(true), 4000);
    const dismissTimer = window.setTimeout(() => onDismiss(toast.id), 4450);
    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(dismissTimer);
    };
  }, [onDismiss, toast.id]);

  return (
    <button
      className={`toast${exiting ? " is-exiting" : ""}`}
      type="button"
      onClick={() => onDismiss(toast.id)}
    >
      {toast.message}
    </button>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
