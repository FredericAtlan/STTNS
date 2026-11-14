"use client";

/**
 * @deprecated Cast lock catalogue DRAFT/READY — Étape B (UI → `/why`).
 */
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Lock, LockOpen } from "lucide-react";
import {
  lockPersonasCastAction,
  unlockPersonasCastAction,
} from "@/app/projects/[slug]/personas/actions";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectSlug: string;
  lockedAt: string | null;
  activePersonaCount: number;
  activePersonaCodes: string[];
};

export function PersonasCastBar({
  projectId,
  projectSlug,
  lockedAt,
  activePersonaCount,
  activePersonaCodes,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const isLocked = !!lockedAt;

  function lock() {
    if (
      !window.confirm(
        `Valider le casting avec ${activePersonaCount} persona${activePersonaCount > 1 ? "s" : ""} actif${activePersonaCount > 1 ? "s" : ""} (${activePersonaCodes.join(", ") || "—"}) ?\n\nLes bascules actif/inactif seront figées jusqu'à réouverture explicite.`
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await lockPersonasCastAction(projectId, projectSlug);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function unlock() {
    if (
      !window.confirm(
        "Réouvrir le casting personas ?\n\nVous pourrez à nouveau activer ou désactiver les fiches. Les stories et features existantes ne sont pas modifiées."
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await unlockPersonasCastAction(projectId, projectSlug);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
        isLocked
          ? "border-emerald-200/80 bg-emerald-50/40"
          : "border-amber-200/70 bg-amber-50/30"
      )}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
          {isLocked ? "Casting verrouillé" : "Phase exploration"}
        </p>
        <p className="mt-0.5 text-sm text-slate-700">
          {isLocked ? (
            <>
              Personas actifs figés
              {lockedAt && (
                <span className="text-slate-500">
                  {" "}
                  · validé le{" "}
                  {new Date(lockedAt).toLocaleDateString("fr-FR", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </>
          ) : (
            <>
              Sélectionnez les personas pilotes (ex. P1, P6, P7), puis{" "}
              <strong className="font-semibold text-slate-800">validez le casting</strong> pour figer
              le choix.
            </>
          )}
        </p>
        {activePersonaCodes.length > 0 && (
          <p className="mt-1 truncate text-xs text-slate-500">
            Actifs : {activePersonaCodes.join(" · ")}
          </p>
        )}
        {error && <p className="mt-1 text-xs text-rose-600">{error}</p>}
      </div>

      <button
        type="button"
        disabled={pending || (!isLocked && activePersonaCount === 0)}
        onClick={isLocked ? unlock : lock}
        className={cn(
          "inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors",
          isLocked
            ? "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            : "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800",
          pending && "opacity-60"
        )}
      >
        {isLocked ? (
          <>
            <LockOpen className="h-4 w-4" strokeWidth={1.2} aria-hidden />
            Réouvrir le casting
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" strokeWidth={1.2} aria-hidden />
            Valider le casting
          </>
        )}
      </button>
    </div>
  );
}
