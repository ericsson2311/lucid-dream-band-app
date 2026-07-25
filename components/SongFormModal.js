"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { parseDuration } from "@/lib/format";
import Modal from "@/components/Modal";

// Neuen Song anlegen – als Dialog, damit die Songlisten oben stehen bleiben.
export default function SongFormModal({ defaultTable = "covers", onClose, onSaved }) {
  const [table, setTable] = useState(defaultTable);
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [length, setLength] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) {
      setError("Bitte einen Titel angeben.");
      return;
    }

    let length_seconds = null;
    if (length.trim()) {
      length_seconds = parseDuration(length.trim());
      if (length_seconds === null) {
        setError("Länge bitte im Format mm:ss angeben, z.B. 3:45");
        return;
      }
    }

    setSaving(true);
    const { error } = await supabase.from(table).insert({
      title: title.trim(),
      artist: artist.trim() || null,
      length_seconds,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.(table);
    onClose();
  }

  return (
    <Modal title="Song hinzufügen" onClose={onClose} width="max-w-lg">
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div className="inline-flex self-start border border-white/20">
          <button
            type="button"
            onClick={() => setTable("covers")}
            className={`px-4 py-2 text-sm transition-colors ${
              table === "covers" ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            Cover
          </button>
          <button
            type="button"
            onClick={() => setTable("originals")}
            className={`px-4 py-2 text-sm transition-colors ${
              table === "originals" ? "bg-white text-black" : "text-white/70 hover:text-white"
            }`}
          >
            Eigen
          </button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Titel</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Interpret (optional)</label>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Länge (mm:ss, optional)</label>
          <input
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="3:45"
            className="w-32 border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="self-start border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
        >
          {saving ? "Speichert…" : "Hinzufügen"}
        </button>
      </form>
    </Modal>
  );
}
