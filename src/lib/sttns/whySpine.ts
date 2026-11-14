/**
 * Why Spine — typage unique Pain Point vs JTBD.
 *
 * Règle d'or (sans ambiguïté) :
 * 1. `metadata.spine_role === "pain_point"` → Pain Point (source de vérité)
 * 2. Fallback legacy : titre `[Pain Point: …]` si rôle absent (données pré-migration)
 * 3. Sinon → JTBD
 *
 * Aucun préfixe de titre n'est requis pour les écritures nouvelles
 * (`saveWorkItem` pose déjà `spine_role`).
 */

import type { PainPointMetadata } from "@/lib/sttns/types";

export type PainPointSeverity = PainPointMetadata["severity"];

const PAIN_POINT_TITLE_RE = /^\[Pain Point:\s*(low|medium|high|critical)\]\s*(.*)$/i;

export type WhyJobLike = {
  id: string;
  title: string;
  parent_id?: string | null;
  metadata?: unknown;
  status?: string | null;
  code?: string | null;
};

export function readSpineRole(metadata: unknown): string | undefined {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
    return undefined;
  }
  const role = (metadata as Record<string, unknown>).spine_role;
  return typeof role === "string" ? role : undefined;
}

/**
 * Détermine si un work item `type=job` est un Pain Point.
 * Priorité : spine_role, puis convention titre legacy.
 */
export function isPainPointJob(
  metadata: unknown,
  title?: string | null
): boolean {
  if (readSpineRole(metadata) === "pain_point") return true;
  if (typeof title === "string" && title.startsWith("[Pain Point")) return true;
  return false;
}

export function isJtbdJob(metadata: unknown, title?: string | null): boolean {
  return !isPainPointJob(metadata, title);
}

/** Parse champs affichage PP (métadonnées + fallback titre). */
export function parsePainPointFields(
  title: string,
  metadata: unknown
): { severity: PainPointSeverity; label: string } {
  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    const m = metadata as Record<string, unknown>;
    const severity = m.severity;
    const label = m.label;
    if (
      (severity === "low" ||
        severity === "medium" ||
        severity === "high" ||
        severity === "critical") &&
      typeof label === "string" &&
      label.trim()
    ) {
      return { severity, label: label.trim() };
    }
  }

  const match = title.match(PAIN_POINT_TITLE_RE);
  if (match) {
    return {
      severity: match[1].toLowerCase() as PainPointSeverity,
      label: match[2].trim() || title,
    };
  }

  return { severity: "medium", label: title };
}

export type SplitWhyJobsResult<T extends WhyJobLike> = {
  painPoints: T[];
  jtbds: T[];
};

/** Sépare une liste de jobs en Pain Points et JTBD (typage unique). */
export function splitWhyJobs<T extends WhyJobLike>(
  jobs: T[] | null | undefined
): SplitWhyJobsResult<T> {
  const painPoints: T[] = [];
  const jtbds: T[] = [];
  for (const job of jobs ?? []) {
    if (isPainPointJob(job.metadata, job.title)) {
      painPoints.push(job);
    } else {
      jtbds.push(job);
    }
  }
  return { painPoints, jtbds };
}

/** Options palette / formulaires : PP avec sévérité + label lisible. */
export type WhyPainPointOption = {
  id: string;
  title: string;
  persona_id: string;
  severity: PainPointSeverity;
  label: string;
};

export function toWhyPainPointOptions(
  jobs: WhyJobLike[] | null | undefined
): WhyPainPointOption[] {
  const { painPoints } = splitWhyJobs(jobs ?? []);
  return painPoints.map((pp) => {
    const { severity, label } = parsePainPointFields(pp.title, pp.metadata);
    return {
      id: pp.id,
      title: pp.title,
      persona_id: pp.parent_id ?? "",
      severity,
      label,
    };
  });
}
