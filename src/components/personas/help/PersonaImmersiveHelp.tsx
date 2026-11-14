"use client";

import { useCallback, useEffect, useState } from "react";
import { HelpCircle } from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { MermaidDiagram, SttnsMarkdownRenderer } from "@/components/ui/SttnsMarkdownRenderer";
import {
  PERSONA_HELP_MARKDOWN,
  PERSONA_HELP_MERMAID,
} from "@/lib/personas/personaHelpContent";
import { cn } from "@/lib/utils";

export function PersonaImmersiveHelp() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          "fixed right-0 top-1/2 z-50 -translate-y-1/2",
          "flex items-center gap-1 rounded-l-xl border border-r-0 border-emerald-200 bg-white px-2 py-3",
          "text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-900 shadow-md",
          "hover:bg-emerald-50 hover:pl-3 transition-all"
        )}
      >
        <HelpCircle className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline [writing-mode:vertical-rl] rotate-180">
          Guide métier
        </span>
      </button>

      <SttnsSlideOver
        open={open}
        onClose={close}
        eyebrow="Guide métier"
        title="Persona · Matrice PP ↔ JTBD"
        size="xl"
        ariaLabelClose="Fermer l'aide persona"
      >
        <div className="space-y-8">
          <div className="prose prose-sm max-w-none text-zinc-700">
            <SttnsMarkdownRenderer content={PERSONA_HELP_MARKDOWN} />
          </div>
          <section>
            <h3 className="font-display text-sm font-bold text-zinc-900">
              Cascade STTNS
            </h3>
            <div className="mt-3 overflow-x-auto rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
              <MermaidDiagram code={PERSONA_HELP_MERMAID} />
            </div>
          </section>
        </div>
      </SttnsSlideOver>
    </>
  );
}
