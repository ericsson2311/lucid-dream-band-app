"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import Modal from "@/components/Modal";

// Neuen Termin anlegen – Details (Adresse, Notizen, Dateien) folgen danach im
// Detail-Dialog, damit dieses Formular kurz bleibt.
export default function DateFormModal({ onClose, onSaved }) {
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !eventDate) {
      setError("Titel und Datum sind Pflicht.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("dates").insert({
      title: title.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      location: location.trim() || null,
    });
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <Modal title="Termin hinzufügen" onClose={onClose} width="max-w-lg">
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleAdd} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Titel</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Datum</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Uhrzeit (optional)</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Ort (optional)</label>
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
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
