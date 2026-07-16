"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDuration, parseDuration } from "@/lib/format";

export default function SongList({ table, heading }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [length, setLength] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadSongs();
  }, [table]);

  async function loadSongs() {
    setLoading(true);
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .order("title", { ascending: true });
    if (error) setError(error.message);
    else setSongs(data);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!title.trim()) return;

    let length_seconds = null;
    if (length.trim()) {
      length_seconds = parseDuration(length.trim());
      if (length_seconds === null) {
        setError("Länge bitte im Format mm:ss angeben, z.B. 3:45");
        return;
      }
    }

    const { error } = await supabase.from(table).insert({
      title: title.trim(),
      length_seconds,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setLength("");
    loadSongs();
  }

  async function handleDelete(id) {
    if (!window.confirm("Diesen Song wirklich löschen?")) return;
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) setError(error.message);
    else loadSongs();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <h2 className="mb-6 font-serif text-3xl">{heading}</h2>

      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1">
          <label className="text-sm text-white/60">Titel</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>
        <div className="flex flex-col gap-1 sm:w-32">
          <label className="text-sm text-white/60">Länge (mm:ss)</label>
          <input
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="3:45"
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>
        <button
          type="submit"
          className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black"
        >
          Hinzufügen
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : songs.length === 0 ? (
        <p className="text-white/60">Noch keine Songs.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {songs.map((song) => (
            <li key={song.id} className="flex items-center justify-between py-3">
              <span>{song.title}</span>
              <div className="flex items-center gap-4">
                <span className="text-white/60">{formatDuration(song.length_seconds)}</span>
                <button
                  onClick={() => handleDelete(song.id)}
                  className="text-sm text-white/40 transition-colors hover:text-red-400"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
