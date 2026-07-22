"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { formatDate, todayIso } from "@/lib/format";
import NextRehearsalCard from "@/components/NextRehearsalCard";

function formatFullDate(date) {
  return new Intl.DateTimeFormat("de-DE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default function HomeSection({ userId }) {
  const [nextDate, setNextDate] = useState(undefined);
  const [error, setError] = useState("");

  useEffect(() => {
    loadNextDate();
  }, []);

  async function loadNextDate() {
    const today = todayIso();
    const { data, error } = await supabase
      .from("dates")
      .select("*")
      .gte("event_date", today)
      .order("event_date", { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) setError(error.message);
    else setNextDate(data);
  }

  return (
    <section className="mx-auto max-w-2xl">
      <p className="mb-6 text-center text-sm uppercase tracking-widest text-white/50">
        {formatFullDate(new Date())}
      </p>
      <div className="mb-10 flex justify-center">
        <Image src="/logo.png" alt="Lucid Dream Logo" width={96} height={96} />
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      <div className="flex flex-col gap-6">
        <NextRehearsalCard userId={userId} />

        <div className="border border-white/20 px-6 py-5">
          <h3 className="mb-3 font-serif text-2xl">Nächster Termin</h3>
          {nextDate === undefined ? (
            <p className="text-white/60">Lade…</p>
          ) : nextDate ? (
            <>
              <p className="text-white/80">{nextDate.title}</p>
              <p className="mt-1 text-sm text-white/50">
                {formatDate(nextDate.event_date)}
                {nextDate.event_time ? `, ${nextDate.event_time} Uhr` : ""}
                {nextDate.location ? ` — ${nextDate.location}` : ""}
              </p>
            </>
          ) : (
            <p className="text-white/60">Keine anstehenden Termine.</p>
          )}
        </div>
      </div>
    </section>
  );
}
