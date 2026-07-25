"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDuration } from "@/lib/format";
import DeleteButton from "@/components/DeleteButton";

export default function SetlistBuilder() {
  const [pool, setPool] = useState([]);
  const [selected, setSelected] = useState([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState(null);
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

  // Reihenfolge ist bei einer Setlist der Kern – Songs lassen sich verschieben.
  function moveSelected(index, direction) {
    const target = index + direction;
    setSelected((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function startEditing(setlist) {
    setEditingId(setlist.id);
    setName(setlist.name);
    setSelected(setlist.items);
    setError("");
    setExpandedId(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function cancelEditing() {
    setEditingId(null);
    setName("");
    setSelected([]);
    setError("");
  }

  const totalSeconds = selected.reduce((sum, s) => sum + (s.length_seconds || 0), 0);

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!name.trim() || selected.length === 0) {
      setError("Bitte einen Namen und mindestens einen Song wählen.");
      return;
    }
    const payload = {
      name: name.trim(),
      items: selected.map(({ id, title, length_seconds, source }) => ({
        id,
        title,
        length_seconds,
        source,
      })),
    };
    const { error } = editingId
      ? await supabase.from("setlists").update(payload).eq("id", editingId)
      : await supabase.from("setlists").insert(payload);
    if (error) {
      setError(error.message);
      return;
    }
    cancelEditing();
    loadAll();
  }

  async function handleDeleteSetlist(id) {
    const { error } = await supabase.from("setlists").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    if (editingId === id) cancelEditing();
    loadAll();
  }

  if (loading) return <p className="text-white/60">Lade…</p>;

  const covers = pool.filter((s) => s.source === "covers");
  const originals = pool.filter((s) => s.source === "originals");

  function renderPoolGroup(heading, songs) {
    return (
      <div className="mb-6">
        <p className="mb-2 text-sm text-white/50">{heading}</p>
        {songs.length === 0 ? (
          <p className="text-sm text-white/40">Keine Songs vorhanden.</p>
        ) : (
          <ul className="divide-y divide-white/10 border-t border-white/10">
            {songs.map((song) => (
              <li
                key={`${song.source}-${song.id}`}
                className="flex items-center justify-between gap-3 py-2"
              >
                <span className="min-w-0 break-words text-sm">{song.title}</span>
                <button
                  onClick={() => addToSelected(song)}
                  className="shrink-0 px-2 py-1 text-sm text-white/60 transition-colors hover:text-white"
                >
                  + Hinzufügen
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-4xl">
      <h2 className="mb-6 font-serif text-3xl">Setlist-Ersteller</h2>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-white/60">Songs auswählen</h3>
          {renderPoolGroup("Coversongs", covers)}
          {renderPoolGroup("Eigene Songs", originals)}
        </div>

        <div>
          <h3 className="mb-3 text-sm uppercase tracking-wide text-white/60">
            {editingId ? "Setlist bearbeiten" : "Aktuelle Setlist"}
          </h3>
          {selected.length === 0 ? (
            <p className="text-white/60">Noch keine Songs gewählt.</p>
          ) : (
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {selected.map((song, i) => (
                <li key={i} className="flex items-center justify-between gap-2 py-2">
                  <span className="min-w-0 flex-1 break-words text-sm">
                    <span className="mr-2 text-white/40">{i + 1}.</span>
                    {song.title}
                  </span>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      onClick={() => moveSelected(i, -1)}
                      disabled={i === 0}
                      aria-label="Nach oben"
                      className="px-2 py-1 text-white/60 transition-colors hover:text-white disabled:opacity-25"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveSelected(i, 1)}
                      disabled={i === selected.length - 1}
                      aria-label="Nach unten"
                      className="px-2 py-1 text-white/60 transition-colors hover:text-white disabled:opacity-25"
                    >
                      ↓
                    </button>
                    <span className="ml-2 text-sm text-white/60">
                      {formatDuration(song.length_seconds)}
                    </span>
                    <button
                      onClick={() => removeSelected(i)}
                      aria-label="Entfernen"
                      className="ml-1 px-2 py-1 text-sm text-white/40 transition-colors hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-sm text-white/80">Gesamtdauer: {formatDuration(totalSeconds)}</p>

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
              {editingId ? "Änderungen speichern" : "Setlist speichern"}
            </button>
          </form>
          {editingId && (
            <button
              onClick={cancelEditing}
              className="mt-3 text-sm text-white/60 transition-colors hover:text-white"
            >
              Bearbeiten abbrechen
            </button>
          )}
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
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setExpandedId(isOpen ? null : setlist.id)}
                    className="min-w-0 flex-1 py-1 text-left transition-colors hover:text-white/80"
                  >
                    {setlist.name}{" "}
                    <span className="text-white/40">
                      — {setlist.items.length} Songs, {formatDuration(total)}
                    </span>
                  </button>
                  <button
                    onClick={() => startEditing(setlist)}
                    className="shrink-0 px-2 py-1 text-sm text-white/60 transition-colors hover:text-white"
                  >
                    Bearbeiten
                  </button>
                </div>
                {isOpen && (
                  <>
                    <ol className="ml-4 mt-2 list-decimal text-sm text-white/70">
                      {setlist.items.map((item, i) => (
                        <li key={i}>
                          {item.title} ({formatDuration(item.length_seconds)})
                        </li>
                      ))}
                    </ol>
                    <div className="mt-3 flex justify-end">
                      <DeleteButton
                        label="Setlist löschen"
                        confirmLabel="Setlist wirklich löschen?"
                        onDelete={() => handleDeleteSetlist(setlist.id)}
                      />
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
