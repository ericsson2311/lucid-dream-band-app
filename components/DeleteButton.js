"use client";

import { useState } from "react";

// Zweistufiges Löschen im App-Design (statt window.confirm): erst "Löschen",
// dann die eigentliche Bestätigung direkt daneben.
export default function DeleteButton({ label = "Löschen", confirmLabel, onDelete }) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleConfirm() {
    setBusy(true);
    try {
      await onDelete();
    } finally {
      setBusy(false);
      setArmed(false);
    }
  }

  if (!armed) {
    return (
      <button
        type="button"
        onClick={() => setArmed(true)}
        className="text-sm text-white/40 transition-colors hover:text-red-400"
      >
        {label}
      </button>
    );
  }

  return (
    <span className="flex items-center gap-3 text-sm">
      <span className="text-white/60">{confirmLabel ?? "Wirklich löschen?"}</span>
      <button
        type="button"
        onClick={handleConfirm}
        disabled={busy}
        className="text-red-400 transition-opacity hover:opacity-80 disabled:opacity-50"
      >
        {busy ? "Löscht…" : "Ja"}
      </button>
      <button
        type="button"
        onClick={() => setArmed(false)}
        className="text-white/50 transition-colors hover:text-white"
      >
        Abbrechen
      </button>
    </span>
  );
}
