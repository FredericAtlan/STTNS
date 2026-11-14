"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { archiveProjectWithConfirmAction } from "@/app/projects/[slug]/settings/actions";

type Props = {
  projectId: string;
  projectSlug: string;
  projectName: string;
  canEdit?: boolean;
};

export function ProjectDangerZone({
  projectId,
  projectSlug,
  projectName,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const [confirmationName, setConfirmationName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = confirmationName === projectName;

  async function handleArchive() {
    if (isSubmitting || !canConfirm || !canEdit) return;

    setIsSubmitting(true);
    setError(null);

    const result = await archiveProjectWithConfirmAction(projectId, projectSlug, {
      confirmationName,
      projectName,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="max-w-xl rounded-lg border-2 border-red-200 bg-red-50/50 p-6 space-y-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0 text-red-600 mt-0.5" />
        <div>
          <h3 className="text-sm font-semibold text-red-900">Danger Zone</h3>
          <p className="mt-1 text-sm text-red-800/90">
            Archiver le projet le retire de la liste active. Les données sont conservées
            (soft delete) — seuls le CEO du projet ou un administrateur plateforme peuvent
            effectuer cette action.
          </p>
        </div>
      </div>

      {!canEdit && (
        <p className="text-sm text-red-700/80">Zone réservée aux admins projet.</p>
      )}

      {error && (
        <div className="rounded border border-red-300 bg-white px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-red-900">
          Tapez <strong>{projectName}</strong> pour confirmer l&apos;archivage
        </label>
        <input
          type="text"
          value={confirmationName}
          onChange={(e) => setConfirmationName(e.target.value)}
          className="mt-2 block w-full rounded border border-red-300 bg-white px-3 py-2 text-sm focus:border-red-500 focus:outline-none"
          placeholder={projectName}
          autoComplete="off"
          disabled={!canEdit}
        />
      </div>

      <button
        type="button"
        onClick={handleArchive}
        disabled={isSubmitting || !canConfirm || !canEdit}
        className="inline-flex items-center gap-2 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Archivage…
          </>
        ) : (
          "Archiver le projet"
        )}
      </button>
    </div>
  );
}
