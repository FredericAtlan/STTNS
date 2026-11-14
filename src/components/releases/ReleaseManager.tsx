"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Package, Plus } from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import {
  createReleaseAction,
  updateReleaseStatusAction,
} from "@/app/projects/[slug]/releases/actions";
import { RELEASE_STATUS_LABELS } from "@/lib/sttns/releases";
import type { SttnsRelease, SttnsReleaseStatus } from "@/types/sttns";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  releases: SttnsRelease[];
}

export function ReleaseManager({ projectId, projectSlug, releases }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const result = await createReleaseAction(projectId, projectSlug, {
      label,
      target_date: targetDate || null,
      status: "draft",
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setLabel("");
    setTargetDate("");
    router.refresh();
  }

  async function setStatus(releaseId: string, status: SttnsReleaseStatus) {
    setLoading(true);
    setError(null);
    const result = await updateReleaseStatusAction(projectId, projectSlug, releaseId, status);
    setLoading(false);
    if (!result.ok) setError(result.error);
    else router.refresh();
  }

  return (
    <>
      <button type="button" className="sttns-btn-secondary" onClick={() => setOpen(true)}>
        <Package className="h-4 w-4" />
        Releases
      </button>

      <SttnsSlideOver
        open={open}
        onClose={() => setOpen(false)}
        eyebrow="Itérations produit"
        title="Gestion des Releases"
        variant="zen"
        size="md"
      >
        <div className="space-y-6">
          {error && (
            <p className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
              {error}
            </p>
          )}

          <form onSubmit={handleCreate} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4">
            <p className="text-sm font-semibold text-zinc-800">Nouvelle release</p>
            <div>
              <label className="sttns-label">Libellé</label>
              <input
                className="sttns-input mt-1"
                placeholder="RL3"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="sttns-label">Date cible</label>
              <input
                type="date"
                className="sttns-input mt-1"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
              />
            </div>
            <button type="submit" disabled={loading} className="sttns-btn-primary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Créer
            </button>
          </form>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-zinc-800">Releases existantes</p>
            {releases.length === 0 ? (
              <p className="text-sm text-zinc-500">Aucune release — créez RL1 pour commencer.</p>
            ) : (
              releases.map((release) => (
                <div
                  key={release.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2"
                >
                  <div>
                    <p className="font-mono font-bold text-zinc-900">{release.label}</p>
                    <p className="text-xs text-zinc-500">
                      {RELEASE_STATUS_LABELS[release.status]}
                      {release.target_date ? ` · ${release.target_date}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {(["draft", "active", "shipped"] as SttnsReleaseStatus[]).map((status) => (
                      <button
                        key={status}
                        type="button"
                        disabled={loading || release.status === status}
                        onClick={() => void setStatus(release.id, status)}
                        className={cn(
                          "rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase",
                          release.status === status
                            ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                            : "border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        )}
                      >
                        {RELEASE_STATUS_LABELS[status]}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </SttnsSlideOver>
    </>
  );
}
