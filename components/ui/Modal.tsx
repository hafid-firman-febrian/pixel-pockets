"use client";

import { useEffect, type ReactNode } from "react";

interface ModalProps {
  title: string;
  description?: string;
  children: ReactNode;
  onClose: () => void;
}

export default function Modal({
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[calc(100vh-2rem)] w-full max-w-3xl overflow-y-auto border border-black bg-[#fbfbf8] shadow-[8px_8px_0_0_#000]"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-dashed border-slate-300 px-4 py-4 md:px-6">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-slate-500">
              /modal
            </p>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
              {description ? (
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-black bg-white px-3 py-2 text-xs font-bold uppercase text-slate-900 transition-colors hover:bg-slate-100"
          >
            Close
          </button>
        </div>

        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
