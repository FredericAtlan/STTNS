"use client";

import { motion } from "framer-motion";
import type { UserStoryDoRState } from "@/lib/userStories/userStoryHealth";
import { cn } from "@/lib/utils";

function DorRow({ ok, label }: { ok: boolean; label: string }) {
  return (
    <motion.div
      layout
      initial={false}
      animate={{
        borderColor: ok ? "rgba(167, 243, 208, 0.8)" : "rgba(254, 202, 202, 0.6)",
        backgroundColor: ok ? "rgba(236, 253, 245, 0.6)" : "rgba(254, 242, 242, 0.4)",
      }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm")}
    >
      <motion.span
        key={ok ? "ok" : "ko"}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 14 }}
        className="text-base"
        aria-hidden
      >
        {ok ? "🟢" : "🔴"}
      </motion.span>
      <span className={cn("font-medium", ok ? "text-emerald-900" : "text-red-900")}>{label}</span>
    </motion.div>
  );
}

export function UserStoryDoRWidget({
  dor,
  className,
}: {
  dor: UserStoryDoRState;
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "sttns-card border border-slate-100 bg-white/50 p-5 backdrop-blur-sm lg:sticky lg:top-4",
        className
      )}
    >
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
        Definition of Ready
      </p>
      <p className="mt-1 text-xs font-light text-slate-500">
        Critères requis avant enregistrement DoR complète et soumission comité.
      </p>
      <div className="mt-4 space-y-2">
        <DorRow ok={dor.primaryPersonaReady} label="Persona principal (En tant que…)" />
        <DorRow ok={dor.jtbdLinked} label="JTBD associé (lien de valeur)" />
        <DorRow ok={dor.sprintWantReady} label="Je veux" />
        <DorRow ok={dor.sprintSoThatReady} label="Afin de" />
        <DorRow ok={dor.epicLinked} label="Lien epic" />
        <DorRow ok={dor.featureLinked} label="Lien feature" />
        <DorRow ok={dor.impactMetricReady} label="Indicateur d'impact" />
      </div>
      {dor.readyToPublish ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-xs font-medium text-emerald-800"
        >
          DoR complète — enregistrez la fiche, puis soumettez au comité (panneau Avis).
        </motion.p>
      ) : (
        <p className="mt-4 text-xs text-amber-800">
          Brouillon autorisé. Complétez la DoR, enregistrez, puis soumettez via le panneau Avis.
        </p>
      )}
    </aside>
  );
}
