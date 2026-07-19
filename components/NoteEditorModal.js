"use client";

import { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { supabase } from "@/lib/supabase";
import { BulletList, setBulletListStyle } from "@/lib/dashBulletList";

function ToolbarButton({ active, onClick, children, label }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      aria-label={label}
      className={`border px-3 py-1.5 text-sm transition-colors ${
        active
          ? "border-white bg-white text-black"
          : "border-white/20 text-white/80 hover:border-white"
      }`}
    >
      {children}
    </button>
  );
}

export default function NoteEditorModal({ note, onClose, onSaved }) {
  const [title, setTitle] = useState(note?.title ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit.configure({ bulletList: false }), BulletList, Underline],
    content: note?.content ?? "",
    editorProps: {
      attributes: {
        class: "note-editor min-h-[12rem] outline-none",
      },
    },
  });

  async function handleSave() {
    if (!editor) return;
    setError("");
    setSaving(true);
    const payload = {
      title: title.trim() || "Ohne Titel",
      content: editor.getHTML(),
      updated_at: new Date().toISOString(),
    };
    const { error } = note?.id
      ? await supabase.from("notes").update(payload).eq("id", note.id)
      : await supabase.from("notes").insert(payload);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  async function handleDelete() {
    if (!note?.id) return;
    if (!window.confirm("Diese Notiz wirklich löschen?")) return;
    const { error } = await supabase.from("notes").delete().eq("id", note.id);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved();
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/80 px-4 py-10"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl border border-white/20 bg-black p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titel"
            className="w-full bg-transparent font-serif text-3xl outline-none placeholder:text-white/30"
          />
          <button
            onClick={onClose}
            className="shrink-0 text-sm text-white/60 transition-colors hover:text-white"
          >
            Schließen
          </button>
        </div>

        {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

        <div className="mb-3 flex flex-wrap gap-2">
          <ToolbarButton
            label="Fett"
            active={editor?.isActive("bold")}
            onClick={() => editor.chain().focus().toggleBold().run()}
          >
            <strong>F</strong>
          </ToolbarButton>
          <ToolbarButton
            label="Kursiv"
            active={editor?.isActive("italic")}
            onClick={() => editor.chain().focus().toggleItalic().run()}
          >
            <em>K</em>
          </ToolbarButton>
          <ToolbarButton
            label="Unterstrichen"
            active={editor?.isActive("underline")}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
          >
            <span className="underline">U</span>
          </ToolbarButton>
          <ToolbarButton
            label="Aufzählungsliste mit Punkten"
            active={editor?.isActive("bulletList", { listStyle: "bullet" })}
            onClick={() => setBulletListStyle(editor, "bullet")}
          >
            •
          </ToolbarButton>
          <ToolbarButton
            label="Aufzählungsliste mit Strichen"
            active={editor?.isActive("bulletList", { listStyle: "dash" })}
            onClick={() => setBulletListStyle(editor, "dash")}
          >
            –
          </ToolbarButton>
          <ToolbarButton
            label="Nummerierte Liste"
            active={editor?.isActive("orderedList")}
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
          >
            1.
          </ToolbarButton>
        </div>

        <div className="border border-white/20 px-3 py-2">
          <EditorContent editor={editor} />
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={handleSave}
            disabled={saving}
            className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
          >
            {saving ? "Speichert…" : "Speichern"}
          </button>
          {note?.id && (
            <button
              onClick={handleDelete}
              className="text-sm text-white/40 transition-colors hover:text-red-400"
            >
              Notiz löschen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
