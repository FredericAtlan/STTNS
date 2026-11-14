"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Scale } from "lucide-react";
import { updateProjectSettingsAction } from "@/app/projects/[slug]/settings/actions";
import type { ProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { getSimplifiedModeVariant } from "@/lib/sttns/projectExecutionMode";
import { ShapeUpModeBadge } from "@/components/settings/ShapeUpModeBadge";
import { SimplifiedManagementHelpTrigger } from "@/components/settings/SimplifiedManagementHelp";

type Props = {
  projectId: string;
  projectSlug: string;
  initial: ProjectWorkflowSettings;
  canEdit?: boolean;
};

export function ProjectGovernancePanel({
  projectId,
  projectSlug,
  initial,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const [wipLimit, setWipLimit] = useState(initial.wipLimit);
  const [strictDoD, setStrictDoD] = useState(initial.strictDoD);
  const [stagnationDays, setStagnationDays] = useState(initial.stagnationDays);
  const [defaultCycleWeeks, setDefaultCycleWeeks] = useState(initial.defaultCycleWeeks);
  const [executionUnit, setExecutionUnit] = useState(initial.executionUnit);
  const [epicEqualsCycle, setEpicEqualsCycle] = useState(initial.epicEqualsCycle);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !canEdit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await updateProjectSettingsAction(projectId, projectSlug, {
      wipLimit,
      strictDoD,
      stagnationDays,
      defaultCycleWeeks,
      executionUnit,
      epicEqualsCycle,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Règles de gouvernance enregistrées.");
    router.refresh();
  }

  const simplifiedModePreview = getSimplifiedModeVariant({ executionUnit, epicEqualsCycle });

  return (
    <form onSubmit={handleSubmit} className="sttns-card space-y-6 max-w-xl">
      <div className="flex items-start gap-3">
        <Scale className="h-5 w-5 shrink-0 text-emerald-700 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">Règles du workflow</h3>
          <p className="mt-1 text-xs text-zinc-500">
            Ces paramètres s&apos;appliquent à toute l&apos;équipe : Kanban, Radar
            d&apos;hygiène et création de cycles.
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Lecture seule — réservé aux admins projet.
        </p>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
          {success}
        </div>
      )}

      <div className="space-y-4">
        <div className="rounded border border-emerald-200 bg-emerald-50/50 p-4 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="flex min-w-0 flex-1 items-start gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-zinc-900">Gestion simplifiée</h4>
                  <SimplifiedManagementHelpTrigger />
                  {simplifiedModePreview && <ShapeUpModeBadge variant={simplifiedModePreview} />}
                </div>
                <p className="mt-0.5 text-xs text-zinc-600">
                  Activez une ou les deux options selon la maturité agile de l&apos;équipe.
                  Les projets existants restent en mode complet tant que ces options sont désactivées.
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={executionUnit === "feature"}
              onChange={(e) => setExecutionUnit(e.target.checked ? "feature" : "story")}
              className="mt-1 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
              disabled={!canEdit}
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Features en exécution (sans stories ni tâches)
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Le Kanban et l&apos;Arbre de Relations Exécution pilotent les features
                directement. Les stories existantes restent en base mais sont masquées.
              </span>
            </span>
          </label>

          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={epicEqualsCycle}
              onChange={(e) => setEpicEqualsCycle(e.target.checked)}
              className="mt-1 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
              disabled={!canEdit}
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Epic = Cycle automatiquement
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Chaque nouveau cycle crée un epic lié (même nom). Les features assignées
                à un cycle sont rattachées à son epic.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900">
            Limite WIP (Work In Progress)
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            Nombre maximum d&apos;éléments simultanément en statut « En cours » (
            {executionUnit === "feature" ? "features" : "stories"}). Au-delà, le déplacement
            vers cette colonne est refusé côté serveur.
          </p>
          <input
            type="number"
            min={1}
            max={50}
            value={wipLimit}
            onChange={(e) => setWipLimit(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50"
            required
            disabled={!canEdit}
          />
        </div>

        <div className="rounded border border-zinc-200 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={strictDoD}
              onChange={(e) => setStrictDoD(e.target.checked)}
              className="mt-1 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500 disabled:opacity-50"
              disabled={!canEdit}
            />
            <span>
              <span className="block text-sm font-medium text-zinc-900">
                Definition of Done stricte
              </span>
              <span className="mt-0.5 block text-xs text-zinc-500">
                Si activé, une story ne peut passer à « Terminé » que lorsque toutes
                ses tâches sont elles-mêmes terminées. Ignoré en mode features.
              </span>
            </span>
          </label>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900">
            Seuil de stagnation (Radar)
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            Nombre de jours sans mouvement avant qu&apos;une story « En cours » ou «
            En revue » apparaisse dans le Radar d&apos;hygiène.
          </p>
          <input
            type="number"
            min={1}
            max={90}
            value={stagnationDays}
            onChange={(e) => setStagnationDays(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50"
            required
            disabled={!canEdit}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-900">
            Durée par défaut d&apos;un cycle (semaines)
          </label>
          <p className="mt-0.5 text-xs text-zinc-500">
            Pré-remplit la date de fin lors de la création d&apos;un nouveau cycle /
            sprint.
          </p>
          <input
            type="number"
            min={1}
            max={12}
            value={defaultCycleWeeks}
            onChange={(e) => setDefaultCycleWeeks(Number(e.target.value))}
            className="mt-2 w-24 rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50"
            required
            disabled={!canEdit}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !canEdit}
        className="sttns-btn-primary sttns-btn-md"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Enregistrement…
          </>
        ) : (
          <>
            <Save className="h-4 w-4" />
            Enregistrer les règles
          </>
        )}
      </button>
    </form>
  );
}
