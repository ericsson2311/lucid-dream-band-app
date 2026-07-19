"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import SongList from "@/components/SongList";
import SetlistBuilder from "@/components/SetlistBuilder";
import DatesSection from "@/components/DatesSection";
import FinanceSection from "@/components/FinanceSection";
import NotesSection from "@/components/NotesSection";
import HomeSection from "@/components/HomeSection";

const TABS = [
  { id: "start", label: "Start" },
  { id: "covers", label: "Coversongs" },
  { id: "originals", label: "Eigene Songs" },
  { id: "setlists", label: "Setlists" },
  { id: "dates", label: "Termine" },
  { id: "finance", label: "Finanzen" },
  { id: "notes", label: "Notizen" },
];

export default function Home() {
  const router = useRouter();
  // undefined = wird noch geladen, null = nicht eingeloggt, Objekt = eingeloggt
  const [session, setSession] = useState(undefined);
  const [activeTab, setActiveTab] = useState("start");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === null) router.replace("/login");
  }, [session, router]);

  async function handleLogout() {
    await supabase.auth.signOut();
  }

  if (session === undefined) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-white/60">Lade…</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Lucid Dream Logo" width={32} height={32} />
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Bandverwaltung</h1>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/60 transition-colors hover:text-white"
        >
          Abmelden
        </button>
      </header>

      <nav className="flex flex-wrap gap-1 border-b border-white/10 px-6 sm:px-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      <main className="flex-1 px-6 py-10 sm:px-10">
        {activeTab === "start" && <HomeSection />}
        {activeTab === "covers" && <SongList table="covers" heading="Coversongs" />}
        {activeTab === "originals" && <SongList table="originals" heading="Eigene Songs" />}
        {activeTab === "setlists" && <SetlistBuilder />}
        {activeTab === "dates" && <DatesSection />}
        {activeTab === "finance" && <FinanceSection />}
        {activeTab === "notes" && <NotesSection />}
      </main>
    </div>
  );
}
