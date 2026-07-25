"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { todayIso } from "@/lib/format";
import Modal from "@/components/Modal";
import DeleteButton from "@/components/DeleteButton";

// Ein Dialog für neue und bestehende Einträge: entry = null bedeutet "neu".
export default function FinanceEntryModal({ entry, onClose, onSaved }) {
  const isNew = !entry;
  const [type, setType] = useState(entry?.type ?? "in");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [entryDate, setEntryDate] = useState(entry?.entry_date ?? todayIso());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!description.trim() || !amount || numericAmount <= 0) {
      setError("Bitte Betrag (größer 0) und Beschreibung angeben.");
      return;
    }
    const payload = {
      type,
      amount: numericAmount,
      description: description.trim(),
      entry_date: entryDate || null,
    };
    setSaving(true);
    const { error } = isNew
      ? await supabase.from("finance").insert(payload)
      : await supabase.from("finance").update(payload).eq("id", entry.id);
    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.();
    onClose();
  }

  async function handleDelete() {
    setError("");
    const { error } = await supabase.from("finance").delete().eq("id", entry.id);
    if (error) {
      setError(error.message);
      return;
    }
    onSaved?.();
    onClose();
  }

  return (
    <Modal
      title={isNew ? "Eintrag hinzufügen" : "Eintrag bearbeiten"}
      onClose={onClose}
      width="max-w-lg"
    >
      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Art</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="border border-white/20 bg-black px-3 py-2 outline-none focus:border-white"
            >
              <option value="in">Einnahme</option>
              <option value="out">Ausgabe</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm text-white/60">Betrag (€)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Beschreibung</label>
          <input
            autoFocus={isNew}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Datum</label>
          <input
            type="date"
            value={entryDate}
            onChange={(e) => setEntryDate(e.target.value)}
            className="border border-white/20 bg-transparent px-3 py-2 outline-none focus:border-white"
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="self-start border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black disabled:opacity-50"
        >
          {saving ? "Speichert…" : isNew ? "Hinzufügen" : "Speichern"}
        </button>
      </form>

      {!isNew && (
        <div className="mt-10 flex justify-end border-t border-white/10 pt-5">
          <DeleteButton
            label="Eintrag löschen"
            confirmLabel="Eintrag wirklich löschen?"
            onDelete={handleDelete}
          />
        </div>
      )}
    </Modal>
  );
}
