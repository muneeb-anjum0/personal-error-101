import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

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
      <div className="toast-region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <ToastMessage
            key={toast.id}
            toast={toast}
            onDismiss={dismiss}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastMessage({
  toast,
  onDismiss
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
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
