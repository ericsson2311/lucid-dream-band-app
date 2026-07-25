"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDuration } from "@/lib/format";
import SongDetailModal from "@/components/SongDetailModal";

export default function SongList({ table, heading, refreshSignal }) {
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedSong, setSelectedSong] = useState(null);

  useEffect(() => {
    loadSongs();
  }, [table, refreshSignal]);

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

  return (
    <section>
      <h2 className="mb-6 font-serif text-3xl">{heading}</h2>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : songs.length === 0 ? (
        <p className="text-white/60">Noch keine Songs.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {songs.map((song) => (
            <li key={song.id}>
              <button
                onClick={() => setSelectedSong(song)}
                className="flex w-full items-start justify-between gap-4 py-3 text-left transition-colors hover:text-white/70"
              >
                <span className="min-w-0 flex-1 break-words">
                  {song.title}
                  {song.artist && <span className="ml-2 text-white/40">{song.artist}</span>}
                </span>
                <span className="shrink-0 text-white/60">
                  {formatDuration(song.length_seconds)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {selectedSong && (
        <SongDetailModal
          song={selectedSong}
          table={table}
          onClose={() => setSelectedSong(null)}
          onSaved={loadSongs}
          onDeleted={loadSongs}
        />
      )}
    </section>
  );
}
