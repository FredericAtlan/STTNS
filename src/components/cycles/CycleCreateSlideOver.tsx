"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Save } from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import {
  createCycleAction,
  updateCycleAction,
} from "@/app/projects/[slug]/cycles/actions";
import type { CycleRow } from "@/lib/sttns/cycles";

function formatDateInput(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function defaultCycleDates(weeks: number): { start: string; end: string } {
  const start = new Date();
  const end = new Date(start);
  end.setDate(end.getDate() + weeks * 7);
  return { start: formatDateInput(start), end: formatDateInput(end) };
}

interface Props {
  open: boolean;
  projectId: string;
  projectSlug: string;
  defaultCycleWeeks: number;
  /** Cycle existant — mode édition si défini. */
  cycle?: CycleRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function CycleCreateSlideOver({
  open,
  projectId,
  projectSlug,
  defaultCycleWeeks,
  cycle = null,
  onClose,
  onSuccess,
}: Props) {
  const isEdit = Boolean(cycle?.id);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [capacityPoints, setCapacityPoints] = useState("10");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!open) return;

    if (cycle) {
      setName(cycle.name);
      setStartDate(cycle.start_date);
      setEndDate(cycle.end_date);
      setCapacityPoints(String(cycle.capacity_points || 10));
      setIsActive(cycle.is_active);
      setError(null);
      return;
    }

    const { start, end } = defaultCycleDates(defaultCycleWeeks);
    setName("");
    setStartDate(start);
    setEndDate(end);
    setCapacityPoints("10");
    setIsActive(true);
    setError(null);
  }, [open, cycle, defaultCycleWeeks]);

  function handleClose() {
    onClose();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;

    const capacity = parseInt(capacityPoints, 10);
    if (isNaN(capacity) || capacity < 0) {
      setError("La capacité doit être un nombre positif.");
      return;
    }

    setLoading(true);
    setError(null);

    const payload = {
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive,
      capacity_points: capacity,
    };

    const result = isEdit
      ? await updateCycleAction(cycle!.id, projectId, projectSlug, payload)
      : await createCycleAction(projectId, projectSlug, payload);

    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    onSuccess();
    onClose();
  }

  return (
    <SttnsSlideOver
      open={open}
      onClose={handleClose}
      title={isEdit ? "Modifier le cycle" : "Nouveau cycle"}
      eyebrow="Sprints · Exécution"
      size="sm"
    >
      {error && (
        <div className="mb-4 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-700">Nom du cycle *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            placeholder="ex: Cycle 1 — Fondation"
            required
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-zinc-700">Date de début *</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-700">Date de fin *</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-zinc-700">Capacité (jours)</label>
          <p className="mt-0.5 text-xs text-zinc-500">
            Budget d&apos;effort en jours pour ce cycle (ex. 10 j).
          </p>
          <input
            type="number"
            min={0}
            value={capacityPoints}
            onChange={(e) => setCapacityPoints(e.target.value)}
            className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
          />
        </div>

        <label className="flex items-start gap-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          Disponible pour assignation aux stories (non clôturé)
        </label>

        <div className="flex gap-3 pt-2 border-t border-zinc-200">
          <button
            type="submit"
            disabled={loading || !name.trim() || !startDate || !endDate}
            className="sttns-btn-primary sttns-btn-md"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isEdit ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {isEdit ? "Enregistrer" : "Créer le cycle"}
          </button>
          <button
            type="button"
            onClick={handleClose}
            className="rounded border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Annuler
          </button>
        </div>
      </form>
    </SttnsSlideOver>
  );
}
