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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-3 backdrop-blur-sm sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="glass flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-white/10 px-5 py-3">
          <div>
            {label && <div className="hud-label text-cyan-300">{label}</div>}
            <h2 className="text-lg font-semibold text-white">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full border border-white/15 px-3 py-1 text-sm text-slate-300 transition hover:border-white/40 hover:text-white"
            aria-label="Cerrar"
          >
            ✕ <span className="hidden sm:inline">Cerrar</span>
          </button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-5">{children}</div>
      </div>
    </div>
  );
}
