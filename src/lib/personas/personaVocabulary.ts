import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  SttnsPersonaJobTypeDef,
  SttnsPersonaTierDef,
} from "@/types/sttns";

export type PersonaTierOption = {
  code: string;
  label: string;
  description: string | null;
};

export type PersonaJobTypeSection = {
  code: string;
  title: string;
  hint: string;
};

export type PersonaVocabulary = {
  tiers: PersonaTierOption[];
  jobTypes: PersonaJobTypeSection[];
};

export const DEFAULT_PERSONA_TIER_DEFS: Omit<
  SttnsPersonaTierDef,
  "id" | "project_id" | "created_at" | "updated_at" | "archived_at"
>[] = [
  {
    code: "T1",
    title: "Segment 1 - Micro-Entreprise Informelle",
    description:
      "Focus MVP : Capture de flux basique, formalisation primitive et accès au micro-crédit de proximité.",
    sort_order: 1,
  },
  {
    code: "T2",
    title: "Segment 2 - PME en Structuration",
    description:
      "Focus Expansion : Collaboration comptable simplifiée, visibilité sur le BFR et éligibilité aux prêts bancaires standard.",
    sort_order: 2,
  },
  {
    code: "T3",
    title: "Segment 3 - PME Formelle Structurée",
    description:
      "Focus Scale : Automatisation des dossiers de crédit via API, réduction des délais bancaires et mise en concurrence.",
    sort_order: 3,
  },
  {
    code: "T4",
    title: "Segment 4 - ETI & Grandes PME",
    description:
      "Focus Premium : Structuration de Data Rooms pour levées de fonds (Série A/B) et préparation aux marchés de capitaux.",
    sort_order: 4,
  },
  {
    code: "INVEST",
    title: "Investisseur & Capital-Risque",
    description:
      "Partenaire de Financement : Analyse du deal-flow, due diligence accélérée et suivi des KPIs des participations.",
    sort_order: 5,
  },
  {
    code: "AUDIT",
    title: "Expert-Comptable & Auditeur",
    description:
      "Partenaire de Confiance : Collecte automatisée des pièces justificatives, rapprochement et labellisation de la santé financière.",
    sort_order: 6,
  },
  {
    code: "REGUL",
    title: "Régulateur & Administration",
    description:
      "Architecte d'Infrastructure : DGI, BRVM, Bureau de crédit — conformité fiscale, scoring macro et indexation boursière.",
    sort_order: 7,
  },
  {
    code: "DATA",
    title: "Architecte de Données",
    description:
      "Partenaire scoring & crédit : bureaux de crédit, flux certifiés, modèles prédictifs pour banques.",
    sort_order: 8,
  },
];

export const DEFAULT_PERSONA_JOB_TYPE_DEFS: Omit<
  SttnsPersonaJobTypeDef,
  "id" | "project_id" | "created_at" | "updated_at" | "archived_at"
>[] = [
  {
    code: "functional",
    title: "Jobs fonctionnels",
    hint: "Ce que la persona doit accomplir concrètement.",
    sort_order: 1,
  },
  {
    code: "social",
    title: "Jobs sociaux",
    hint: "Comment elle veut être perçue par son réseau.",
    sort_order: 2,
  },
  {
    code: "emotional",
    title: "Jobs émotionnels",
    hint: "Comment elle veut se sentir au quotidien.",
    sort_order: 3,
  },
];

export function tierOptionLabel(code: string, title: string): string {
  return `${code} — ${title}`;
}

export function vocabularyFromDefs(
  tierRows: SttnsPersonaTierDef[],
  jobTypeRows: SttnsPersonaJobTypeDef[]
): PersonaVocabulary {
  const activeTiers = tierRows
    .filter((row) => !row.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));

  const activeJobTypes = jobTypeRows
    .filter((row) => !row.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order || a.code.localeCompare(b.code));

  return {
    tiers: activeTiers.map((row) => ({
      code: row.code,
      label: tierOptionLabel(row.code, row.title),
      description: row.description?.trim() || null,
    })),
    jobTypes: activeJobTypes.map((row) => ({
      code: row.code,
      title: row.title,
      hint: row.hint?.trim() || "",
    })),
  };
}

export function fallbackPersonaVocabulary(): PersonaVocabulary {
  return vocabularyFromDefs(
    DEFAULT_PERSONA_TIER_DEFS.map((row, index) => ({
      ...row,
      id: `default-tier-${index}`,
      project_id: "",
      archived_at: null,
      created_at: "",
      updated_at: "",
    })),
    DEFAULT_PERSONA_JOB_TYPE_DEFS.map((row, index) => ({
      ...row,
      id: `default-job-${index}`,
      project_id: "",
      archived_at: null,
      created_at: "",
      updated_at: "",
    }))
  );
}

export function resolveTierCode(
  raw: string | null | undefined,
  tierCodes: string[]
): string {
  const codes = tierCodes.length ? tierCodes : ["T2"];
  const value = raw?.trim();
  if (!value) return codes[0];

  if (codes.includes(value)) return value;

  const upper = value.toUpperCase();
  if (codes.includes(upper)) return upper;

  const tierMatch = /tier\s*(\d+)/i.exec(value);
  if (tierMatch) {
    const fromLegacy = `T${tierMatch[1]}`;
    if (codes.includes(fromLegacy)) return fromLegacy;
  }

  return codes[0];
}

