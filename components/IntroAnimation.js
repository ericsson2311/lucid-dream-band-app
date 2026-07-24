"use client";

import { useEffect, useState } from "react";

const SESSION_KEY = "introShown";

// Wimpern als Strahlen rund um das Auge (Winkel in Grad; 0 = rechts, 90 = unten,
// 270 = oben). Oben und unten je sieben, die Seiten (Augenwinkel) bleiben frei.
const LASH_ANGLES = [
  210, 230, 250, 270, 290, 310, 330, // oben
  30, 50, 70, 90, 110, 130, 150, // unten
];

const CENTER = 256;
const LASH_INNER = 150;
const LASH_OUTER = 196;

const lashes = LASH_ANGLES.map((deg) => {
  const rad = (deg * Math.PI) / 180;
  return {
    x1: CENTER + LASH_INNER * Math.cos(rad),
    y1: CENTER + LASH_INNER * Math.sin(rad),
    x2: CENTER + LASH_OUTER * Math.cos(rad),
    y2: CENTER + LASH_OUTER * Math.sin(rad),
  };
});

function EyeLogo() {
  return (
    <svg
      viewBox="0 0 512 512"
      width="132"
      height="132"
      fill="none"
      stroke="#fff"
      strokeWidth={4}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        {/* Mondsichel = großer Kreis minus versetzter Kreis */}
        <mask id="ld-moon">
          <circle cx="244" cy="256" r="62" fill="#fff" />
          <circle cx="286" cy="256" r="60" fill="#000" />
        </mask>
      </defs>
      {/* Lid + Augapfel öffnen sich gemeinsam (scaleY) */}
      <g className="eye-open-group">
        {/* mandelförmiges Augenlid */}
        <path d="M64,256 Q256,132 448,256 Q256,380 64,256 Z" vectorEffect="non-scaling-stroke" />
        {/* Iris + Mondsichel blenden beim Öffnen ein */}
        <g className="eye-inner">
          <circle cx="256" cy="256" r="94" vectorEffect="non-scaling-stroke" />
          <circle cx="244" cy="256" r="62" fill="#fff" stroke="none" mask="url(#ld-moon)" />
        </g>
      </g>
      {/* Wimpern ploppen zuletzt auf */}
      <g className="eye-lashes" strokeWidth={7}>
        {lashes.map((l, i) => (
          <line
            key={i}
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </g>
    </svg>
  );
}

// Kurze Start-Animation, die einmal pro Browser-Sitzung erscheint. Der Merker
// liegt in sessionStorage, überlebt also ein Neuladen im selben Tab, wird aber
// beim vollständigen Schließen der App/des Tabs zurückgesetzt.
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
      <EyeLogo />
      <p className="intro-word mt-6 font-serif text-4xl">Lucid Dream</p>
      <span className="intro-line mt-4 block h-px bg-white" />
    </div>
  );
}
