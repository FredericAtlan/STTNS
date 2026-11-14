"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateProjectGeneralAction } from "@/app/projects/[slug]/settings/actions";

type Props = {
  projectId: string;
  projectSlug: string;
  initialName: string;
  initialDescription: string | null;
  canEdit?: boolean;
};

export function ProjectGeneralPanel({
  projectId,
  projectSlug,
  initialName,
  initialDescription,
  canEdit = true,
}: Props) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !canEdit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const result = await updateProjectGeneralAction(projectId, projectSlug, {
      name,
      description: description.trim() || null,
    });

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess("Paramètres enregistrés.");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="sttns-card space-y-4 max-w-xl">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Informations du projet</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Nom affiché dans la navigation et description courte pour l&apos;équipe.
        </p>
      </div>

      {!canEdit && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Lecture seule — seuls les admins projet peuvent modifier ces champs.
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

      <div>
        <label className="block text-sm font-medium text-zinc-700">Nom du projet *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500"
            required
            disabled={!canEdit}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-zinc-700">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={4}
          className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none disabled:bg-zinc-50 disabled:text-zinc-500"
          placeholder="Contexte produit, objectifs, périmètre…"
          disabled={!canEdit}
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting || !name.trim() || !canEdit}
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
            Enregistrer
          </>
        )}
      </button>
    </form>
  );
}
