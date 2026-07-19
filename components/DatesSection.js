"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { formatDate, todayIso } from "@/lib/format";

function pad(n) {
  return String(n).padStart(2, "0");
}

function escapeIcs(text) {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function downloadIcs(dateEntry) {
  const { id, title, event_date, event_time, location } = dateEntry;
  const [year, month, day] = event_date.split("-").map(Number);
  const allDay = !event_time;
  const now = new Date();
  const dtstamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(
    now.getUTCDate()
  )}T${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  let dtStartLine, dtEndLine;
  if (allDay) {
    const start = `${year}${pad(month)}${pad(day)}`;
    const endDate = new Date(year, month - 1, day + 1);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(endDate.getDate())}`;
    dtStartLine = `DTSTART;VALUE=DATE:${start}`;
    dtEndLine = `DTEND;VALUE=DATE:${end}`;
  } else {
    const [hour, minute] = event_time.split(":").map(Number);
    const start = `${year}${pad(month)}${pad(day)}T${pad(hour)}${pad(minute)}00`;
    // Standarddauer von 3 Stunden, falls kein Ende angegeben ist
    const endDate = new Date(year, month - 1, day, hour + 3, minute);
    const end = `${endDate.getFullYear()}${pad(endDate.getMonth() + 1)}${pad(
      endDate.getDate()
    )}T${pad(endDate.getHours())}${pad(endDate.getMinutes())}00`;
    dtStartLine = `DTSTART:${start}`;
    dtEndLine = `DTEND:${end}`;
  }

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Bandverwaltung//DE",
    "BEGIN:VEVENT",
    `UID:${id}@bandverwaltung`,
    `DTSTAMP:${dtstamp}`,
    dtStartLine,
    dtEndLine,
    `SUMMARY:${escapeIcs(title)}`,
    ...(location ? [`LOCATION:${escapeIcs(location)}`] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  const blob = new Blob([lines.join("\r\n")], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9]+/gi, "_")}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function DatesSection() {
  const [dates, setDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("");
  const [location, setLocation] = useState("");

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

  async function handleAdd(e) {
    e.preventDefault();
    setError("");
    if (!title.trim() || !eventDate) {
      setError("Titel und Datum sind Pflicht.");
      return;
    }
    const { error } = await supabase.from("dates").insert({
      title: title.trim(),
      event_date: eventDate,
      event_time: eventTime || null,
      location: location.trim() || null,
    });
    if (error) {
      setError(error.message);
      return;
    }
    setTitle("");
    setEventDate("");
    setEventTime("");
    setLocation("");
    loadDates();
  }

  async function handleDelete(id) {
    if (!window.confirm("Diesen Termin wirklich löschen?")) return;
    const { error } = await supabase.from("dates").delete().eq("id", id);
    if (error) setError(error.message);
    else loadDates();
  }

  return (
    <section className="mx-auto max-w-2xl">
      <h2 className="mb-6 font-serif text-3xl">Termine</h2>

      <form onSubmit={handleAdd} className="mb-8 flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm text-white/60">Titel</label>
          <input
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
          className="border border-white px-4 py-2 transition-colors hover:bg-white hover:text-black"
        >
          Termin hinzufügen
        </button>
      </form>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : dates.length === 0 ? (
        <p className="text-white/60">Noch keine Termine.</p>
      ) : (
        (() => {
          const today = todayIso();
          const upcoming = dates
            .filter((d) => d.event_date >= today)
            .sort((a, b) => a.event_date.localeCompare(b.event_date));
          const past = dates
            .filter((d) => d.event_date < today)
            .sort((a, b) => b.event_date.localeCompare(a.event_date));

          return (
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
                  <h3 className="mb-1 mt-8 text-sm uppercase tracking-wide text-white/40">
                    Vergangen
                  </h3>
                  <ul className="divide-y divide-white/10 border-t border-white/10">
                    {past.map((d) => renderDateRow(d, true))}
                  </ul>
                </>
              )}
            </>
          );
        })()
      )}
    </section>
  );

  function renderDateRow(d, faded = false) {
    return (
      <li
        key={d.id}
        className={`flex items-center justify-between py-3 ${faded ? "opacity-40" : ""}`}
      >
        <div>
          <p>{d.title}</p>
          <p className="text-sm text-white/50">
            {formatDate(d.event_date)}
            {d.event_time ? `, ${d.event_time} Uhr` : ""}
            {d.location ? ` — ${d.location}` : ""}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => downloadIcs(d)}
            className="text-sm text-white/60 transition-colors hover:text-white"
          >
            .ics
          </button>
          <button
            onClick={() => handleDelete(d.id)}
            className="text-sm text-white/40 transition-colors hover:text-red-400"
          >
            Löschen
          </button>
        </div>
      </li>
    );
  }
}
