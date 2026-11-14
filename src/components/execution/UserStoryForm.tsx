"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save, AlertCircle, Archive } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import {
  deleteUserStoryAction,
  saveUserStoryAction,
  type StoryTaskProjectMember,
} from "@/app/projects/[slug]/user-stories/actions";
import { STORY_STATUS_LABELS } from "@/lib/sttns/storiesSpine";
import type { WorkItemStatus } from "@/lib/sttns/types";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { SpineDescriptionField } from "@/components/ui/SpineDescriptionField";
import { SpineDocLinkField, isValidDocLinkInput } from "@/components/ui/SpineDocLinkField";
import { RiskPicker, EffortDaysPicker } from "@/components/ui/ValueEffortPickers";
import { SttnsModal } from "@/components/ui/SttnsModal";
import type { ComplexityLevel, EffortDays } from "@/lib/sttns/valueEffort";
import { readComplexity, readEffortDays } from "@/lib/sttns/valueEffort";
import { cn } from "@/lib/utils";

interface FeatureOption {
  id: string;
  title: string;
  epicTitle?: string;
}

interface CycleOption {
  id: string;
  name: string;
}

interface Props {
  projectId: string;
  projectSlug: string;
  features: FeatureOption[];
  cycles: CycleOption[];
  projectMembers?: StoryTaskProjectMember[];
  initial?: {
    id?: string;
    title?: string;
    description?: string | null;
    doc_url?: string | null;
    feature_id?: string | null;
    cycle_id?: string | null;
    effort_days?: EffortDays | null;
    complexity?: ComplexityLevel | null;
    /** @deprecated metadata legacy — ignoré si effort_days fourni */
    effort_points?: number;
    metadata?: unknown;
    status?: WorkItemStatus;
    assignee_id?: string | null;
  };
  onSuccess?: () => void;
  /** Masque le titre interne (slide-over avec titre SttnsSlideOver). */
  hideTitle?: boolean;
  /** Lecteur squad — pas d'édition ni d'archivage. */
  readOnly?: boolean;
}

