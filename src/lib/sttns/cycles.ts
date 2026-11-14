import { z } from "zod";

export const cycleSaveSchema = z
  .object({
    name: z.string().trim().min(1, "Le nom du cycle est obligatoire.").max(255),
    start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de début invalide."),
    end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date de fin invalide."),
    is_active: z.boolean().optional().default(true),
    capacity_points: z.coerce.number().int().min(0).optional().default(0),
  })
  .refine((data) => data.start_date <= data.end_date, {
    message: "La date de fin doit être postérieure ou égale à la date de début.",
    path: ["end_date"],
  });

export type CycleSaveInput = z.infer<typeof cycleSaveSchema>;

export type CycleDisplayStatus = "planned" | "active" | "done";

export type CycleRow = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  capacity_points: number;
  status: CycleDisplayStatus;
};

export function cycleStatusLabel(status: CycleDisplayStatus): string {
  const labels: Record<CycleDisplayStatus, string> = {
    planned: "Planifié",
    active: "Actif",
    done: "Terminé",
  };
  return labels[status];
}

export function cycleStatusClass(status: CycleDisplayStatus): string {
  switch (status) {
    case "planned":
      return "bg-sky-100 text-sky-800";
    case "active":
      return "bg-emerald-100 text-emerald-800";
    case "done":
      return "bg-zinc-100 text-zinc-600";
  }
}

function parseDateOnly(isoDate: string): Date {
  const [y, m, d] = isoDate.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Statut affiché — dérivé des dates et de is_active (pas de colonne DB). */
export function computeCycleStatus(
  cycle: Pick<CycleRow, "start_date" | "end_date" | "is_active">,
  referenceDate: Date = new Date()
): CycleDisplayStatus {
  if (!cycle.is_active) return "done";

  const today = startOfDay(referenceDate);
  const start = parseDateOnly(cycle.start_date);
  const end = parseDateOnly(cycle.end_date);

  if (today < start) return "planned";
  if (today > end) return "done";
  return "active";
}

export function enrichCycleRow(
  cycle: Omit<CycleRow, "status">
): CycleRow {
  return {
    ...cycle,
    status: computeCycleStatus(cycle),
  };
}

export function formatCycleDate(isoDate: string): string {
  return parseDateOnly(isoDate).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Période calendaire d'un cycle — ex. « 01 juin – 15 juin 2026 ». */
export function formatCyclePeriod(startDate: string, endDate: string): string {
  const capitalize = (value: string) =>
    value.charAt(0).toUpperCase() + value.slice(1);

  const start = parseDateOnly(startDate);
  const end = parseDateOnly(endDate);
  const sameYear = start.getFullYear() === end.getFullYear();

  const startLabel = capitalize(
    start.toLocaleDateString("fr-FR", { day: "2-digit", month: "long" })
  );
  const endLabel = capitalize(
    end.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "long",
      ...(sameYear ? { year: "numeric" } : {}),
    })
  );

  if (sameYear) {
    const endWithYear = capitalize(
      end.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })
    );
    return `${startLabel} – ${endWithYear}`;
  }

  return `${startLabel} ${start.getFullYear()} – ${endLabel} ${end.getFullYear()}`;
}

/** Cycles disponibles pour assignation Story (actifs non archivés). */
export function isCycleAssignable(cycle: Pick<CycleRow, "is_active" | "status">): boolean {
  return cycle.is_active && cycle.status !== "done";
}
