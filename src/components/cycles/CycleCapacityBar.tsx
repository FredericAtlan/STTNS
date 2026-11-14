"use client";

import { useState } from "react";
import { useRouter as useNextRouter } from "next/navigation";
import { Edit2, Check, X, Loader2 } from "lucide-react";
import { updateCycleCapacityAction } from "@/app/projects/[slug]/cycles/actions";

interface Props {
  projectId: string;
  projectSlug: string;
  cycleId: string;
  cycleName: string;
  totalEffort: number;
  capacity: number;
}

export function CycleCapacityBar({
  projectId,
  projectSlug,
  cycleId,
  cycleName,
  totalEffort,
  capacity: initialCapacity,
}: Props) {
  const router = useNextRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [capacity, setCapacity] = useState(initialCapacity || 10);
  const [inputValue, setInputValue] = useState(String(initialCapacity || 10));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ratio = capacity > 0 ? (totalEffort / capacity) * 100 : 0;
  const isOverCapacity = ratio > 100;

  async function handleSave() {
    const val = parseInt(inputValue, 10);
    if (isNaN(val) || val < 0) {
      setError("La capacité doit être un nombre positif.");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await updateCycleCapacityAction(cycleId, projectId, projectSlug, val);
    setLoading(false);

    if (result.ok) {
      setCapacity(val);
      setIsEditing(false);
      router.refresh();
    } else {
      setError(result.error);
    }
  }

  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-zinc-900">Capacité du cycle</h2>
          <p className="text-sm text-zinc-500 mt-0.5">
            Pilotez la charge de travail de l&apos;équipe pour le cycle <strong>{cycleName}</strong>.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-xs text-zinc-500 block">Charge planifiée</span>
            <span className="text-2xl font-bold text-zinc-900">{totalEffort}j</span>
          </div>

          <div className="h-8 w-px bg-zinc-200" />

          <div className="text-left">
            <span className="text-xs text-zinc-500 block">Capacité cible</span>
            {isEditing ? (
              <div className="flex items-center gap-1.5 mt-1">
                <input
                  type="number"
                  min="0"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="w-20 rounded border border-zinc-300 px-2 py-1 text-sm font-semibold focus:border-emerald-500 focus:outline-none"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={handleSave}
                  className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                  disabled={loading}
                  title="Enregistrer"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setInputValue(String(capacity));
                    setError(null);
                  }}
                  className="p-1 text-zinc-400 hover:bg-zinc-100 rounded"
                  disabled={loading}
                  title="Annuler"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-2xl font-bold text-zinc-900">{capacity}j</span>
                <button
                  type="button"
                  onClick={() => {
                    setInputValue(String(capacity));
                    setIsEditing(true);
                  }}
                  className="p-1 text-zinc-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                  title="Modifier la capacité"
                >
                  <Edit2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded px-3 py-1.5">
          {error}
        </p>
      )}

      {/* Barre de progression de capacité */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-semibold">
          <span className={isOverCapacity ? "text-red-600" : "text-emerald-700"}>
            {isOverCapacity ? "Surcharge de capacité !" : "Capacité optimale"}
          </span>
          <span className={isOverCapacity ? "text-red-600" : "text-zinc-600"}>
            {ratio.toFixed(0)}% ({totalEffort} / {capacity}j)
          </span>
        </div>

        <div className="h-3 w-full rounded-full bg-zinc-100 overflow-hidden border border-zinc-200/60">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isOverCapacity ? "bg-red-500" : "bg-emerald-500"
            }`}
            style={{ width: `${Math.min(ratio, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