export function UserStoryForm({
  projectId,
  projectSlug,
  features,
  cycles,
  projectMembers = [],
  initial,
  onSuccess,
  hideTitle,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [docUrl, setDocUrl] = useState(initial?.doc_url ?? "");
  const [selectedFeatureId, setSelectedFeatureId] = useState<string>(initial?.feature_id ?? "");
  const [selectedCycleId, setSelectedCycleId] = useState<string>(initial?.cycle_id ?? "");
  const [effortDays, setEffortDays] = useState<EffortDays | null>(
    initial?.effort_days ?? readEffortDays(initial?.metadata) ?? null
  );
  const [complexity, setComplexity] = useState<ComplexityLevel | null>(
    initial?.complexity ?? readComplexity(initial?.metadata) ?? null
  );
  const [status, setStatus] = useState<WorkItemStatus>(initial?.status ?? "todo");
  const [assigneeId, setAssigneeId] = useState<string>(initial?.assignee_id ?? "");

  const isEdit = !!initial?.id;
  const isBusy = isSubmitting || isArchiving;

  async function handleArchive() {
    if (!initial?.id || isBusy || readOnly) return;

    setIsArchiving(true);
    setError(null);

    const result = await deleteUserStoryAction(initial.id, projectId, projectSlug);

    if (!result.ok) {
      setIsArchiving(false);
      setArchiveOpen(false);
      setError(result.error || "Erreur lors de l'archivage.");
      return;
    }

    setArchiveOpen(false);
    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsArchiving(false);
    router.push(`/projects/${projectSlug}/user-stories`);
    router.refresh();
  }

  async function handleSubmit() {
    if (isBusy || readOnly) return;
    if (!selectedFeatureId) {
      setError("Une Story DOIT avoir une Feature parente (Constitution Spine).");
      return;
    }

    if (effortDays == null || complexity == null) {
      setError("Jours d'effort et Risque sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveUserStoryAction(projectId, projectSlug, {
      id: initial?.id,
      title: title.trim(),
      description: description.trim() || null,
      doc_url: docUrl.trim() || null,
      assignee_id: assigneeId || null,
      feature_id: selectedFeatureId,
      cycle_id: selectedCycleId || null,
      effort_days: effortDays,
      complexity,
      ...(isEdit ? { status } : {}),
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error || "Erreur lors de la sauvegarde");
      return;
    }

    if (onSuccess) {
      setIsSubmitting(false);
      onSuccess();
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    router.push(`/projects/${projectSlug}/user-stories/${result.id}`);
    router.refresh();
  }

  const selectedFeature = features.find((f) => f.id === selectedFeatureId);

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <h2 className="text-lg font-semibold text-zinc-900">
          {isEdit ? "Modifier la User Story" : "Nouvelle User Story — Moteur d'Exécution"}
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
          <strong>Constitution Spine :</strong> Héritage obligatoire vers Feature. Effort en jours
          (0.5–5) et Risque (1–3, badge R:n). Domaine technique — la Valeur (Impact) est sur la
          Feature.
          {!isEdit && " Statut initial « À faire »."}
        </div>
      </div>

      <div className="space-y-4">
        {/* Titre */}
        <div>
          <label className="sttns-label">
            Titre de la Story *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sttns-input"
            placeholder="Ex: En tant que comptable, je veux importer un CSV..."
            required
            disabled={readOnly}
          />
        </div>

        <SpineDescriptionField
          label="Description"
          hint="Contexte, critères d'acceptation ou notes pour l'équipe (Markdown et LaTeX supportés)."
          value={description}
          onChange={readOnly ? undefined : setDescription}
          readOnly={readOnly}
          placeholder="En tant que… je veux… afin de… (Markdown, formules : $E=mc^2$)"
        />

        <SpineDocLinkField
          value={docUrl}
          onChange={readOnly ? undefined : setDocUrl}
          readOnly={readOnly}
        />

        {/* Feature Parent - Hard Stop */}
        <div className="rounded border border-zinc-200 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <SpineObjectIcon type="feature" />
            <label className="block text-sm font-medium text-zinc-900">
              Feature parente * <span className="text-red-600">[OBLIGATOIRE]</span>
            </label>
          </div>

          <select
            value={selectedFeatureId}
            onChange={(e) => setSelectedFeatureId(e.target.value)}
            className={cn(
              "sttns-input",
              !selectedFeatureId && "border-destructive focus:border-destructive focus:ring-destructive"
            )}
            required
            disabled={readOnly}
          >
            <option value="">-- Sélectionnez une Feature --</option>
            {features.map((feature) => (
              <option key={feature.id} value={feature.id}>
                {feature.epicTitle ? `[${feature.epicTitle}] ` : ""}{feature.title}
              </option>
            ))}
          </select>

          {!selectedFeatureId && (
            <p className="text-xs text-red-600 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              Hard Stop Constitution Spine : Une Story sans Feature parente ne peut pas être créée.
            </p>
          )}

          {selectedFeature && (
            <div className="rounded bg-emerald-50 border border-emerald-200 p-3">
              <p className="text-sm font-medium text-emerald-800 flex items-center gap-1.5">
                <SpineObjectIcon type="feature" size="xs" />
                {selectedFeature.title}
              </p>
              {selectedFeature.epicTitle && (
                <p className="text-xs text-emerald-600 mt-1 flex items-center gap-1">
                  <SpineObjectIcon type="epic" size="xs" />
                  Epic : {selectedFeature.epicTitle}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Effort Jours / Risque */}
        <div className="rounded border border-zinc-200 p-4 space-y-4">
          <div>
            <h3 className="text-sm font-medium text-zinc-900">Coût &amp; Risque (Tech)</h3>
            <p className="mt-0.5 text-xs text-zinc-500">
              Domaine Expert — Effort plafonné à 5j · Risque 1–3 (R:3 = alerte POC).
            </p>
          </div>
          <EffortDaysPicker
            value={effortDays}
            onChange={setEffortDays}
            disabled={readOnly}
          />
          <RiskPicker
            value={complexity}
            onChange={setComplexity}
            disabled={readOnly}
          />
        </div>

        {isEdit && (
          <div>
            <label className="sttns-label">Statut d&apos;exécution</label>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Rétrograder une story terminée (ex. Terminé → Revue) pour une nouvelle passe QA.
            </p>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as WorkItemStatus)}
              disabled={readOnly}
              className="sttns-input"
            >
              {(Object.keys(STORY_STATUS_LABELS) as WorkItemStatus[]).map((key) => (
                <option key={key} value={key}>
                  {STORY_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Cycle Assignment */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <SpineObjectIcon type="cycle" colored={false} className="text-zinc-500" />
            <label className="sttns-label mb-0">
              Cycle (Sprint)
            </label>
            <span className="text-xs text-muted-foreground">(optionnel)</span>
          </div>

          <select
            value={selectedCycleId}
            onChange={(e) => setSelectedCycleId(e.target.value)}
            className="sttns-input"
            disabled={readOnly}
          >
            <option value="">-- Aucun cycle --</option>
            {cycles.map((cycle) => (
              <option key={cycle.id} value={cycle.id}>
                {cycle.name}
              </option>
            ))}
          </select>

          {cycles.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Aucun cycle actif.{" "}
              <Link
                href={`/projects/${projectSlug}/cycles`}
                className="font-medium text-emerald-700 underline underline-offset-2 hover:text-emerald-800"
              >
                Créer un cycle
              </Link>
            </p>
          )}
        </div>

        <div>
          <label className="sttns-label">Assigné à</label>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Membre responsable de la story — visible sur le Kanban et le backlog.
          </p>
          <select
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            disabled={readOnly}
            className="sttns-input"
          >
            <option value="">Non assigné</option>
            {projectMembers.map((member) => (
              <option key={member.user_id} value={member.user_id}>
                {member.full_name?.trim() || member.email?.split("@")[0] || "Membre"}
              </option>
            ))}
          </select>
        </div>
      </div>

      {isEdit && initial?.id && <WorkItemHistory workItemId={initial.id} />}

      {/* Submit + archivage */}
      <div className="pt-4 border-t border-zinc-200 space-y-3">
        {!readOnly ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={
                isBusy ||
                !title.trim() ||
                !selectedFeatureId ||
                effortDays == null ||
                complexity == null ||
                !isValidDocLinkInput(docUrl)
              }
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
                  {isEdit ? "Mettre à jour" : "Créer la Story"}
                </>
              )}
            </button>

            {isEdit && (
              <button
                type="button"
                onClick={() => setArchiveOpen(true)}
                disabled={isBusy}
                className="inline-flex items-center gap-2 rounded border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 hover:bg-rose-100 disabled:opacity-50"
              >
                {isArchiving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Archivage…
                  </>
                ) : (
                  <>
                    <Archive className="h-4 w-4" />
                    Archiver
                  </>
                )}
              </button>
            )}
          </div>
        ) : (
          <p className="text-xs text-zinc-500">Lecture seule — rôle Lecteur sur ce projet.</p>
        )}

        {!readOnly && (!selectedFeatureId || effortDays == null || complexity == null) ? (
          <p className="text-xs text-amber-600">
            Remplissez tous les champs obligatoires (*) pour activer la sauvegarde.
          </p>
        ) : null}
      </div>

      <SttnsModal
        open={archiveOpen}
        onClose={() => {
          if (!isArchiving) setArchiveOpen(false);
        }}
        title="Archiver cette Story ?"
        eyebrow="Archivage"
        size="md"
        preventClose={isArchiving}
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setArchiveOpen(false)}
              disabled={isArchiving}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-destructive"
              onClick={() => void handleArchive()}
              disabled={isArchiving}
            >
              {isArchiving && <Loader2 className="h-4 w-4 animate-spin" />}
              Archiver la Story
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          « {title.trim() || initial?.title || "Story"} » sera soft-supprimée
          (archived_at). Les tâches liées restent accessibles côté données.
          Action réversible via SQL, pas depuis cette UI.
        </p>
      </SttnsModal>
    </div>
  );
}
