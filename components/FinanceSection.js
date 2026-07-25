"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/format";
import FinanceEntryModal from "@/components/FinanceEntryModal";

export default function FinanceSection() {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);

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

  const balance = entries.reduce(
    (sum, e) => sum + (e.type === "in" ? Number(e.amount) : -Number(e.amount)),
    0
  );

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Finanzen</h2>
        <button
          onClick={() => setFormOpen(true)}
          className="border border-white px-4 py-2 text-sm transition-colors hover:bg-white hover:text-black"
        >
          + Eintrag
        </button>
      </div>

      <div className="mb-8 border border-white/20 px-6 py-5">
        <p className="text-sm text-white/60">Kassenstand</p>
        <p className="font-serif text-4xl">{balance.toFixed(2)} €</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : entries.length === 0 ? (
        <p className="text-white/60">Noch keine Einträge.</p>
      ) : (
        <ul className="divide-y divide-white/10 border-t border-white/10">
          {entries.map((entry) => (
            <li key={entry.id}>
              <button
                onClick={() => setSelectedEntry(entry)}
                className="flex w-full items-center justify-between gap-4 py-3 text-left transition-colors hover:text-white/70"
              >
                <span className="min-w-0 flex-1 break-words">
                  {entry.description}
                  <span className="mt-1 block text-sm text-white/50">
                    {entry.entry_date ? formatDate(entry.entry_date) : ""}
                  </span>
                </span>
                <span className="shrink-0">
                  {entry.type === "in" ? "+" : "−"}
                  {Number(entry.amount).toFixed(2)} €
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {formOpen && (
        <FinanceEntryModal
          entry={null}
          onClose={() => setFormOpen(false)}
          onSaved={loadEntries}
        />
      )}

      {selectedEntry && (
        <FinanceEntryModal
          entry={selectedEntry}
          onClose={() => setSelectedEntry(null)}
          onSaved={loadEntries}
        />
      )}
    </section>
  );
}
