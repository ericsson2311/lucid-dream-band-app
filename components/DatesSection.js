"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, todayIso } from "@/lib/format";
import DateDetailModal from "@/components/DateDetailModal";
import DateFormModal from "@/components/DateFormModal";

export default function DatesSection() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    loadDates();
  }, []);

  async function loadDates() {
    setLoading(true);
    const { data, error } = await supabase
      .from("dates")
      .select("*")
      .order("event_date", { ascending: true });
    if (error) setError(error.message);
    else setDates(data);
    setLoading(false);
  }

  function renderDateRow(d, faded = false) {
    return (
      <li key={d.id}>
        <button
          onClick={() => setSelectedDate(d)}
          className={`w-full break-words py-3 text-left transition-colors hover:text-white/70 ${
            faded ? "text-white/50" : ""
          }`}
        >
          <span className="block">{d.title}</span>
          <span className={`block text-sm ${faded ? "text-white/30" : "text-white/50"}`}>
            {formatDate(d.event_date)}
            {d.event_time ? `, ${d.event_time} Uhr` : ""}
            {d.location ? ` — ${d.location}` : ""}
          </span>
        </button>
      </li>
    );
  }

  const today = todayIso();
  const upcoming = dates
    .filter((d) => d.event_date >= today)
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const past = dates
    .filter((d) => d.event_date < today)
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  return (
    <section className="mx-auto max-w-2xl">
      <div className="mb-8 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Termine</h2>
        <button
          onClick={() => setFormOpen(true)}
          className="border border-white px-4 py-2 text-sm transition-colors hover:bg-white hover:text-black"
        >
          + Termin
        </button>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : dates.length === 0 ? (
        <p className="text-white/60">Noch keine Termine.</p>
      ) : (
        <>
          {upcoming.length > 0 ? (
            <ul className="divide-y divide-white/10 border-t border-white/10">
              {upcoming.map((d) => renderDateRow(d))}
            </ul>
          ) : (
            <p className="text-white/60">Keine anstehenden Termine.</p>
          )}
          {past.length > 0 && (
            <>
              <h3 className="mb-1 mt-8 text-sm uppercase tracking-wide text-white/40">Vergangen</h3>
              <ul className="divide-y divide-white/10 border-t border-white/10">
                {past.map((d) => renderDateRow(d, true))}
              </ul>
            </>
          )}
        </>
      )}

      {formOpen && <DateFormModal onClose={() => setFormOpen(false)} onSaved={loadDates} />}

      {selectedDate && (
        <DateDetailModal
          dateEntry={selectedDate}
          onClose={() => setSelectedDate(null)}
          onSaved={loadDates}
          onDeleted={loadDates}
        />
      )}
    </section>
  );
}
