"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2, RotateCcw, Loader2, AlertTriangle } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { SttnsModal } from "@/components/ui/SttnsModal";
import { restoreItemAction, hardDeleteItemAction } from "@/app/projects/[slug]/settings/actions";
import type { SttnsSquadProjectRole } from "@/types/sttns";

interface ArchivedItem {
  id: string;
  title: string;
  type: "story" | "epic" | "feature" | "cycle";
  table: "sttns_work_items" | "sttns_cycles";
  archivedAt?: string | null;
}

interface Props {
  projectId: string;
  projectSlug: string;
  archivedItems: ArchivedItem[];
  squadRole: SttnsSquadProjectRole | null;
}

export function ProjectArchivesPanel({
  projectId,
  projectSlug,
  archivedItems,
  squadRole,
}: Props) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Modal state for confirmation
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteTable, setConfirmDeleteTable] = useState<"sttns_work_items" | "sttns_cycles" | null>(null);
  const [confirmDeleteTitle, setConfirmDeleteTitle] = useState<string>("");

  const canRestore = squadRole === "ceo_admin" || squadRole === "editor";
  const canHardDelete = squadRole === "ceo_admin";

  async function handleRestore(id: string, table: "sttns_work_items" | "sttns_cycles") {
    if (!canRestore) return;
    setLoadingId(id);
    setError(null);
    setSuccess(null);

    const result = await restoreItemAction(id, table, projectId, projectSlug);
    setLoadingId(null);

    if (!result.ok) {
      setError(result.error || "Erreur lors de la restauration.");
    } else {
      setSuccess("Élément rétabli avec succès.");
      router.refresh();
    }
  }

  async function handleHardDelete() {
    if (!confirmDeleteId || !confirmDeleteTable || !canHardDelete) return;

    const id = confirmDeleteId;
    setLoadingId(id);
    setConfirmDeleteId(null);
    setConfirmDeleteTable(null);
    setError(null);
    setSuccess(null);

    const result = await hardDeleteItemAction(id, confirmDeleteTable, projectId, projectSlug);
    setLoadingId(null);

    if (!result.ok) {
      setError(result.error || "Erreur lors de la suppression définitive.");
    } else {
      setSuccess("Élément supprimé définitivement.");
      router.refresh();
    }
  }

  function getReadableType(type: ArchivedItem["type"]) {
    switch (type) {
      case "story":
        return "User Story";
      case "epic":
        return "Epic";
      case "feature":
        return "Feature";
      case "cycle":
        return "Cycle";
      default:
        return type;
    }
  }

  return (
    <div className="sttns-card space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Archives du projet</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Consultez et gérez les éléments archivés (Soft Deleted). Les éditeurs peuvent restaurer les éléments, seuls les administrateurs CEO peuvent les supprimer définitivement.
        </p>
      </div>

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

      {archivedItems.length === 0 ? (
        <div className="rounded-lg border border-dashed border-zinc-200 p-8 text-center">
          <p className="text-sm text-zinc-500">Aucun élément archivé dans ce projet.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200 text-left text-sm">
            <thead>
              <tr className="bg-zinc-50 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                <th className="px-4 py-3">Élément</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Date d&apos;archivage</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 bg-white">
              {archivedItems.map((item) => {
                const isItemLoading = loadingId === item.id;
                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50">
                    <td className="px-4 py-3.5 font-medium text-zinc-900">
                      <div className="flex items-center gap-2">
                        <SpineObjectIcon type={item.type} size="xs" />
                        <span>{item.title}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {getReadableType(item.type)}
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500">
                      {item.archivedAt
                        ? new Date(item.archivedAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "—"}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {canRestore && (
                          <button
                            type="button"
                            onClick={() => handleRestore(item.id, item.table)}
                            disabled={isItemLoading}
                            className="inline-flex items-center gap-1 rounded bg-zinc-100 px-2.5 py-1.5 text-xs font-medium text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
                            title="Rétablir l'élément"
                          >
                            {isItemLoading ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <RotateCcw className="h-3.5 w-3.5" />
                            )}
                            <span>Rétablir</span>
                          </button>
                        )}

                        {canHardDelete && (
                          <button
                            type="button"
                            onClick={() => {
                              setConfirmDeleteId(item.id);
                              setConfirmDeleteTable(item.table);
                              setConfirmDeleteTitle(item.title);
                            }}
                            disabled={isItemLoading}
                            className="inline-flex items-center gap-1 rounded bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                            title="Supprimer définitivement"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            <span>Supprimer</span>
                          </button>
                        )}

                        {!canRestore && !canHardDelete && (
                          <span className="text-xs text-zinc-400 italic">Aucun droit</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <SttnsModal
        open={!!confirmDeleteId}
        onClose={() => {
          setConfirmDeleteId(null);
          setConfirmDeleteTable(null);
          setConfirmDeleteTitle("");
        }}
        title="Suppression définitive"
        size="md"
        footer={
          <>
            <button
              type="button"
              onClick={() => {
                setConfirmDeleteId(null);
                setConfirmDeleteTable(null);
                setConfirmDeleteTitle("");
              }}
              className="sttns-btn-secondary sttns-btn-md"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleHardDelete}
              className="sttns-btn-destructive sttns-btn-md"
            >
              Supprimer définitivement
            </button>
          </>
        }
      >
        <div className="flex items-start gap-3">
          <div className="rounded-full bg-destructive/10 p-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <p className="flex-1 text-sm text-muted-foreground">
            Cette action est{" "}
            <strong className="text-destructive">totalement irréversible</strong>. Êtes-vous sûr
            de vouloir supprimer définitivement l&apos;élément{" "}
            <strong className="text-foreground">&quot;{confirmDeleteTitle}&quot;</strong> ?
          </p>
        </div>
      </SttnsModal>
    </div>
  );
}
