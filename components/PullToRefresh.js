"use client";

import { useEffect, useRef, useState } from "react";

const THRESHOLD = 70; // gedämpfte Zugstrecke in px, ab der neu geladen wird
const MAX_PULL = 110;

// Als installierte Web-App (Home-Bildschirm) bieten iOS und Android kein
// natives "Zum Neuladen herunterziehen" – im normalen Browser-Tab schon.
function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

// Liegt der Finger in einem Bereich, der selbst schon nach unten gescrollt ist,
// gehört die Geste diesem Bereich und nicht dem Neuladen.
function insideScrolledElement(target) {
  for (let el = target; el && el !== document.body; el = el.parentElement) {
    if (el.scrollTop > 0) return true;
  }
  return false;
}

export default function PullToRefresh() {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const start = useRef(null);
  const pullRef = useRef(0);

  useEffect(() => {
    if (!isStandalone()) return;

    function reset() {
      pullRef.current = 0;
      setPull(0);
    }

    function onTouchStart(e) {
      start.current = null;
      if (
        e.touches.length !== 1 ||
        window.scrollY > 0 ||
        // Offener Dialog (Modal sperrt das Scrollen der Seite)
        document.body.style.overflow === "hidden" ||
        insideScrolledElement(e.target)
      ) {
        return;
      }
      start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }

    function onTouchMove(e) {
      if (!start.current) return;
      const dy = e.touches[0].clientY - start.current.y;
      const dx = e.touches[0].clientX - start.current.x;
      // Nur senkrecht nach unten zählt, seitliches Wischen nicht
      if (dy <= 0 || Math.abs(dx) > dy) {
        reset();
        return;
      }
      // Gedämpft: je weiter gezogen, desto zäher
      pullRef.current = Math.min(MAX_PULL, dy * 0.5);
      setPull(pullRef.current);
    }

    function onTouchEnd() {
      if (!start.current) return;
      start.current = null;
      if (pullRef.current >= THRESHOLD) {
        setRefreshing(true);
        setPull(THRESHOLD);
        window.location.reload();
      } else {
        reset();
      }
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    window.addEventListener("touchend", onTouchEnd);
    window.addEventListener("touchcancel", onTouchEnd);
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  if (pull === 0 && !refreshing) return null;

  const progress = Math.min(1, pull / THRESHOLD);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 z-[90] flex justify-center"
      style={{ top: `calc(env(safe-area-inset-top, 0px) + ${pull - 40}px)` }}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-black ${
          refreshing ? "animate-spin" : ""
        }`}
        style={{ opacity: progress, transform: refreshing ? undefined : `rotate(${progress * 270}deg)` }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v6h-6" />
        </svg>
      </div>
    </div>
  );
}
