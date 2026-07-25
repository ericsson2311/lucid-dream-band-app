"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { sanitizeFileName } from "@/lib/sanitizeFileName";
import { downloadIcs } from "@/lib/ics";
import Modal from "@/components/Modal";
import DeleteButton from "@/components/DeleteButton";

function stripFilePrefix(name) {
  return name.replace(/^\d+-/, "");
}

export default function DateDetailModal({ dateEntry, onClose, onSaved, onDeleted }) {
  const [title, setTitle] = useState(dateEntry.title ?? "");
  const [eventDate, setEventDate] = useState(dateEntry.event_date ?? "");
  const [eventTime, setEventTime] = useState(dateEntry.event_time ?? "");
  const [location, setLocation] = useState(dateEntry.location ?? "");
  const [address, setAddress] = useState(dateEntry.address ?? "");
  const [notes, setNotes] = useState(dateEntry.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [files, setFiles] = useState([]);
  const [filesLoading, setFilesLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const folder = dateEntry.id;

  // Für die Kartensuche die genaue Adresse bevorzugen, sonst den Ort
  const mapQuery = address.trim() || location.trim();

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setFilesLoading(true);
    const { data, error } = await supabase.storage.from("date-files").list(folder);
    if (error) setError(error.message);
    else setFiles(data);
    setFilesLoading(false);
  }

  function touched() {
    setSaved(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !eventDate) {
      setError("Titel und Datum sind Pflicht.");
      return;
    }
    setSaving(true);
    setSaved(false);
    const { error } = await supabase
      .from("dates")
      .update({
        title: title.trim(),
        event_date: eventDate,
        event_time: eventTime || null,
        location: location.trim() || null,
        address: address.trim() || null,
        notes: notes.trim() || null,
      })
      .eq("id", dateEntry.id);
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
    const path = `${folder}/${Date.now()}-${sanitizeFileName(file.name)}`;
    const { error } = await supabase.storage.from("date-files").upload(path, file);
    setUploading(false);
    if (error) {
      setError(error.message);
      return;
    }
    loadFiles();
  }

  async function handleDownload(name) {
    const { data, error } = await supabase.storage
      .from("date-files")
      .createSignedUrl(`${folder}/${name}`, 60);
    if (error) {
      setError(error.message);
      return;
    }
    window.open(data.signedUrl, "_blank");
  }

  async function handleDeleteFile(name) {
    const { error } = await supabase.storage.from("date-files").remove([`${folder}/${name}`]);
    if (error) setError(error.message);
    else loadFiles();
  }

  async function handleDeleteDate() {
    setError("");
    const { error } = await supabase.from("dates").delete().eq("id", dateEntry.id);
    if (error) {
      setError(error.message);
      return;
    }
    onDeleted?.();
    onClose();
  }

  return (
    <Modal title={title || "Ohne Titel"} onClose={onClose}>
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSave} className="mb-10 flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Titel</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              touched();
            }}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Datum</label>
            <input
              type="date"
              value={eventDate}
              onChange={(e) => {
                setEventDate(e.target.value);
                touched();
              }}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Uhrzeit (optional)</label>
            <input
              type="time"
              value={eventTime}
              onChange={(e) => {
                setEventTime(e.target.value);
                touched();
              }}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Ort (optional)</label>
          <input
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              touched();
            }}
            placeholder="z.B. Marktplatz"
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Adresse (optional)</label>
          <input
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              touched();
            }}
            placeholder="Straße, PLZ, Stadt"
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
          {mapQuery && (
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mapQuery)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 self-start text-sm text-white/60 underline transition-colors hover:text-white"
            >
              In Karten öffnen
            </a>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Notizen</label>
          <textarea
            rows={4}
            value={notes}
            onChange={(e) => {
              setNotes(e.target.value);
              touched();
            }}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <button
            type="submit"
            disabled={saving}
            className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {saving ? "Speichert…" : saved ? "Gespeichert" : "Speichern"}
          </button>
          <button
            type="button"
            onClick={() => downloadIcs(dateEntry)}
            className="border border-white/20 px-4 py-2 text-sm transition-colors hover:border-white"
          >
            Zum Kalender hinzufügen
          </button>
        </div>
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
                  <DeleteButton onDelete={() => handleDeleteFile(file.name)} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-10 flex justify-end border-t border-white/10 pt-5">
        <DeleteButton
          label="Termin löschen"
          confirmLabel="Termin wirklich löschen?"
          onDelete={handleDeleteDate}
        />
      </div>
    </Modal>
  );
}
