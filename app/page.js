"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import SongsSection from "@/components/SongsSection";
import SetlistBuilder from "@/components/SetlistBuilder";
import DatesSection from "@/components/DatesSection";
import FinanceSection from "@/components/FinanceSection";
import NotesSection from "@/components/NotesSection";
import HomeSection from "@/components/HomeSection";
import ProfileModal from "@/components/ProfileModal";
import { getLastSeen, markSeen } from "@/lib/lastSeen";
import { ensureProfile } from "@/lib/profile";

// Tabs, für die "neu seit letztem Besuch" gezählt wird (id = Tabellenname)
const NOTIFY_TABS = ["dates", "notes"];

const TABS = [
  { id: "start", label: "Start" },
  { id: "songs", label: "Songs" },
  { id: "setlists", label: "Setlists" },
  { id: "dates", label: "Termine" },
  { id: "finance", label: "Finanzen" },
  { id: "notes", label: "Notizen" },
];

function MenuIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="6" y1="6" x2="18" y2="18" />
      <line x1="18" y1="6" x2="6" y2="18" />
    </svg>
  );
}

function NewBadge({ count }) {
  return (
    <span className="ml-2 inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-white px-1.5 text-xs font-medium text-black">
      {count}
    </span>
  );
}

export default function Home() {
  const router = useRouter();
  // undefined = wird noch geladen, null = nicht eingeloggt, Objekt = eingeloggt
  const [session, setSession] = useState(undefined);
  const [activeTab, setActiveTab] = useState("start");
  const [menuOpen, setMenuOpen] = useState(false);
  const [newCounts, setNewCounts] = useState({});
  const [profile, setProfile] = useState(null);
  const [profileOpen, setProfileOpen] = useState(false);

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

  useEffect(() => {
    if (!session?.user) return;
    ensureProfile(session.user)
      .then(setProfile)
      .catch(() => {});
  }, [session]);

  useEffect(() => {
    if (!session) return;
    async function checkNew() {
      const counts = {};
      for (const key of NOTIFY_TABS) {
        let since = getLastSeen(key);
        if (!since) {
          // Erster Besuch auf diesem Gerät: nichts als "neu" markieren
          markSeen(key);
          since = new Date().toISOString();
        }
        const { count } = await supabase
          .from(key)
          .select("id", { count: "exact", head: true })
          .gt("created_at", since);
        counts[key] = count || 0;
      }
      setNewCounts(counts);
    }
    checkNew();
  }, [session]);

  function selectTab(id) {
    setActiveTab(id);
    setMenuOpen(false);
    if (NOTIFY_TABS.includes(id)) {
      markSeen(id);
      setNewCounts((prev) => ({ ...prev, [id]: 0 }));
    }
  }

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

  const totalNew = NOTIFY_TABS.reduce((sum, key) => sum + (newCounts[key] || 0), 0);

  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-5 sm:px-10">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Lucid Dream Logo" width={32} height={32} />
          <h1 className="font-serif text-2xl tracking-tight sm:text-3xl">Bandverwaltung</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setProfileOpen(true)}
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            {profile?.name ?? "Profil"}
          </button>
          <button
            onClick={handleLogout}
            className="hidden text-sm text-white/60 transition-colors hover:text-white sm:block"
          >
            Abmelden
          </button>
          <button
            onClick={() => setMenuOpen((open) => !open)}
            aria-label="Menü"
            className="relative text-white/80 transition-colors hover:text-white sm:hidden"
          >
            {menuOpen ? <CloseIcon /> : <MenuIcon />}
            {!menuOpen && totalNew > 0 && (
              <span className="absolute -right-2 -top-2 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-white px-1 text-[10px] font-medium leading-none text-black">
                {totalNew}
              </span>
            )}
          </button>
        </div>
      </header>

      <nav className="hidden border-b border-white/10 px-6 sm:flex sm:flex-wrap sm:gap-1 sm:px-10">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => selectTab(tab.id)}
            className={`px-4 py-3 text-sm transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-white text-white"
                : "text-white/50 hover:text-white"
            }`}
          >
            {tab.label}
            {newCounts[tab.id] > 0 && <NewBadge count={newCounts[tab.id]} />}
          </button>
        ))}
      </nav>

      {menuOpen && (
        <nav className="flex flex-col border-b border-white/10 sm:hidden">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => selectTab(tab.id)}
              className={`flex items-center border-b border-white/10 px-6 py-3 text-left text-sm transition-colors ${
                activeTab === tab.id ? "bg-white text-black" : "text-white/70 hover:text-white"
              }`}
            >
              {tab.label}
              {newCounts[tab.id] > 0 && <NewBadge count={newCounts[tab.id]} />}
            </button>
          ))}
          <button
            onClick={() => {
              setProfileOpen(true);
              setMenuOpen(false);
            }}
            className="border-b border-white/10 px-6 py-3 text-left text-sm text-white/70 transition-colors hover:text-white"
          >
            {profile?.name ? `Profil (${profile.name})` : "Profil"}
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 text-left text-sm text-white/60 transition-colors hover:text-white"
          >
            Abmelden
          </button>
        </nav>
      )}

      <main className="flex-1 px-6 py-10 sm:px-10">
        {activeTab === "start" && <HomeSection />}
        {activeTab === "songs" && <SongsSection />}
        {activeTab === "setlists" && <SetlistBuilder />}
        {activeTab === "dates" && <DatesSection />}
        {activeTab === "finance" && <FinanceSection />}
        {activeTab === "notes" && <NotesSection />}
      </main>

      {profileOpen && profile && (
        <ProfileModal
          profile={profile}
          onClose={() => setProfileOpen(false)}
          onSaved={setProfile}
        />
      )}
    </div>
  );
}
