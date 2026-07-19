"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";

const REHEARSAL_ID = "00000000-0000-0000-0000-000000000001";

export default function NextRehearsalCard() {
  const [rehearsal, setRehearsal] = useState(null);
  const [pool, setPool] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [selected, setSelected] = useState({});

  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    const [coversRes, originalsRes, rehearsalRes] = await Promise.all([
      supabase.from("covers").select("id, title").order("title"),
      supabase.from("originals").select("id, title").order("title"),
      supabase.from("next_rehearsal").select("*").eq("id", REHEARSAL_ID).maybeSingle(),
    ]);
    const firstError = coversRes.error || originalsRes.error || rehearsalRes.error;
    if (firstError) {
      setError(firstError.message);
    } else {
      setPool([
        ...coversRes.data.map((s) => ({ ...s, source: "covers" })),
        ...originalsRes.data.map((s) => ({ ...s, source: "originals" })),
      ]);
      setRehearsal(rehearsalRes.data);
    }
    setLoading(false);
  }

  function startEditing() {
    setError("");
    setDate(rehearsal?.rehearsal_date ?? "");
    setTime(rehearsal?.rehearsal_time ?? "");
    const initial = {};
    (rehearsal?.songs ?? []).forEach((s) => {
      initial[`${s.source}-${s.id}`] = s;
    });
    setSelected(initial);
    setEditing(true);
  }

  function toggleSong(song) {
    const key = `${song.source}-${song.id}`;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[key]) delete next[key];
      else next[key] = song;
      return next;
    });
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!date) {
      setError("Bitte ein Datum angeben.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("next_rehearsal").upsert({
      id: REHEARSAL_ID,
      rehearsal_date: date,
      rehearsal_time: time || null,
      songs: Object.values(selected).map(({ id, title, source }) => ({ id, title, source })),
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    setEditing(false);
    loadAll();
  }

  if (loading) {
    return (
      <div className="border border-white/20 px-6 py-5">
        <p className="text-white/60">Lade…</p>
      </div>
    );
  }

  return (
    <div className="border border-white/20 px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-serif text-2xl">Nächste Probe</h3>
        {!editing && (
          <button
            onClick={startEditing}
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            Bearbeiten
          </button>
        )}
      </div>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/60">Datum</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm text-white/60">Uhrzeit (optional)</label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
              />
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm text-white/60">Songs auf der Tagesordnung</p>
            {pool.length === 0 ? (
              <p className="text-sm text-white/40">Noch keine Songs vorhanden.</p>
            ) : (
              <ul className="max-h-56 divide-y divide-white/10 overflow-y-auto border-t border-white/10">
                {pool.map((song) => {
                  const key = `${song.source}-${song.id}`;
                  const checked = Boolean(selected[key]);
                  return (
                    <li key={key}>
                      <label className="flex cursor-pointer items-center gap-3 py-2 text-sm">
                        <input type="checkbox" checked={checked} onChange={() => toggleSong(song)} />
                        {song.title}
                      </label>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
            >
              {saving ? "Speichert…" : "Speichern"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="text-sm text-white/60 transition-colors hover:text-white"
            >
              Abbrechen
            </button>
          </div>
        </form>
      ) : rehearsal?.rehearsal_date ? (
        <>
          <p className="text-white/80">
            {formatDate(rehearsal.rehearsal_date)}
            {rehearsal.rehearsal_time ? `, ${rehearsal.rehearsal_time} Uhr` : ""}
          </p>
          {rehearsal.songs?.length > 0 ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-white/70">
              {rehearsal.songs.map((s) => (
                <li key={`${s.source}-${s.id}`}>{s.title}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-white/40">Noch keine Songs ausgewählt.</p>
          )}
        </>
      ) : (
        <p className="text-white/60">Noch keine Probe geplant.</p>
      )}
    </div>
  );
}
