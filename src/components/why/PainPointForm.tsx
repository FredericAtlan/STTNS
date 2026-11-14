"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import {
  archivePainPointAction,
  savePainPointAction,
} from "@/app/projects/[slug]/why/actions";
import type { PainPointInput } from "@/lib/sttns/types";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { WhyArchiveConfirmModal } from "@/components/why/WhyArchiveConfirmModal";
import {
  PAIN_POINT_SEVERITY_LABELS,
  SeverityBadge,
  type PainPointSeverity,
} from "@/components/ui/SeverityBadge";

interface Props {
  projectId: string;
  projectSlug: string;
  personas: { id: string; title: string; code: string | null }[];
  initialData?: Partial<PainPointInput>;
  onSuccess?: () => void;
  /** Masquer le titre si le Slide-over parent l'affiche déjà. */
  showHeading?: boolean;
}

const SEVERITIES: PainPointSeverity[] = ["low", "medium", "high", "critical"];

export function PainPointForm({
  projectId,
  projectSlug,
  personas,
  initialData,
  onSuccess,
  showHeading = true,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [personaId, setPersonaId] = useState(initialData?.persona_id ?? "");
  const [label, setLabel] = useState(initialData?.label ?? "");
  const [severity, setSeverity] = useState<PainPointInput["severity"]>(
    initialData?.severity ?? "medium"
  );

  const isEdit = !!initialData?.id;
  const isBusy = isSubmitting || isArchiving;

  async function handleSubmit() {
    if (isBusy) return;
    if (!personaId || !label.trim()) {
      setError("Le persona parent et le libellé sont obligatoires.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const payload: PainPointInput = {
      id: initialData?.id,
      persona_id: personaId,
      label: label.trim(),
      severity,
    };

    const result = await savePainPointAction(projectId, projectSlug, payload);

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
    router.push(`/projects/${projectSlug}/why`);
    router.refresh();
  }

  async function handleArchive() {
    if (!initialData?.id || isBusy) return;

    setIsArchiving(true);
    setError(null);

    const result = await archivePainPointAction(initialData.id, projectId, projectSlug);

    if (!result.ok) {
      setIsArchiving(false);
      setArchiveOpen(false);
      setError(result.error || "Erreur lors de l'archivage");
      return;
    }

    setArchiveOpen(false);
    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsArchiving(false);
    router.push(`/projects/${projectSlug}/why`);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {showHeading && (
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? "Modifier le Pain Point" : "Nouveau Pain Point"}
        </h2>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="sttns-label" htmlFor="pp-persona">
            Persona parent *
          </label>
          <select
            id="pp-persona"
            value={personaId}
            onChange={(e) => setPersonaId(e.target.value)}
            disabled={isBusy}
            className="sttns-input"
            required
          >
            <option value="">Sélectionnez un persona…</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `[${p.code}] ` : ""}
                {p.title}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="sttns-label" htmlFor="pp-label">
            Libellé *
          </label>
          <input
            id="pp-label"
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            disabled={isBusy}
            className="sttns-input"
            placeholder="ex: Micro-crédit inaccessible"
          />
        </div>

        <div className="space-y-1.5">
          <label className="sttns-label" htmlFor="pp-severity">
            Sévérité
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <select
              id="pp-severity"
              value={severity}
              onChange={(e) =>
                setSeverity(e.target.value as PainPointInput["severity"])
              }
              disabled={isBusy}
              className="sttns-input max-w-xs"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s}>
                  {PAIN_POINT_SEVERITY_LABELS[s]}
                </option>
              ))}
            </select>
            <SeverityBadge severity={severity ?? "medium"} />
          </div>
        </div>
      </div>

      {isEdit && initialData?.id && (
        <WorkItemHistory workItemId={initialData.id} />
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy || !personaId || !label.trim()}
          className="sttns-btn-primary sttns-btn-md"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isEdit ? "Mettre à jour" : "Créer le Pain Point"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            disabled={isBusy}
            className="sttns-btn-destructive sttns-btn-md"
          >
            <Trash2 className="h-4 w-4" />
            Archiver
          </button>
        )}
      </div>

      <WhyArchiveConfirmModal
        open={archiveOpen}
        title="Archiver ce Pain Point ?"
        description={`« ${label || "Pain Point"} » sera soft-supprimé (archived_at). Les JTBD qui le résolvent resteront, mais le lien solves pourra devenir orphelin.`}
        busy={isArchiving}
        confirmLabel="Archiver le Pain Point"
        onCancel={() => {
          if (!isArchiving) setArchiveOpen(false);
        }}
        onConfirm={() => void handleArchive()}
      />
    </div>
  );
}
