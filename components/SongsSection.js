"use client";

import { useState } from "react";
import SongList from "@/components/SongList";
import SongFormModal from "@/components/SongFormModal";

export default function SongsSection() {
  const [formOpen, setFormOpen] = useState(false);
  const [coversRefresh, setCoversRefresh] = useState(0);
  const [originalsRefresh, setOriginalsRefresh] = useState(0);

  function handleSaved(table) {
    if (table === "covers") setCoversRefresh((n) => n + 1);
    else setOriginalsRefresh((n) => n + 1);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-10 flex items-center justify-between">
        <h2 className="font-serif text-3xl">Songs</h2>
        <button
          onClick={() => setFormOpen(true)}
          className="border border-white px-4 py-2 text-sm transition-colors hover:bg-white hover:text-black"
        >
          + Song
        </button>
      </div>

      <div className="flex flex-col gap-16">
        <SongList
          table="covers"
          heading="Coversongs"
          refreshSignal={coversRefresh}
        />
        <SongList
          table="originals"
          heading="Eigene Songs"
          refreshSignal={originalsRefresh}
        />
      </div>

      {formOpen && (
        <SongFormModal onClose={() => setFormOpen(false)} onSaved={handleSaved} />
      )}
    </div>
  );
}
