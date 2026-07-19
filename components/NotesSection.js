"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDateTime } from "@/lib/format";
import NoteEditorModal from "@/components/NoteEditorModal";

function previewText(html) {
  const text = html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return text.length > 120 ? `${text.slice(0, 120)}…` : text;
}

export default function NotesSection() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeNote, setActiveNote] = useState(undefined);

  useEffect(() => {
    loadNotes();
  }, []);

  async function loadNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from("notes")
      .select("*")
      .order("updated_at", { ascending: false });
    if (error) setError(error.message);
    else setNotes(data);
    setLoading(false);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Notizen</h2>
        <button
          onClick={() => setActiveNote(null)}
          className="border border-white px-4 py-2 text-sm transition-colors hover:bg-white hover:text-black"
        >
          + Neue Notiz
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : notes.length === 0 ? (
        <p className="text-white/60">Noch keine Notizen.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {notes.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => setActiveNote(note)}
                className="w-full py-3 text-left transition-colors hover:text-white/70"
              >
                <p>{note.title || "Ohne Titel"}</p>
                {note.content && (
                  <p className="mt-1 text-sm text-white/40">{previewText(note.content)}</p>
                )}
                <p className="mt-1 text-xs text-white/30">{formatDateTime(note.updated_at)}</p>
              </button>
            </li>
          ))}
        </ul>
      )}

      {activeNote !== undefined && (
        <NoteEditorModal
          note={activeNote}
          onClose={() => setActiveNote(undefined)}
          onSaved={loadNotes}
        />
      )}
    </section>
  );
}
