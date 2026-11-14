"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, Trash2 } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import {
  archiveInitiativeAction,
  saveInitiativeAction,
} from "@/app/projects/[slug]/features/actions";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { SpineDescriptionField } from "@/components/ui/SpineDescriptionField";
import { SpineDocLinkField } from "@/components/ui/SpineDocLinkField";
import {
  EffortDaysPicker,
  ImpactPicker,
  RiskPicker,
} from "@/components/ui/ValueEffortPickers";
import {
  formatEffortDays,
  type ComplexityLevel,
  type EffortDays,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";
import { cn } from "@/lib/utils";

interface JTBDOption {
  id: string;
  title: string;
  personaName: string;
}

interface EpicOption {
  id: string;
  title: string;
  cycle_id?: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  epics: EpicOption[];
  jtbdOptions: JTBDOption[];
  cycleOptions?: Array<{ id: string; name: string }>;
  /** Affiche le sélecteur de cycle (mode exécution feature). */
  featureExecutionMode?: boolean;
  epicEqualsCycle?: boolean;
  /**
   * Nombre de Stories enfants.
   * 0 → Shape Up : saisie Effort + Risque sur la Feature.
   * >0 → roll-up : sélecteurs masqués, affichage calculé.
   */
  childStoryCount?: number;
  /** Jours roll-up (∑ Stories ou fallback Feature). Affiché en mode lecture. */
  rollupDays?: number;
  /** Nombre de Stories en Risque 3. */
  riskyCount?: number;
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    doc_url?: string | null;
    epic_id?: string | null;
    cycle_id?: string | null;
    linked_jtbd_id?: string | null;
    impact?: ImpactLevel | null;
    effort_days?: EffortDays | null;
    complexity?: ComplexityLevel | null;
  };
  onSuccess?: () => void;
  hideTitle?: boolean;
  hideHistory?: boolean;
  onFocusStructure?: () => void;
}

