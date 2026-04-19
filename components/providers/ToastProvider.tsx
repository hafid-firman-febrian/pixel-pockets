"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface ToastItem {
  id: string;
  message: string;
}

interface ToastContextValue {
  showToast: (message: string) => void;
}

const TOAST_DURATION_MS = 3200;

const ToastContext = createContext<ToastContextValue | null>(null);

function Toast({
  message,
  onClose,
}: {
  message: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const timeoutId = window.setTimeout(onClose, TOAST_DURATION_MS);
    return () => window.clearTimeout(timeoutId);
  }, [onClose]);

  return (
    <div
      role="status"
      className="flex items-start gap-3 border border-black bg-yellow-300 px-4 py-3 text-sm text-slate-900 shadow-[6px_6px_0_0_#000]"
    >
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-[0.3em] text-slate-700">
          /sukses
        </p>
        <p className="mt-1 break-words font-medium">{message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="border border-black bg-white px-2 py-1 text-xs font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100"
        aria-label="Tutup notifikasi"
      >
        Tutup
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message: string) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, message }]);
  }, []);

  const contextValue = useMemo(
    () => ({
      showToast,
    }),
    [showToast],
  );

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-4 bottom-4 z-50 flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <Toast
              message={toast.message}
              onClose={() => dismissToast(toast.id)}
            />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
