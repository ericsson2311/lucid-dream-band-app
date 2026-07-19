"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDuration, parseDuration } from "@/lib/format";

function stripFilePrefix(name) {
  return name.replace(/^\d+-/, "");
}

export default function SongDetailModal({ song, table, onClose, onSaved }) {
  const [length, setLength] = useState(
    song.length_seconds != null ? formatDuration(song.length_seconds) : ""
  );
  const [bpm, setBpm] = useState(song.bpm ?? "");
  const [songKey, setSongKey] = useState(song.song_key ?? "");
  const [notes, setNotes] = useState(song.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const folder = `${table}/${song.id}`;

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setFilesLoading(true);
    const { data, error } = await supabase.storage.from("song-files").list(folder);
    if (error) setError(error.message);
    else setFiles(data);
    setFilesLoading(false);
  }

  async function handleSaveDetails(e) {
    e.preventDefault();
    setError("");

    let length_seconds = null;
    if (length.trim()) {
      length_seconds = parseDuration(length.trim());
      if (length_seconds === null) {
        setError("Länge bitte im Format mm:ss angeben, z.B. 3:45");
        return;
      }
    }

    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from(table)
      .update({
        length_seconds,
        bpm: bpm === "" ? null : Number(bpm),
        song_key: songKey.trim() || null,
        notes: notes.trim() || null,
      })
      .eq("id", song.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setSaved(true);
    onSaved?.();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setUploading(true);
    const path = `${folder}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("song-files").upload(path, file);
    setUploading(false);
    if (error) {
      setError(error.message);
      return;
    }
    loadFiles();
  }

  async function handleDownload(name) {
    const { data, error } = await supabase.storage
      .from("song-files")
      .createSignedUrl(`${folder}/${name}`, 60);
    if (error) {
      setError(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDeleteFile(name) {
    if (!window.confirm("Diese Datei wirklich löschen?")) return;
    const { error } = await supabase.storage.from("song-files").remove([`${folder}/${name}`]);
    if (error) setError(error.message);
    else loadFiles();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl border border-white/20 bg-black p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-8 flex items-start justify-between gap-4">
          <h2 className="font-serif text-4xl leading-tight">{song.title}</h2>
          <button
            onClick={onClose}
            className="shrink-0 text-sm text-white/60 transition-colors hover:text-white"
          >
            Schließen
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <form onSubmit={handleSaveDetails} className="mb-10 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Länge (mm:ss)</label>
            <input
              value={length}
              onChange={(e) => {
                setLength(e.target.value);
                setSaved(false);
              }}
              placeholder="3:45"
              className="w-32 border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/60">BPM</label>
              <input
                type="number"
                min="0"
                value={bpm}
                onChange={(e) => {
                  setBpm(e.target.value);
                  setSaved(false);
                }}
                className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/60">Tonart</label>
              <input
                value={songKey}
                onChange={(e) => {
                  setSongKey(e.target.value);
                  setSaved(false);
                }}
                placeholder="z.B. Am, C#, Dm"
                className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Notizen</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                setSaved(false);
              }}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="self-start border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {saving ? "Speichert…" : saved ? "Gespeichert" : "Speichern"}
          </button>
        </form>

        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-white/60">Dateien</h3>

          <label className="mb-4 inline-block cursor-pointer border border-white/20 px-4 py-2 text-sm transition-colors hover:border-white">
            {uploading ? "Lädt hoch…" : "Datei hochladen"}
            <input type="file" onChange={handleUpload} disabled={uploading} className="hidden" />
          </label>

          {filesLoading ? (
            <p className="text-white/60">Lade…</p>
          ) : files.length === 0 ? (
            <p className="text-white/60">Noch keine Dateien.</p>
          ) : (
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {files.map((file) => (
                <li key={file.name} className="flex items-center justify-between py-2">
                  <span className="truncate text-sm">{stripFilePrefix(file.name)}</span>
                  <div className="flex shrink-0 items-center gap-4">
                    <button
                      onClick={() => handleDownload(file.name)}
                      className="text-sm text-white/60 transition-colors hover:text-white"
                    >
                      Herunterladen
                    </button>
                    <button
                      onClick={() => handleDeleteFile(file.name)}
                      className="text-sm text-white/40 transition-colors hover:text-red-400"
                    >
                      Löschen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
