/**
 * Étape C — Freeze écritures catalogue legacy (`sttns_personas` DRAFT/READY).
 *
 * Lecture (fetch, FK stories, CSV, peer-review, `personaSegmentBridge` enrich) : autorisée.
 * Écriture via `/personas` actions + `savePersona*` : bloquée (`LEGACY_READ_ONLY` / 403).
 *
 * Exception documentée : `syncLegacyTierFromSpineSegment` (pont Why → tier_label) reste
 * autorisé pour ne pas casser l’enrichissement segment Spine.
 *
 * @see legacyPersonasDeprecation.ts
 */

export const LEGACY_PERSONAS_STEP_C_COMPLETE = true as const;

/** Flag runtime — true = catalogue en lecture seule. */
export const LEGACY_PERSONAS_WRITE_FROZEN = true as const;

export const LEGACY_READ_ONLY_CODE = "LEGACY_READ_ONLY" as const;

export const LEGACY_READ_ONLY_MESSAGE =
  "LEGACY_READ_ONLY — catalogue Personas en lecture seule (Étape C). " +
  "Créez / modifiez via la Matrice Besoins (/why).";

export type LegacyPersonaWriteForbidden = {
  ok: false;
  error: string;
  code: typeof LEGACY_READ_ONLY_CODE;
  status: 403;
};

/** Résultat standard pour server actions / savePersona (pas de throw). `null` si écriture autorisée. */
export function legacyPersonaWriteForbidden(): LegacyPersonaWriteForbidden | null {
  if (!LEGACY_PERSONAS_WRITE_FROZEN) return null;
  return {
    ok: false,
    error: LEGACY_READ_ONLY_MESSAGE,
    code: LEGACY_READ_ONLY_CODE,
    status: 403,
  };
}

/**
 * Garde stricte — lève `Error('LEGACY_READ_ONLY')` si le freeze est actif.
 * Utile pour les tests / chemins qui exigent une exception.
 */
export function assertLegacyPersonaWriteAllowed(): void {
  if (LEGACY_PERSONAS_WRITE_FROZEN) {
    throw new Error(LEGACY_READ_ONLY_CODE);
  }
}

/** True si le résultat est un refus freeze (403). */
export function isLegacyPersonaWriteForbidden(
  result: { ok: boolean; code?: string; status?: number } | null | undefined
): boolean {
  if (!result || result.ok) return false;
  return result.code === LEGACY_READ_ONLY_CODE || result.status === 403;
}

/**
 * Étape A3 — entités catalogue Personas legacy gelées en écriture CSV.
 * Helpers purs (hors fichier `"use server"` — Next exige des exports async only).
 */
export const LEGACY_CSV_PERSONA_ENTITIES = [
  "personas",
  "pain_points",
  "jtbd",
] as const;

export type LegacyCsvPersonaEntity = (typeof LEGACY_CSV_PERSONA_ENTITIES)[number];

export function isLegacyPersonaCsvEntity(
  entity: string
): entity is LegacyCsvPersonaEntity {
  return (LEGACY_CSV_PERSONA_ENTITIES as readonly string[]).includes(entity);
}
