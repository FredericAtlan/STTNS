import { computePersonaCoverage } from "@/lib/personas/personaCoverage";
import { personaToFormValues } from "@/lib/personas/personaFormMappers";
import type { SttnsPersona } from "@/types/sttns";

export type PersonaHealthLevel = "empty" | "incomplete" | "critical" | "warning" | "healthy";

export type PersonaCatalogHealth = {
  level: PersonaHealthLevel;
  criticalCount: number;
  warningCount: number;
  /** Matrice PP ↔ JTBD : aucune friction ignorée */
  matrixReady: boolean;
  label: string;
  tip: string;
};

const HEALTH_META: Record<
  PersonaHealthLevel,
  Pick<PersonaCatalogHealth, "label" | "tip">
> = {
  empty: {
    label: "Vide",
    tip: "Aucune friction ni job renseigné.",
  },
  incomplete: {
    label: "À compléter",
    tip: "Il manque des frictions ou des jobs to be done.",
  },
  critical: {
    label: "Friction ignorée",
    tip: "Au moins une friction n'est résolue par aucun job.",
  },
  warning: {
    label: "Job fantôme",
    tip: "Au moins un job n'adresse aucune friction.",
  },
  healthy: {
    label: "Matrice OK",
    tip: "Frictions couvertes — prêt pour le statut Ready.",
  },
};

export function computePersonaCatalogHealth(persona: SttnsPersona): PersonaCatalogHealth {
  const values = personaToFormValues(persona);
  const pains = values.painPoints.filter((p) => p.shortLabel.trim());
  const jobs = values.jobs.filter((j) => j.label.trim());

  if (pains.length === 0 && jobs.length === 0) {
    return {
      level: "empty",
      criticalCount: 0,
      warningCount: 0,
      matrixReady: false,
      ...HEALTH_META.empty,
    };
  }

  if (pains.length === 0 || jobs.length === 0) {
    return {
      level: "incomplete",
      criticalCount: 0,
      warningCount: 0,
      matrixReady: false,
      ...HEALTH_META.incomplete,
    };
  }

  const report = computePersonaCoverage(values.painPoints, values.jobs);

  if (report.criticals.length > 0) {
    return {
      level: "critical",
      criticalCount: report.criticals.length,
      warningCount: report.warnings.length,
      matrixReady: false,
      ...HEALTH_META.critical,
    };
  }

  if (report.warnings.length > 0) {
    return {
      level: "warning",
      criticalCount: 0,
      warningCount: report.warnings.length,
      matrixReady: false,
      ...HEALTH_META.warning,
    };
  }

  return {
    level: "healthy",
    criticalCount: 0,
    warningCount: 0,
    matrixReady: true,
    ...HEALTH_META.healthy,
  };
}

export type PersonaCatalogFilter =
  | "all"
  | "incomplete"
  | "critical"
  | "ghostJob"
  | "ready";

export function matchesPersonaCatalogFilter(
  row: {
    personaStatus: "DRAFT" | "READY";
    health: PersonaCatalogHealth;
  },
  filter: PersonaCatalogFilter
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "incomplete":
      return row.health.level === "empty" || row.health.level === "incomplete";
    case "critical":
      return row.health.criticalCount > 0;
    case "ghostJob":
      return row.health.warningCount > 0;
    case "ready":
      return row.personaStatus === "READY";
    default:
      return true;
  }
}