export function FeatureForm({
  projectId,
  projectSlug,
  epics,
  jtbdOptions,
  cycleOptions = [],
  featureExecutionMode = false,
  epicEqualsCycle = false,
  childStoryCount = 0,
  rollupDays,
  riskyCount = 0,
  initial,
  onSuccess,
  hideTitle,
  hideHistory,
  onFocusStructure,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [docUrl, setDocUrl] = useState(initial?.doc_url ?? "");
  const [epicId, setEpicId] = useState<string>(initial?.epic_id ?? "");
  const [cycleId, setCycleId] = useState<string>(initial?.cycle_id ?? "");
  
  // Hard Stop: JTBD Context is REQUIRED
  const [selectedJtbdId, setSelectedJtbdId] = useState<string>(initial?.linked_jtbd_id ?? "");

  const [impact, setImpact] = useState<ImpactLevel | null>(initial?.impact ?? null);
  const [effortDays, setEffortDays] = useState<EffortDays | null>(initial?.effort_days ?? null);
  const [complexity, setComplexity] = useState<ComplexityLevel | null>(
    initial?.complexity ?? null
  );

  const isEdit = !!initial?.id;
  const isBusy = isSubmitting || isArchiving;
  /** Shape Up : pas encore de Stories — Effort/Risque saisis sur la Feature. */
  const isShapeUpEstimate = childStoryCount === 0;

  useEffect(() => {
    if (!epicEqualsCycle || !cycleId) return;
    const linkedEpic = epics.find((e) => e.cycle_id === cycleId);
    if (linkedEpic) setEpicId(linkedEpic.id);
  }, [cycleId, epicEqualsCycle, epics]);

  const canSubmit =
    title.trim().length > 0 &&
    epicId &&
    selectedJtbdId &&
    impact !== null &&
    (!isShapeUpEstimate || (effortDays !== null && complexity !== null));

  async function handleSubmit() {
    if (isBusy) return;
    if (!canSubmit || impact === null) {
      setError(
        isShapeUpEstimate
          ? "JTBD, Impact, Jours et Risque sont obligatoires (Feature sans Stories)."
          : "JTBD et Impact sont obligatoires."
      );
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveInitiativeAction(
      projectSlug,
      {
        project_id: projectId,
        feature_name: title.trim(),
        epic_id: epicId || null,
        description: description.trim() || null,
        doc_url: docUrl.trim() || null,
        impact,
        // Shape Up uniquement : sinon le roll-up Stories prime (ne pas écraser).
        ...(isShapeUpEstimate
          ? { effort_days: effortDays ?? undefined, complexity: complexity ?? undefined }
          : {}),
        cycle_id: featureExecutionMode ? cycleId || null : undefined,
        context_links: [{ type: "job" as const, context_id: selectedJtbdId }],
      },
      {
        initiativeId: initial?.id,
        metricSelect: "",
      }
    );

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error);
      return;
    }

    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    router.push(`/projects/${projectSlug}/features/${result.id}`);
    router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id || isBusy) return;
    if (!confirm(`Archiver la feature « ${title} » ?`)) return;

    setIsArchiving(true);
    setError(null);

    const result = await archiveInitiativeAction(projectId, projectSlug, initial.id);

    if (!result.ok) {
      setIsArchiving(false);
      setError(result.error || "Erreur lors de l'archivage");
      return;
    }

    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsArchiving(false);
    router.push(`/projects/${projectSlug}/features`);
    router.refresh();
  }

  const selectedJtbd = jtbdOptions.find((j) => j.id === selectedJtbdId);

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <h2 className="text-lg font-semibold text-zinc-900">
          {isEdit ? "Modifier la Feature" : "Nouvelle Feature — Focus Pont (Bridge)"}
        </h2>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Constitution Alert */}
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <strong>Constitution Spine :</strong> Une Feature est un pont entre un Epic (Ambition) et un
          JTBD (Contexte). Le contexte JTBD est OBLIGATOIRE. Statut forcé « todo ».
        </div>
      </div>

      {/* Identity Section */}
      <div className="space-y-4">
        <div>
          <label className="sttns-label">
            Nom de la Feature *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sttns-input"
            placeholder="Ex: Import CSV automatique"
            required
          />
        </div>

        <SpineDescriptionField
          label="Description"
          hint="Description technique et fonctionnelle — Markdown et LaTeX supportés."
          value={description}
          onChange={setDescription}
          placeholder="Description technique et fonctionnelle de la feature..."
        />

        <SpineDocLinkField value={docUrl} onChange={setDocUrl} />

        <div>
          <label className="sttns-label">
            Epic parent *
          </label>
          <select
            value={epicId}
            onChange={(e) => setEpicId(e.target.value)}
            disabled={epicEqualsCycle && Boolean(cycleId)}
            className="sttns-input"
            required
          >
            <option value="">Sélectionnez un epic...</option>
            {epics.map((epic) => (
              <option key={epic.id} value={epic.id}>
                {epic.title}
              </option>
            ))}
          </select>
          {epicEqualsCycle && cycleId && (
            <p className="mt-1 text-xs text-zinc-500">
              Epic imposé par le cycle sélectionné (option Epic = Cycle).
            </p>
          )}
        </div>

        {featureExecutionMode && (
          <div>
            <label className="sttns-label flex items-center gap-1.5 mb-0">
              <SpineObjectIcon type="cycle" size="xs" />
              Cycle d&apos;exécution
            </label>
            <select
              value={cycleId}
              onChange={(e) => setCycleId(e.target.value)}
              className="sttns-input"
            >
              <option value="">Sans cycle (backlog)</option>
              {cycleOptions.map((cycle) => (
                <option key={cycle.id} value={cycle.id}>
                  {cycle.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">
              Assigne la feature au cycle pour le Kanban et l&apos;Arbre de Relations Exécution.
            </p>
          </div>
        )}

        {/* HARD STOP: JTBD Context */}
        <div className="rounded border border-zinc-200 p-4 space-y-3 bg-zinc-50/50">
          <div className="flex items-center gap-2">
            <SpineObjectIcon type="jtbd" />
            <label className="block text-sm font-medium text-zinc-900">
              Contexte métier (JTBD) * <span className="text-red-600">[OBLIGATOIRE]</span>
            </label>
          </div>

          {jtbdOptions.length === 0 ? (
            <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <strong>Aucun JTBD disponible.</strong> Vous devez d&apos;abord créer des Personas et JTBD
              dans la section &quot;Pourquoi&quot; avant de pouvoir créer une Feature.
            </div>
          ) : (
            <>
              <select
                value={selectedJtbdId}
                onChange={(e) => setSelectedJtbdId(e.target.value)}
                className={cn(
                  "sttns-input",
                  !selectedJtbdId && "border-destructive focus:border-destructive focus:ring-destructive"
                )}
                required
              >
                <option value="">-- Sélectionnez un JTBD --</option>
                {jtbdOptions.map((jtbd) => (
                  <option key={jtbd.id} value={jtbd.id}>
                    [{jtbd.personaName}] {jtbd.title.substring(0, 60)}...
                  </option>
                ))}
              </select>

              {!selectedJtbdId && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Hard Stop Constitution Spine : Une Feature sans contexte JTBD ne peut pas être créée.
                </p>
              )}

              {selectedJtbd && (
                <div className="rounded bg-emerald-50 border border-emerald-200 p-3 text-sm">
                  <p className="font-medium text-emerald-800 mb-1">JTBD sélectionné :</p>
                  <p className="text-emerald-700 text-xs">{selectedJtbd.title}</p>
                  <p className="text-emerald-600 text-xs mt-1">
                    Persona : {selectedJtbd.personaName}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Valeur (Impact) + Effort/Risque conditionnels Shape Up */}
      <div className="rounded border border-zinc-200 p-4 space-y-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Valeur (Impact)</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Domaine Produit — saisie manuelle. Effort et Risque vivent sur les Stories ; ici
            uniquement en Shape Up (Feature sans Stories).
          </p>
        </div>

        <ImpactPicker value={impact} onChange={setImpact} />

        {isShapeUpEstimate ? (
          <>
            <div className="rounded border border-dashed border-amber-200 bg-amber-50/60 px-3 py-2 text-xs text-amber-900">
              <strong>Shape Up</strong> — aucune Story encore. Saisissez Effort et Risque
              provisoires sur la Feature ; ils seront remplacés par le roll-up dès la première
              Story.
            </div>
            <EffortDaysPicker
              value={effortDays}
              onChange={setEffortDays}
              label="Jours d'effort (provisoire) *"
            />
            <RiskPicker value={complexity} onChange={setComplexity} />
          </>
        ) : (
          <div className="rounded border border-zinc-100 bg-zinc-50 px-3 py-3 space-y-2">
            <p className="text-xs font-medium text-zinc-700">
              Roll-up technique ({childStoryCount} story
              {childStoryCount > 1 ? "s" : ""})
              {onFocusStructure && (
                <>
                  {" "}
                  <button
                    type="button"
                    onClick={onFocusStructure}
                    className="font-medium text-emerald-700 underline"
                  >
                    Voir la Structure
                  </button>
                </>
              )}
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="rounded bg-white border border-zinc-200 px-2 py-1 font-semibold text-zinc-800">
                Budget temps : {formatEffortDays(rollupDays ?? 0)}
              </span>
              <span
                className={`rounded border px-2 py-1 font-semibold ${
                  riskyCount > 0
                    ? "border-amber-300 bg-amber-50 text-amber-900"
                    : "border-zinc-200 bg-white text-zinc-600"
                }`}
              >
                Menace : {riskyCount} US en R:3
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Lecture seule — modifiez Effort / Risque sur chaque Story.
            </p>
          </div>
        )}
      </div>

      {isEdit && initial?.id && !hideHistory && <WorkItemHistory workItemId={initial.id} />}

      {/* Submit */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit || isBusy}
          className="sttns-btn-primary sttns-btn-md"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Sauvegarde…
            </>
          ) : (
            <>
              <Save className="h-4 w-4" />
              {isEdit ? "Mettre à jour" : "Créer la Feature"}
            </>
          )}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={handleArchive}
            disabled={isBusy}
            className="sttns-btn-destructive sttns-btn-md"
          >
            {isArchiving && <Loader2 className="h-4 w-4 animate-spin" />}
            <Trash2 className="h-4 w-4" />
            Archiver
          </button>
        )}

        {!canSubmit && (
          <p className="w-full text-xs text-amber-600">
            Remplissez tous les champs obligatoires (*) dont le contexte JTBD pour activer la
            sauvegarde.
          </p>
        )}
      </div>
    </div>
  );
}
