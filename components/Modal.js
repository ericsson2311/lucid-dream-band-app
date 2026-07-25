"use client";

import { useEffect } from "react";

// Gemeinsame Hülle für alle Dialoge: Klick auf den Hintergrund und Escape
// schließen, der Seiteninhalt dahinter scrollt nicht mit.
export default function Modal({ title, onClose, children, width = "max-w-xl" }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={`w-full ${width} border border-white/20 bg-black p-6 sm:p-8`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          {typeof title === "string" ? (
            <h2 className="min-w-0 break-words font-serif text-3xl leading-tight sm:text-4xl">
              {title}
            </h2>
          ) : (
            // z.B. ein Eingabefeld als Titel (Notiz-Editor)
            <div className="min-w-0 flex-1">{title}</div>
          )}
          <button
            onClick={onClose}
            className="-m-2 shrink-0 p-2 text-sm text-white/60 transition-colors hover:text-white"
          >
            Schließen
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
