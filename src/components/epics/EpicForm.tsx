"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { archiveEpicAction, saveEpicAction, deleteEpicAction } from "@/app/projects/[slug]/epics/actions";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { SpineDescriptionField } from "@/components/ui/SpineDescriptionField";
import { SpineDocLinkField } from "@/components/ui/SpineDocLinkField";
import {
  formatEffortDays,
  formatValueEffortRatio,
} from "@/lib/sttns/valueEffort";

interface Props {
  projectId: string;
  projectSlug: string;
  initial?: {
    id?: string;
    title?: string;
    description?: string;
    doc_url?: string | null;
    /** Roll-up Epic (calculé, jamais saisi). */
    totalImpact?: number;
    totalDays?: number;
    valueEffortRatio?: number | null;
  };
  onSuccess?: () => void;
  hideTitle?: boolean;
  /** Masque l'historique (onglet Santé de l'Inspecteur). */
  hideHistory?: boolean;
  /** Clic sur les KPI → bascule Structure. */
  onFocusStructure?: () => void;
}

export function EpicForm({
  projectId,
  projectSlug,
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

  const isEdit = !!initial?.id;
  const isBusy = isSubmitting || isArchiving;

  async function handleSubmit() {
    if (isBusy) return;
    if (!title.trim()) {
      setError("Le titre est obligatoire.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    // P0.1 — L'EpicForm ne pilote QUE identité/description/doc_url.
    // status / priority / sort_order sont préservés par saveEpicAction (fetch existant).
    // Pour une création, saveEpicAction applique les defaults (todo / 3 / 0).
    const result = await saveEpicAction(projectId, projectSlug, {
      id: initial?.id,
      title: title.trim(),
      description: description.trim() || undefined,
      doc_url: docUrl.trim() || null,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error || "Erreur lors de la sauvegarde");
      return;
    }

    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    const epicId = result.id ?? initial?.id;
    router.push(
      epicId
        ? `/projects/${projectSlug}/epics/${epicId}`
        : `/projects/${projectSlug}/epics`
    );
    router.refresh();
  }

  async function handleArchive() {
    if (!initial?.id || isBusy) return;
    if (!confirm(`Archiver l'Epic « ${title} » ?`)) return;

    setIsArchiving(true);
    setError(null);

    const result = await archiveEpicAction(initial.id, projectId, projectSlug);

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
    router.push(`/projects/${projectSlug}/epics`);
    router.refresh();
  }

  async function handleDelete() {
    if (!initial?.id || isBusy) return;
    if (!confirm(`Effacer définitivement l'Epic « ${title} » ? Cette action est irréversible.`)) return;

    setIsArchiving(true);
    setError(null);

    const result = await deleteEpicAction(initial.id, projectId, projectSlug);

    if (!result.ok) {
      setIsArchiving(false);
      setError(result.error || "Erreur lors de la suppression");
      return;
    }

    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsArchiving(false);
    router.push(`/projects/${projectSlug}/epics`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      {!hideTitle && (
        <h2 className="text-lg font-semibold text-zinc-900">
          {isEdit ? "Modifier l'Epic" : "Nouvel Epic — Focus Vision"}
        </h2>
      )}

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Constitution Alert */}
      <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
        <strong>Constitution Spine :</strong> Statut automatiquement « todo ». Pas de brouillon.
        L&apos;Epic est un conteneur macro — zéro saisie Valeur/Effort (roll-up Features uniquement).
      </div>

      {/* Identity Section */}
      <div className="space-y-4">
        <div>
          <label className="sttns-label">
            Titre de l&apos;Epic *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="sttns-input"
            placeholder="ex: Smart Audit Automation"
            required
          />
        </div>

        <SpineDescriptionField
          label="Description / Vision"
          hint="Objectif stratégique — Markdown et LaTeX supportés. Pas de scoring ici."
          value={description}
          onChange={setDescription}
          placeholder="Quel est l'objectif stratégique de cet Epic ?"
        />

        <SpineDocLinkField value={docUrl} onChange={setDocUrl} />
      </div>

      {/* Roll-up lecture seule — jamais de champs éditables V/E */}
      <div className="rounded border border-zinc-200 bg-zinc-50/80 p-4 space-y-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-900">Indicateurs Portfolio (calculés)</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            Impact Global = ∑ Impact Features · Coût = ∑ Jours · Ratio = Valeur ÷ Effort. Aucune
            saisie manuelle — anti-manipulation des priorités.
            {onFocusStructure && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={onFocusStructure}
                  className="font-medium text-emerald-700 underline hover:text-emerald-800"
                >
                  Voir la Structure
                </button>
              </>
            )}
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <button
            type="button"
            disabled={!onFocusStructure}
            onClick={onFocusStructure}
            className="rounded border border-indigo-100 bg-white px-3 py-2 text-left disabled:cursor-default"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Valeur (∑I)
            </p>
            <p className="text-xl font-bold tabular-nums text-indigo-800">
              {initial?.totalImpact != null ? initial.totalImpact : "—"}
            </p>
          </button>
          <button
            type="button"
            disabled={!onFocusStructure}
            onClick={onFocusStructure}
            className="rounded border border-zinc-200 bg-white px-3 py-2 text-left disabled:cursor-default"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Effort (∑j)
            </p>
            <p className="text-xl font-bold tabular-nums text-zinc-800">
              {initial?.totalDays != null ? formatEffortDays(initial.totalDays) : "—"}
            </p>
          </button>
          <button
            type="button"
            disabled={!onFocusStructure}
            onClick={onFocusStructure}
            className="rounded border border-emerald-100 bg-white px-3 py-2 text-left disabled:cursor-default"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
              Ratio V/E
            </p>
            <p className="text-xl font-bold tabular-nums text-emerald-700">
              {formatValueEffortRatio(initial?.valueEffortRatio ?? null)}
            </p>
          </button>
        </div>
      </div>

      {isEdit && initial?.id && !hideHistory && <WorkItemHistory workItemId={initial.id} />}

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-zinc-200">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy || !title.trim()}
          className="sttns-btn-primary sttns-btn-md"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isEdit ? "Mettre à jour" : "Créer l'Epic"}
        </button>

        {isEdit && (
          <>
            <button
              type="button"
              onClick={handleArchive}
              disabled={isBusy}
              className="sttns-btn-destructive sttns-btn-md"
            >
              {isArchiving && <Loader2 className="h-4 w-4 animate-spin" />}
              Archiver
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isBusy}
              className="sttns-btn-destructive sttns-btn-md"
            >
              <Trash2 className="h-4 w-4" />
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  );
}
