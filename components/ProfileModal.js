"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function ProfileModal({ profile, onClose, onSaved }) {
  const [name, setName] = useState(profile?.name ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

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
      </div>
    </div>
  );
}
