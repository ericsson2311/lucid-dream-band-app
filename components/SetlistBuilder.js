"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDuration } from "@/lib/format";

export default function SetlistBuilder() {
  const [pool, setPool] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [coversRes, originalsRes, setlistsRes] = await Promise.all([
      supabase.from("covers").select("id, title, length_seconds").order("title"),
      supabase.from("originals").select("id, title, length_seconds").order("title"),
      supabase.from("setlists").select("*").order("created_at", { ascending: false }),
    ]);
    const firstError = coversRes.error || originalsRes.error || setlistsRes.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setPool([
        ...coversRes.data.map((s) => ({ ...s, source: "covers" })),
        ...originalsRes.data.map((s) => ({ ...s, source: "originals" })),
      ]);
      setSaved(setlistsRes.data);
    }
    setLoading(false);
  }

  function addToSelected(song) {
    setSelected((prev) => [...prev, song]);
  }

  function removeSelected(index) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  const totalSeconds = selected.reduce((sum, s) => sum + (s.length_seconds || 0), 0);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || selected.length === 0) {
      setError("Bitte einen Namen und mindestens einen Song wählen.");
      return;
    }
    const { error } = await supabase.from("setlists").insert({
      name: name.trim(),
      items: selected.map(({ id, title, length_seconds, source }) => ({
        id,
        title,
        length_seconds,
        source,
      })),
    });
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setSelected([]);
    loadAll();
  }

  async function handleDeleteSetlist(id) {
    if (!window.confirm("Diese Setlist wirklich löschen?")) return;
    const { error } = await supabase.from("setlists").delete().eq("id", id);
    if (error) setError(error.message);
    else loadAll();
  }

  if (loading) return <p className="text-white/60">Lade…</p>;

  return (
    <section className="mx-auto max-w-4xl">
      <h2 className="mb-6 font-serif text-3xl">Setlist-Ersteller</h2>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-white/60">
            Songs auswählen
          </h3>
          {pool.length === 0 ? (
            <p className="text-white/60">Noch keine Songs vorhanden.</p>
          ) : (
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {pool.map((song) => (
                <li
                  key={`${song.source}-${song.id}`}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm">
                    {song.title}{" "}
                    <span className="text-white/40">
                      ({song.source === "covers" ? "Cover" : "Eigen"})
                    </span>
                  </span>
                  <button
                    onClick={() => addToSelected(song)}
                    className="text-sm text-white/60 transition-colors hover:text-white"
                  >
                    + Hinzufügen
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-white/60">
            Aktuelle Setlist
          </h3>
          {selected.length === 0 ? (
            <p className="text-white/60">Noch keine Songs gewählt.</p>
          ) : (
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {selected.map((song, i) => (
                <li key={i} className="flex items-center justify-between py-2">
                  <span className="text-sm">{song.title}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-white/60">{formatDuration(song.length_seconds)}</span>
                    <button
                      onClick={() => removeSelected(i)}
                      className="text-sm text-white/40 transition-colors hover:text-red-400"
                    >
                      Entfernen
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-white/80">
            Gesamtdauer: {formatDuration(totalSeconds)}
          </p>

          <form onSubmit={handleSave} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name der Setlist"
              className="flex-1 border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
            <button
              type="submit"
              className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black"
            >
              Setlist speichern
            </button>
          </form>
        </div>
      </div>

      <h3 className="mb-3 mt-10 text-sm uppercase tracking-wide text-white/60">
        Gespeicherte Setlists
      </h3>
      {saved.length === 0 ? (
        <p className="text-white/60">Noch keine Setlists gespeichert.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {saved.map((setlist) => {
            const total = setlist.items.reduce((sum, i) => sum + (i.length_seconds || 0), 0);
            const isOpen = expandedId === setlist.id;
            return (
              <li key={setlist.id} className="py-3">
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : setlist.id)}
                    className="text-left transition-colors hover:text-white/80"
                  >
                    {setlist.name}{" "}
                    <span className="text-white/40">
                      — {setlist.items.length} Songs, {formatDuration(total)}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDeleteSetlist(setlist.id)}
                    className="text-sm text-white/40 transition-colors hover:text-red-400"
                  >
                    Löschen
                  </button>
                </div>
                {isOpen && (
                  <ol className="ml-4 mt-2 list-decimal text-sm text-white/70">
                    {setlist.items.map((item, i) => (
                      <li key={i}>
                        {item.title} ({formatDuration(item.length_seconds)})
                      </li>
                    ))}
                  </ol>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
