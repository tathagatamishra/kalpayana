"use client";

import { useEffect, type ReactNode } from "react";
import { LuX } from "react-icons/lu";

export default function ConfirmModal({
  open,
  title = "Are you sure?",
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message: ReactNode;
  confirmLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, busy, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => !busy && onCancel()}
      />
      <div className="relative w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-100">{title}</h2>
          <button
            onClick={() => !busy && onCancel()}
            aria-label="Close"
            className="-mr-1 -mt-1 rounded-md p-1 text-zinc-500 hover:text-zinc-300"
          >
            <LuX className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-2 text-sm text-zinc-400">{message}</div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={busy}
            className="rounded-lg border border-zinc-700 px-3.5 py-1.5 text-sm hover:border-zinc-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            className="rounded-lg bg-red-500 px-3.5 py-1.5 text-sm font-semibold text-white hover:bg-red-400 disabled:opacity-50"
          >
            {busy ? "Working…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
