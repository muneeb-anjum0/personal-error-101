import { createContext, useCallback, useContext, useMemo, useState } from "react";

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

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-label="Notifications">
        {toasts.map((toast) => (
          <button
            key={toast.id}
            className="toast"
            type="button"
            onClick={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          >
            {toast.message}
          </button>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