export function resolveTierDisplay(
  raw: string | null | undefined,
  vocabulary: PersonaVocabulary
): string | null {
  if (!raw?.trim()) return null;
  const code = resolveTierCode(raw, vocabulary.tiers.map((t) => t.code));
  const match = vocabulary.tiers.find((t) => t.code === code);
  if (match) return match.label;
  return raw.trim();
}

export function resolveJobTypeLabel(
  code: string,
  vocabulary: PersonaVocabulary
): string {
  const match = vocabulary.jobTypes.find((t) => t.code === code);
  if (match) return match.title;
  const legacy: Record<string, string> = {
    functional: "Fonctionnel",
    social: "Social",
    emotional: "Émotionnel",
  };
  return legacy[code] ?? code;
}

export function jobTypePlaceholder(code: string): string {
  switch (code) {
    case "functional":
      return "Accomplir… sans…";
    case "social":
      return "Être perçu comme…";
    case "emotional":
      return "Me sentir…";
    default:
      return "Formuler le job en langage métier…";
  }
}

export function normalizePersonaVocabularyCode(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
}

/** Réactive ou crée les défauts STTNS (gère les lignes archivées + contrainte unique). */
export async function upsertDefaultPersonaVocabulary(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const now = new Date().toISOString();

  for (const row of DEFAULT_PERSONA_TIER_DEFS) {
    await supabase.from("sttns_persona_tier_defs").upsert(
      {
        project_id: projectId,
        code: row.code,
        title: row.title,
        description: row.description,
        sort_order: row.sort_order,
        archived_at: null,
        updated_at: now,
      },
      { onConflict: "project_id,code" }
    );
  }

  for (const row of DEFAULT_PERSONA_JOB_TYPE_DEFS) {
    await supabase.from("sttns_persona_job_type_defs").upsert(
      {
        project_id: projectId,
        code: row.code,
        title: row.title,
        hint: row.hint,
        sort_order: row.sort_order,
        archived_at: null,
        updated_at: now,
      },
      { onConflict: "project_id,code" }
    );
  }
}

export async function ensurePersonaVocabulary(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  const [{ count: activeTierCount }, { count: activeJobCount }] = await Promise.all([
    supabase
      .from("sttns_persona_tier_defs")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .is("archived_at", null),
    supabase
      .from("sttns_persona_job_type_defs")
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .is("archived_at", null),
  ]);

  if (!activeTierCount || !activeJobCount) {
    await upsertDefaultPersonaVocabulary(supabase, projectId);
  }
}

export async function fetchPersonaTierDefs(
  supabase: SupabaseClient,
  projectId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<SttnsPersonaTierDef[]> {
  await ensurePersonaVocabulary(supabase, projectId);

  let query = supabase
    .from("sttns_persona_tier_defs")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("code");

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as SttnsPersonaTierDef[];
}

export async function fetchPersonaJobTypeDefs(
  supabase: SupabaseClient,
  projectId: string,
  { includeArchived = false }: { includeArchived?: boolean } = {}
): Promise<SttnsPersonaJobTypeDef[]> {
  await ensurePersonaVocabulary(supabase, projectId);

  let query = supabase
    .from("sttns_persona_job_type_defs")
    .select("*")
    .eq("project_id", projectId)
    .order("sort_order")
    .order("code");

  if (!includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error || !data) return [];
  return data as SttnsPersonaJobTypeDef[];
}

/** Complète le vocabulaire DB avec les défauts STTNS manquants (filet de sécurité UI). */
export function mergePersonaVocabularyWithDefaults(
  vocabulary: PersonaVocabulary
): PersonaVocabulary {
  const fallback = fallbackPersonaVocabulary();
  const tiers = [...vocabulary.tiers];
  const jobTypes = [...vocabulary.jobTypes];

  for (const tier of fallback.tiers) {
    if (!tiers.some((t) => t.code === tier.code)) tiers.push(tier);
  }
  for (const jobType of fallback.jobTypes) {
    if (!jobTypes.some((t) => t.code === jobType.code)) jobTypes.push(jobType);
  }

  return { tiers, jobTypes };
}

export async function fetchPersonaVocabulary(
  supabase: SupabaseClient,
  projectId: string
): Promise<PersonaVocabulary> {
  await ensurePersonaVocabulary(supabase, projectId);

  const [tiers, jobTypes] = await Promise.all([
    fetchPersonaTierDefs(supabase, projectId),
    fetchPersonaJobTypeDefs(supabase, projectId),
  ]);

  const vocabulary = vocabularyFromDefs(tiers, jobTypes);
  return mergePersonaVocabularyWithDefaults(vocabulary);
}

export async function seedPersonaVocabularyForProject(
  supabase: SupabaseClient,
  projectId: string
): Promise<void> {
  await ensurePersonaVocabulary(supabase, projectId);
}
