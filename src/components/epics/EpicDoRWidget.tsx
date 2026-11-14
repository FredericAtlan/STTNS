"use client";

import { motion } from "framer-motion";
import type { EpicDoRState } from "@/lib/epics/epicHealth";
import { cn } from "@/lib/utils";

function DorRow({
  ok,
  warn,
  label,
}: {
  ok: boolean;
  warn?: boolean;
  label: string;
}) {
  const tone = ok ? "ok" : warn ? "warn" : "ko";

  return (
    <motion.div
      layout
      initial={false}
      animate={{
        borderColor:
          tone === "ok"
            ? "rgba(167, 243, 208, 0.8)"
            : tone === "warn"
              ? "rgba(253, 230, 138, 0.8)"
              : "rgba(254, 202, 202, 0.6)",
        backgroundColor:
          tone === "ok"
            ? "rgba(236, 253, 245, 0.6)"
            : tone === "warn"
              ? "rgba(255, 251, 235, 0.7)"
              : "rgba(254, 242, 242, 0.4)",
      }}
      transition={{ type: "spring", stiffness: 120, damping: 18 }}
      className={cn("flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm")}
    >
      <span className="text-base" aria-hidden>
        {tone === "ok" ? "🟢" : tone === "warn" ? "🟠" : "🔴"}
      </span>
      <span
        className={cn(
          "font-medium",
          tone === "ok" ? "text-emerald-900" : tone === "warn" ? "text-amber-900" : "text-red-900"
        )}
      >
        {label}
      </span>
    </motion.div>
  );
}

export function EpicDoRWidget({ dor, className }: { dor: EpicDoRState; className?: string }) {
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
        Requis pour « Valider pour le sprint (READY) ».
      </p>
      <div className="mt-4 space-y-2">
        <DorRow ok={dor.titleReady} label="Nom de l'Epic" />
        <DorRow ok={dor.definitionReady} label="Définition / objectif de valeur" />
        <DorRow
          ok={dor.storiesLinked}
          warn={dor.isGhost}
          label="≥ 1 user story rattachée"
        />
      </div>
      {dor.readyForProposed ? (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-xs font-medium text-emerald-800"
        >
          DoR complète — vous pouvez valider pour le sprint.
        </motion.p>
      ) : (
        <p className="mt-4 text-xs text-amber-800">
          Brouillon autorisé (epic fantôme possible). Complétez nom, définition et moisson.
        </p>
      )}
    </aside>
  );
}
