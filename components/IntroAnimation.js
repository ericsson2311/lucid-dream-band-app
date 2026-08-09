"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "introShown";

// Kurze Start-Sequenz, die einmal pro Browser-Sitzung automatisch abläuft.
// Der Merker liegt in sessionStorage, überlebt also ein Neuladen im selben
// Tab, wird aber beim vollständigen Schließen der App/des Tabs zurückgesetzt.
export default function IntroAnimation() {
  // "hidden" (Startwert, verhindert Hydration-Mismatch) | "visible" | "leaving" | "done"
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("visible");
    const leaveTimer = setTimeout(() => setPhase("leaving"), 2200);
    const doneTimer = setTimeout(() => setPhase("done"), 2700);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black pb-[7vh] transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      <div className="intro-in flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="" width={132} height={132} />
        <p className="mt-6 font-serif text-4xl">Willkommen zurück!</p>
        <span className="mt-5 block h-px w-16 bg-white/50" />
      </div>
    </div>
  );
}
