"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

const OPTIONS = [
  { value: "yes", label: "Ja" },
  { value: "maybe", label: "Vielleicht" },
  { value: "no", label: "Nein" },
];

const GROUPS = [
  { value: "yes", label: "Zugesagt", tone: "text-green-400" },
  { value: "maybe", label: "Vielleicht", tone: "text-amber-400" },
  { value: "no", label: "Abgesagt", tone: "text-red-400" },
];

// Zu-/Absagen für die aktuell geplante Probe. Die Antworten sind an das
// Probendatum gekoppelt: Wird eine neue Probe geplant (anderes Datum), beginnt
// automatisch ein frischer Stand.
export default function RehearsalAttendance({ rehearsalDate }) {
  const [userId, setUserId] = useState(null);
  const [rows, setRows] = useState([]);
  const [names, setNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rehearsalDate]);

  async function load() {
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    setUserId(userData.user?.id ?? null);
    const [attRes, profRes] = await Promise.all([
      supabase.from("rehearsal_attendance").select("*").eq("rehearsal_date", rehearsalDate),
      supabase.from("profiles").select("id, name"),
    ]);
    if (attRes.error) setError(attRes.error.message);
    else setRows(attRes.data);
    if (!profRes.error) {
      const map = {};
      profRes.data.forEach((p) => {
        map[p.id] = p.name;
      });
      setNames(map);
    }
    setLoading(false);
  }

  const myStatus = rows.find((r) => r.user_id === userId)?.status ?? null;

  async function setStatus(value) {
    if (!userId || saving) return;
    setError("");
    setSaving(true);
    // Erneuter Klick auf die aktive Antwort nimmt sie zurück.
    const next = myStatus === value ? null : value;
    let result;
    if (next === null) {
      result = await supabase
        .from("rehearsal_attendance")
        .delete()
        .eq("rehearsal_date", rehearsalDate)
        .eq("user_id", userId);
    } else {
      result = await supabase.from("rehearsal_attendance").upsert(
        {
          rehearsal_date: rehearsalDate,
          user_id: userId,
          status: next,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "rehearsal_date,user_id" }
      );
    }
    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    load();
  }

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="mb-3 text-sm uppercase tracking-wide text-white/60">Wer kommt?</p>

      {error && <p className="mb-3 text-sm text-red-400">{error}</p>}

      <div className="mb-4 flex gap-2">
        {OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setStatus(o.value)}
            disabled={saving}
            className={`border px-4 py-2 text-sm transition-colors disabled:opacity-50 ${
              myStatus === o.value
                ? "border-white bg-white text-black"
                : "border-white/20 text-white/70 hover:border-white"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-white/60">Lade…</p>
      ) : (
        <div className="flex flex-col gap-2">
          {GROUPS.map((g) => {
            const members = rows.filter((r) => r.status === g.value);
            return (
              <div key={g.value}>
                <p className={`text-sm ${g.tone}`}>
                  {g.label} · {members.length}
                </p>
                {members.length > 0 && (
                  <p className="text-sm text-white/70">
                    {members.map((m) => names[m.user_id] ?? "Unbekannt").join(", ")}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
