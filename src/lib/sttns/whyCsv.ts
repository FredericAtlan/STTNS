/**
 * Export / import Matrice Besoins (Why) — format CSV Spine.
 * Entités : personas · pain_points · jtbd (ZIP côté UI).
 */

import { isPainPointJob, parsePainPointFields, type WhyJobLike } from "@/lib/sttns/whySpine";

export const WHY_CSV_ENTITIES = ["personas", "pain_points", "jtbd"] as const;
export type WhyCsvEntity = (typeof WHY_CSV_ENTITIES)[number];

export type WhyCsvPersonaRow = {
  id: string;
  code: string;
  title: string;
  status: string;
  segment: string;
  description: string;
  doc_url: string;
};

export type WhyCsvPainPointRow = {
  id: string;
  persona_id: string;
  persona_code: string;
  label: string;
  severity: string;
  status: string;
};

export type WhyCsvJtbdRow = {
  id: string;
  persona_id: string;
  persona_code: string;
  title: string;
  status: string;
  /** UUIDs séparés par `;` */
  solved_pain_point_ids: string;
};

export type WhyCsvBundle = {
  personas: WhyCsvPersonaRow[];
  pain_points: WhyCsvPainPointRow[];
  jtbd: WhyCsvJtbdRow[];
};

type PersonaLike = {
  id: string;
  title: string;
  code: string | null;
  status?: string | null;
  metadata?: unknown;
};

type SolveLink = { source_id: string; target_id: string };

function metaString(metadata: unknown, key: string): string {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return "";
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : "";
}

function cell(value: unknown): string {
  if (value == null) return "";
  return String(value).trim();
}

export function buildWhyCsvBundle(
  personas: PersonaLike[],
  jobs: WhyJobLike[],
  solveLinks: SolveLink[]
): WhyCsvBundle {
  const personaById = new Map(personas.map((p) => [p.id, p]));
  const solvedByJtbd = new Map<string, string[]>();
  for (const link of solveLinks) {
    const list = solvedByJtbd.get(link.source_id) ?? [];
    list.push(link.target_id);
    solvedByJtbd.set(link.source_id, list);
  }

  const personaRows: WhyCsvPersonaRow[] = personas.map((p) => ({
    id: p.id,
    code: cell(p.code),
    title: cell(p.title),
    status: cell(p.status) || "todo",
    segment: metaString(p.metadata, "segment"),
    description: metaString(p.metadata, "description"),
    doc_url: metaString(p.metadata, "doc_url"),
  }));

  const painPointRows: WhyCsvPainPointRow[] = [];
  const jtbdRows: WhyCsvJtbdRow[] = [];

  for (const job of jobs) {
    const parentId = job.parent_id ?? "";
    const parent = personaById.get(parentId);
    const personaCode = cell(parent?.code);
    if (isPainPointJob(job.metadata, job.title)) {
      const parsed = parsePainPointFields(job.title, job.metadata);
      painPointRows.push({
        id: job.id,
        persona_id: parentId,
        persona_code: personaCode,
        label: parsed.label,
        severity: parsed.severity,
        status: cell(job.status) || "todo",
      });
    } else {
      jtbdRows.push({
        id: job.id,
        persona_id: parentId,
        persona_code: personaCode,
        title: cell(job.title),
        status: cell(job.status) || "todo",
        solved_pain_point_ids: (solvedByJtbd.get(job.id) ?? []).join(";"),
      });
    }
  }

  return {
    personas: personaRows,
    pain_points: painPointRows,
    jtbd: jtbdRows,
  };
}

export function parseSolvedPainPointIds(raw: unknown): string[] {
  const text = cell(raw);
  if (!text) return [];
  return text
    .split(/[;,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function normalizeWhyCsvBundle(raw: Record<string, unknown[]>): WhyCsvBundle {
  const personas = (raw.personas ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: cell(r.id),
      code: cell(r.code),
      title: cell(r.title) || cell(r.name),
      status: cell(r.status) || "todo",
      segment: cell(r.segment),
      description: cell(r.description),
      doc_url: cell(r.doc_url),
    } satisfies WhyCsvPersonaRow;
  });

  const pain_points = (raw.pain_points ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: cell(r.id),
      persona_id: cell(r.persona_id),
      persona_code: cell(r.persona_code),
      label: cell(r.label) || cell(r.title),
      severity: cell(r.severity) || "medium",
      status: cell(r.status) || "todo",
    } satisfies WhyCsvPainPointRow;
  });

  const jtbd = (raw.jtbd ?? []).map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: cell(r.id),
      persona_id: cell(r.persona_id),
      persona_code: cell(r.persona_code),
      title: cell(r.title) || cell(r.job_statement),
      status: cell(r.status) || "todo",
      solved_pain_point_ids: cell(r.solved_pain_point_ids),
    } satisfies WhyCsvJtbdRow;
  });

  return { personas, pain_points, jtbd };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_RE.test(value);
}
