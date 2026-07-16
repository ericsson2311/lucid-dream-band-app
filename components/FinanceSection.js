"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, todayIso } from "@/lib/format";

export default function FinanceSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [type, setType] = useState("in");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [entryDate, setEntryDate] = useState(todayIso());

  useEffect(() => {
    loadEntries();
  }, []);

  async function loadEntries() {
    setLoading(true);
    const { data, error } = await supabase
      .from("finance")
      .select("*")
      .order("entry_date", { ascending: false });
    if (error) setError(error.message);
    else setEntries(data);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    const numericAmount = Number(amount);
    if (!description.trim() || !amount || numericAmount <= 0) {
      setError("Bitte Betrag (größer 0) und Beschreibung angeben.");
      return;
    }
    const { error } = await supabase.from("finance").insert({
      type,
      amount: numericAmount,
      description: description.trim(),
      entry_date: entryDate || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setAmount("");
    setDescription("");
    setEntryDate(todayIso());
    loadEntries();
  }

  async function handleDelete(id) {
    if (!window.confirm("Diesen Eintrag wirklich löschen?")) return;
    const { error } = await supabase.from("finance").delete().eq("id", id);
    if (error) setError(error.message);
    else loadEntries();
  }

  const balance = entries.reduce(
    (sum, e) => sum + (e.type === "in" ? Number(e.amount) : -Number(e.amount)),
    0
  );

  return (
    <section className="mx-auto max-w-2xl">
      <h2 className="mb-6 font-serif text-3xl">Finanzen</h2>

      <div className="mb-8 border border-white/20 px-6 py-5">
        <p className="text-sm text-white/60">Kassenstand</p>
        <p className="font-serif text-4xl">{balance.toFixed(2)} €</p>
      </div>

      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-3">
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
          className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black"
        >
          Eintrag hinzufügen
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : entries.length === 0 ? (
        <p className="text-white/60">Noch keine Einträge.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-3">
              <div>
                <p>{entry.description}</p>
                <p className="text-sm text-white/50">
                  {entry.entry_date ? formatDate(entry.entry_date) : ""}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span>
                  {entry.type === "in" ? "+" : "−"}
                  {Number(entry.amount).toFixed(2)} €
                </span>
                <button
                  onClick={() => handleDelete(entry.id)}
                  className="text-sm text-white/40 transition-colors hover:text-red-400"
                >
                  Löschen
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
