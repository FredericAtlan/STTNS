"use client";

import { Plus } from "lucide-react";

export function BrainstormingHeroActions() {
  const focusComposer = () => {
    const composer = document.getElementById("create-idea");
    if (!composer) return;
    composer.scrollIntoView({ behavior: "smooth", block: "start" });
    composer.classList.add("ring-2", "ring-emerald-400");
    window.setTimeout(() => {
      composer.classList.remove("ring-2", "ring-emerald-400");
    }, 1200);
  };

  return (
    <button type="button" className="sttns-btn-primary text-sm" onClick={focusComposer}>
      <Plus className="h-4 w-4" />
      Nouvelle idée
    </button>
  );
}
