/** Matrice persona PP ↔ JTBD — modèle formulaire (spec produit). */

export type PersonaTier = string;

export type PersonaFormStatus = "DRAFT" | "READY";

export type JobToBeDoneType = string;

export interface PainPoint {
  id: string;
  shortLabel: string;
  detail?: string;
}

export interface JobToBeDone {
  id: string;
  type: JobToBeDoneType;
  label: string;
  resolvedPainPointIds: string[];
}

export interface PersonaMatrixModel {
  name: string;
  tier: PersonaTier;
  summary: string;
  status: PersonaFormStatus;
  painPoints: PainPoint[];
  jobs: JobToBeDone[];
}

/** Alias spec produit */
export type Persona = PersonaMatrixModel;

export const PERSONA_TIER_OPTIONS: { value: PersonaTier; label: string }[] = [
  { value: "T1", label: "T1 — Segment 1 - Micro-Entreprise Informelle" },
  { value: "T2", label: "T2 — Segment 2 - PME en Structuration" },
  { value: "T3", label: "T3 — Segment 3 - PME Formelle Structurée" },
  { value: "T4", label: "T4 — Segment 4 - ETI & Grandes PME" },
  { value: "INVEST", label: "INVEST — Investisseur & Capital-Risque" },
  { value: "AUDIT", label: "AUDIT — Expert-Comptable & Auditeur" },
  { value: "REGUL", label: "REGUL — Régulateur & Administration" },
  { value: "DATA", label: "DATA — Architecte de Données" },
];

export const JOB_TYPE_SECTIONS: {
  type: JobToBeDoneType;
  title: string;
  hint: string;
}[] = [
  {
    type: "functional",
    title: "Jobs fonctionnels",
    hint: "Ce que la persona doit accomplir concrètement.",
  },
  {
    type: "social",
    title: "Jobs sociaux",
    hint: "Comment elle veut être perçue par son réseau.",
  },
  {
    type: "emotional",
    title: "Jobs émotionnels",
    hint: "Comment elle veut se sentir au quotidien.",
  },
];

export function nextPainPointId(existing: PainPoint[]): string {
  const nums = existing
    .map((p) => /^pp-(\d+)$/.exec(p.id)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length ? Math.max(...nums) + 1 : existing.length + 1;
  return `pp-${next}`;
}

export function nextJobId(existing: JobToBeDone[]): string {
  const nums = existing
    .map((j) => /^jb-(\d+)$/.exec(j.id)?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length ? Math.max(...nums) + 1 : existing.length + 1;
  return `jb-${next}`;
}

export function createEmptyPainPoint(existing: PainPoint[]): PainPoint {
  return { id: nextPainPointId(existing), shortLabel: "", detail: "" };
}

export function createEmptyJob(existing: JobToBeDone[], type: JobToBeDoneType): JobToBeDone {
  return {
    id: nextJobId(existing),
    type,
    label: "",
    resolvedPainPointIds: [],
  };
}
