"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "introShown";

// Kurze Start-Animation, die einmal pro Browser-Sitzung erscheint. Der Merker
// liegt in sessionStorage, überlebt also ein Neuladen im selben Tab, wird aber
// beim vollständigen Schließen der App/des Tabs zurückgesetzt.
//
// Das Auge ist das echte Vektor-Logo (public/logo.svg); es öffnet sich aus einem
// waagerechten Strich heraus (scaleY), danach erscheinen Schriftzug und Linie.
export default function IntroAnimation() {
  // "hidden" (Startwert, verhindert Hydration-Mismatch) | "visible" | "leaving" | "done"
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    sessionStorage.setItem(SESSION_KEY, "1");
    setPhase("visible");
    const leaveTimer = setTimeout(() => setPhase("leaving"), 2400);
    const doneTimer = setTimeout(() => setPhase("done"), 2950);
    return () => {
      clearTimeout(leaveTimer);
      clearTimeout(doneTimer);
    };
  }, []);

  if (phase === "hidden" || phase === "done") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black transition-opacity duration-500 ${
        phase === "leaving" ? "pointer-events-none opacity-0" : "opacity-100"
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo.svg" alt="" width={132} height={132} className="intro-eye" />
      <p className="intro-word mt-6 font-serif text-4xl">Lucid Dream</p>
      <span className="intro-line mt-4 block h-px bg-white" />
    </div>
  );
}
