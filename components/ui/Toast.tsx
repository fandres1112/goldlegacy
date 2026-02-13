'use client';

import { useEffect, useState } from "react";
import { CheckCircle2, X } from "lucide-react";

type Toast = {
  id: string;
  message: string;
  type?: "success" | "error";
};

let toastId = 0;
const listeners = new Set<(toasts: Toast[]) => void>();
let toasts: Toast[] = [];

function notify(message: string, type: "success" | "error" = "success") {
  const id = String(++toastId);
  toasts = [...toasts, { id, message, type }];
  listeners.forEach((listener) => listener(toasts));

  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    listeners.forEach((listener) => listener(toasts));
  }, 3000);
}

export function toast(message: string, type?: "success" | "error") {
  notify(message, type);
}

export function ToastContainer() {
  const [state, setState] = useState<Toast[]>([]);

  useEffect(() => {
    listeners.add(setState);
    return () => {
      listeners.delete(setState);
    };
  }, []);

  if (state.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {state.map((toast) => (
        <div
          key={toast.id}
          className="glass-surface rounded-2xl px-4 py-3 flex items-center gap-3 min-w-[280px] max-w-sm shadow-gold-soft border border-gold/20 animate-in slide-in-from-right-5 fade-in duration-300 pointer-events-auto"
        >
          <div className="flex-shrink-0">
            {toast.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 text-gold" />
            ) : (
              <X className="h-5 w-5 text-red-400" />
            )}
          </div>
          <p className="text-sm text-white flex-1">{toast.message}</p>
        </div>
      ))}
    </div>
  );
}
