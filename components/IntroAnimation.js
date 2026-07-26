"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "introShown";

// Startbildschirm, der einmal pro Browser-Sitzung erscheint. Der Merker liegt
// in sessionStorage, überlebt also ein Neuladen im selben Tab, wird aber beim
// vollständigen Schließen der App/des Tabs zurückgesetzt.
//
// Das Auge (echtes Vektor-Logo, public/logo.svg) bleibt stehen und pulsiert
// leicht als Einladung zum Antippen; ein Tap darauf öffnet die App darunter.
export default function IntroAnimation() {
  // "hidden" (Startwert, verhindert Hydration-Mismatch) | "visible" | "leaving" | "done"
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("visible");
  }, []);

  function handleOpen() {
    setPhase("leaving");
    // Fallback, falls transitionend nicht feuert (z.B. wenn der Tab beim
    // Antippen sofort in den Hintergrund wechselt) – räumt trotzdem auf.
    setTimeout(() => setPhase("done"), 600);
  }

  function handleTransitionEnd(e) {
    if (e.target === e.currentTarget && phase === "leaving") setPhase("done");
  }

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black pb-[7vh] transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className="intro-in flex flex-col items-center">
        <button
          type="button"
          onClick={handleOpen}
          aria-label="App öffnen"
          className="intro-pulse -m-4 rounded-full p-4"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={132} height={132} />
        </button>
        <p className="intro-hint mt-6 text-sm uppercase tracking-widest text-white/40">
          Antippen zum Öffnen
        </p>
      </div>
    </div>
  );
}
