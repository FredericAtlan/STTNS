"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2 } from "lucide-react";
import { savePersonaAction, archivePersonaAction, removeSpinePersonaPhotoAction, uploadSpinePersonaPhotoAction } from "@/app/projects/[slug]/why/actions";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { PersonaPhotoUpload } from "@/components/personas/PersonaPhotoUpload";
import { SpineDescriptionField } from "@/components/ui/SpineDescriptionField";
import { SpineDocLinkField } from "@/components/ui/SpineDocLinkField";
import { WhyArchiveConfirmModal } from "@/components/why/WhyArchiveConfirmModal";

interface Props {
  projectId: string;
  projectSlug: string;
  initialData?: {
    id?: string;
    name?: string;
    code?: string | null;
    description?: string;
    segment?: string;
    avatar_url?: string | null;
    doc_url?: string | null;
  };
  onSuccess?: () => void;
  /** Masquer le titre si le Slide-over parent l'affiche déjà. */
  showHeading?: boolean;
}

export function PersonaForm({
  projectId,
  projectSlug,
  initialData,
  onSuccess,
  showHeading = true,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState(initialData?.name ?? "");
  const [code, setCode] = useState(initialData?.code ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [segment, setSegment] = useState(initialData?.segment ?? "");
  const [docUrl, setDocUrl] = useState(initialData?.doc_url ?? "");

  const isEdit = !!initialData?.id;
  const isBusy = isSubmitting || isArchiving;

  async function handleSubmit() {
    if (isBusy || !name.trim()) return;

    setIsSubmitting(true);
    setError(null);

    const result = await savePersonaAction(projectId, projectSlug, {
      id: initialData?.id,
      name: name.trim(),
      code: code.trim() || undefined,
      description: description.trim() || undefined,
      segment: segment.trim() || undefined,
      doc_url: docUrl.trim() || undefined,
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
    router.push(`/projects/${projectSlug}/why`);
    router.refresh();
  }

  async function handleArchive() {
    if (!initialData?.id || isBusy) return;

    setIsArchiving(true);
    setError(null);

    const result = await archivePersonaAction(initialData.id, projectId, projectSlug);

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
          {isEdit ? "Modifier le Persona" : "Nouveau Persona"}
        </h2>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <PersonaPhotoUpload
        avatarUrl={initialData?.avatar_url ?? null}
        displayName={name || initialData?.name || "Persona"}
        disabledReason={
          !isEdit ? "Créez le persona pour ajouter une photo." : undefined
        }
        uploadAction={uploadSpinePersonaPhotoAction.bind(
          null,
          projectId,
          projectSlug,
          initialData?.id ?? ""
        )}
        removeAction={removeSpinePersonaPhotoAction.bind(
          null,
          projectId,
          projectSlug,
          initialData?.id ?? ""
        )}
      />

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="sttns-label" htmlFor="persona-name">
            Nom du Persona *
          </label>
          <input
            id="persona-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={isBusy}
            className="sttns-input"
            placeholder="ex: Comptable PME"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="persona-code">
              Code (optionnel)
            </label>
            <input
              id="persona-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={isBusy}
              className="sttns-input"
              placeholder="ex: ACC"
              maxLength={10}
            />
          </div>
          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="persona-segment">
              Segment
            </label>
            <input
              id="persona-segment"
              type="text"
              value={segment}
              onChange={(e) => setSegment(e.target.value)}
              disabled={isBusy}
              className="sttns-input"
              placeholder="ex: Finance"
            />
          </div>
        </div>

        <SpineDescriptionField
          label="Description"
          value={description}
          onChange={setDescription}
          placeholder="Contexte, comportements, objectifs de ce persona…"
        />

        <SpineDocLinkField value={docUrl} onChange={setDocUrl} />

        <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
          <strong className="font-semibold">Constitution Spine :</strong> statut
          automatique « todo » — pas de brouillon.
        </div>
      </div>

      {isEdit && initialData?.id && (
        <WorkItemHistory workItemId={initialData.id} />
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isBusy || !name.trim()}
          className="sttns-btn-primary sttns-btn-md"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isEdit ? "Mettre à jour" : "Créer le Persona"}
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
        title="Archiver ce Persona ?"
        description={`« ${name || "Persona"} » et tous les Pain Points / JTBD associés seront soft-supprimés (archived_at). Cette action est réversible côté données, pas depuis cette UI.`}
        busy={isArchiving}
        confirmLabel="Archiver le Persona"
        onCancel={() => {
          if (!isArchiving) setArchiveOpen(false);
        }}
        onConfirm={() => void handleArchive()}
      />
    </div>
  );
}
