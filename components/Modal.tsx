"use client";

import { useEffect, type ReactNode } from "react";

/** Ventana modal con fondo difuminado; se cierra con Esc, con la X o haciendo clic fuera. */
export function Modal({ title, label, onClose, children }: { title: string; label?: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="modal-backdrop fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass flex max-h-[calc(100dvh-1rem)] min-h-0 w-full max-w-5xl flex-col overflow-hidden sm:max-h-[92dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 px-4 py-2 sm:px-5 sm:py-3">
          <div className="min-w-0">
            {label && <div className="hud-label text-cyan-300">{label}</div>}
            <h2 className="text-base font-semibold text-white sm:text-lg">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="min-h-11 min-w-11 shrink-0 rounded-full border border-white/15 px-3 py-1 text-sm text-slate-300 transition hover:border-white/40 hover:text-white"
            aria-label="Cerrar"
          >
            ✕ <span className="hidden sm:inline">Cerrar</span>
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain p-3 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
