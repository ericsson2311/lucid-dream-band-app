"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { pushSupported, getPushState, enablePush, disablePush } from "@/lib/push";

const PUSH_LABELS = {
  unsupported: "Auf diesem Gerät nicht verfügbar.",
  unconfigured: "Noch nicht eingerichtet.",
  subscribed: "Aktiv auf diesem Gerät.",
  unsubscribed: "Auf diesem Gerät deaktiviert.",
  checking: "Prüfe…",
};

export default function ProfileModal({ profile, onClose, onSaved }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [pushState, setPushState] = useState("checking");
  const [pushBusy, setPushBusy] = useState(false);
  const [pushError, setPushError] = useState("");

  useEffect(() => {
    if (!pushSupported()) {
      setPushState("unsupported");
      return;
    }
    getPushState().then(setPushState);
  }, []);

  async function handleTogglePush() {
    setPushError("");
    setPushBusy(true);
    try {
      if (pushState === "subscribed") {
        await disablePush();
        setPushState("unsubscribed");
      } else {
        await enablePush(profile.id);
        setPushState("subscribed");
      }
    } catch (err) {
      setPushError(err.message || "Das hat leider nicht geklappt.");
    }
    setPushBusy(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name.trim()) {
      setError("Bitte einen Namen angeben.");
      return;
    }
    setSaving(true);
    const { data, error } = await supabase
      .from("profiles")
      .update({ name: name.trim(), updated_at: new Date().toISOString() })
      .eq("id", profile.id)
      .select()
      .single();
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.(data);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-white/20 bg-black p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="font-serif text-3xl leading-tight">Mein Profil</h2>
          <button
            onClick={onClose}
            className="shrink-0 text-sm text-white/60 transition-colors hover:text-white"
          >
            Schließen
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Anzeigename</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z.B. Eric"
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
            <p className="mt-1 text-sm text-white/40">
              Unter diesem Namen erscheinen deine Zu- und Absagen bei den Terminen.
            </p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="self-start border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
        </form>

        <div className="mt-8 border-t border-white/10 pt-6">
          <p className="text-sm text-white/60">Benachrichtigungen</p>
          <p className="mt-1 text-sm text-white/40">{PUSH_LABELS[pushState]}</p>
          {pushError && <p className="mt-2 text-sm text-red-400">{pushError}</p>}
          {(pushState === "subscribed" || pushState === "unsubscribed") && (
            <button
              type="button"
              onClick={handleTogglePush}
              disabled={pushBusy}
              className="mt-3 border border-white/20 px-4 py-2 text-sm transition-colors hover:border-white disabled:opacity-50"
            >
              {pushBusy
                ? "Einen Moment…"
                : pushState === "subscribed"
                  ? "Auf diesem Gerät deaktivieren"
                  : "Auf diesem Gerät aktivieren"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
