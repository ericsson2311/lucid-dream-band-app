"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "introShown";

// Startbildschirm, der einmal pro Browser-Sitzung erscheint. Der Merker liegt
// in sessionStorage, überlebt also ein Neuladen im selben Tab, wird aber beim
// vollständigen Schließen der App/des Tabs zurückgesetzt.
//
// Das Auge (echtes Vektor-Logo, public/logo.svg) bleibt stehen und pulsiert
// leicht als Einladung zum Antippen; ein Tap irgendwo auf den Bildschirm
// öffnet die App darunter.
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
      className={`fixed inset-0 z-[100] bg-black transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <button
        type="button"
        onClick={handleOpen}
        aria-label="App öffnen"
        className="intro-in flex h-full w-full flex-col items-center justify-center pb-[7vh]"
      >
        <span className="intro-pulse">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="" width={132} height={132} />
        </span>
        <p className="intro-hint mt-6 text-sm uppercase tracking-widest text-white/40">
          Antippen zum Öffnen
        </p>
      </button>
    </div>
  );
}
