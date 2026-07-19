"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { parseDuration } from "@/lib/format";
import SongList from "@/components/SongList";

export default function SongsSection() {
  const [table, setTable] = useState("covers");
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [length, setLength] = useState("");
  const [error, setError] = useState("");
  const [coversRefresh, setCoversRefresh] = useState(0);
  const [originalsRefresh, setOriginalsRefresh] = useState(0);

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
      artist: artist.trim() || null,
      length_seconds,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setArtist("");
    setLength("");
    if (table === "covers") setCoversRefresh((n) => n + 1);
    else setOriginalsRefresh((n) => n + 1);
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-16">
      <section>
        <h2 className="mb-6 font-serif text-3xl">Song hinzufügen</h2>

        <form onSubmit={handleAdd} className="flex flex-col gap-3">
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

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm text-white/60">Titel</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
              />
            </div>
            <div className="flex flex-1 flex-col gap-1">
              <label className="text-sm text-white/60">Interpret (optional)</label>
              <input
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
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
          </div>
        </form>

        {error && <p className="mt-4 text-sm text-red-400">{error}</p>}
      </section>

      <SongList table="covers" heading="Coversongs" refreshSignal={coversRefresh} />
      <SongList table="originals" heading="Eigene Songs" refreshSignal={originalsRefresh} />
    </div>
  );
}
