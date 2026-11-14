/**
 * Remap Stories legacy → Spine Why (Étape A1).
 *
 * Matching :
 * 1. `persona_code` ↔ `work_items.code` (type=persona)
 * 2. fallback nom ↔ `title`
 * 3. JTBD : `client_key` ↔ `code`, sinon description ↔ title (hors Pain Points)
 */

import { isPainPointJob } from "@/lib/sttns/whySpine";

export type RemapLegacyPersona = {
  id: string;
  project_id: string;
  name: string;
  persona_code: string | null;
};

export type RemapSpinePersona = {
  id: string;
  project_id: string;
  title: string;
  code: string | null;
};

export type RemapLegacyJob = {
  id: string;
  persona_id: string;
  description: string;
  client_key: string | null;
};

export type RemapSpineJob = {
  id: string;
  parent_id: string | null;
  title: string;
  code: string | null;
  metadata?: unknown;
};

function normCode(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed.toUpperCase() : null;
}

function normName(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

/** Persona Spine pour un persona legacy (code puis nom), même projet. */
export function findSpinePersonaForLegacy(
  legacy: Pick<RemapLegacyPersona, "name" | "persona_code" | "project_id">,
  spinePersonas: RemapSpinePersona[]
): RemapSpinePersona | undefined {
  const inProject = spinePersonas.filter((p) => p.project_id === legacy.project_id);
  const code = normCode(legacy.persona_code);
  if (code) {
    const byCode = inProject.find((p) => normCode(p.code) === code);
    if (byCode) return byCode;
  }
  const name = normName(legacy.name);
  return inProject.find((p) => normName(p.title) === name);
}

export function buildPersonaIdRemap(
  legacyPersonas: RemapLegacyPersona[],
  spinePersonas: RemapSpinePersona[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const legacy of legacyPersonas) {
    const spine = findSpinePersonaForLegacy(legacy, spinePersonas);
    if (spine) map.set(legacy.id, spine.id);
  }
  return map;
}

/** JTBD Spine sous le persona remappé (exclut les Pain Points). */
export function findSpineJtbdForLegacyJob(
  legacy: RemapLegacyJob,
  spineJobs: RemapSpineJob[],
  spinePersonaId: string
): RemapSpineJob | undefined {
  const candidates = spineJobs.filter(
    (j) =>
      j.parent_id === spinePersonaId &&
      !isPainPointJob(j.metadata, j.title)
  );
  const key = normCode(legacy.client_key);
  if (key) {
    const byKey = candidates.find((j) => normCode(j.code) === key);
    if (byKey) return byKey;
  }
  const desc = normName(legacy.description);
  return candidates.find((j) => normName(j.title) === desc);
}

export function buildJobIdRemap(
  legacyJobs: RemapLegacyJob[],
  spineJobs: RemapSpineJob[],
  personaRemap: Map<string, string>
): Map<string, string> {
  const map = new Map<string, string>();
  for (const legacy of legacyJobs) {
    const spinePersonaId = personaRemap.get(legacy.persona_id);
    if (!spinePersonaId) continue;
    const spine = findSpineJtbdForLegacyJob(legacy, spineJobs, spinePersonaId);
    if (spine) map.set(legacy.id, spine.id);
  }
  return map;
}

/** Applique un remap UUID (identité si déjà Spine / inconnu → null). */
export function remapOrNull(
  legacyId: string | null | undefined,
  remap: Map<string, string>,
  alreadySpineIds?: Set<string>
): string | null {
  if (!legacyId) return null;
  if (alreadySpineIds?.has(legacyId)) return legacyId;
  return remap.get(legacyId) ?? null;
}
