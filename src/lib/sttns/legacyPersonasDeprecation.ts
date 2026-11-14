/**
 * Dette Personas legacy — inventaire + statut de transition (P2).
 *
 * ## Deux mondes
 *
 * | Monde | Source de vérité | Statuts |
 * | ----- | ---------------- | ------- |
 * | **Spine Why** (canonique) | `sttns_work_items` type `persona` (+ jobs PP/JTBD) | `todo` \| `in_progress` \| `review` \| `done` |
 * | **Legacy /personas** | `sttns_personas` + `sttns_persona_pain_points` / `sttns_persona_jobs` | `DRAFT` \| `READY` |
 *
 * ## Étape B — Redirect & Deprecate (FAIT)
 *
 * - Routes `/projects/[slug]/personas*` → `/why` (308 + `redirect()`).
 * - Deep-links UI → `/why`. UI catalogue `@deprecated`.
 *
 * ## Étape C — Freeze écritures (FAIT)
 *
 * - `savePersona*` + actions `/personas` → `LEGACY_READ_ONLY` (403).
 * - Lecture FK / CSV / peer-review / `personaSegmentBridge` enrich : intacte.
 * - Exception : `syncLegacyTierFromSpineSegment` (pont Why → tier_label).
 *
 * ## Étape A1 — Stories FK → Spine (FAIT schéma + code)
 *
 * - FK `sttns_user_stories.primary_persona_id` / `target_persona_job_id` /
 *   `sttns_user_story_personas.persona_id` / `sttns_epics.primary_persona_id`
 *   → `sttns_work_items`.
 * - Remap code/nom : migration + `remapStoryPersonasToSpine.ts`.
 * - `saveUserStory` valide persona/JTBD Spine (`type=persona` / `type=job`).
 * - Tables `sttns_personas*` **conservées** (A2 Why bridge · A3 peer-review/CSV · A4 DROP).
 *
 * ## Étape A2 — Cut SELECT legacy Why (FAIT)
 *
 * - `/why` (page + workspace) ne SELECT plus `sttns_personas` : segment lu depuis
 *   `metadata.segment` (Spine-only). Vocabulary + `enrichSpinePersonasWithSegment`
 *   retirés de la page Why.
 * - Bridge `syncLegacyTierFromSpineSegment` conservé côté `savePersonaAction` mais
 *   traité en **best-effort silencieux** — un persona sans jumeau legacy ne fait
 *   PAS échouer la sauvegarde Why.
 * - CSV / peer-review / matrice besoins summary continuent de lire le catalogue legacy.
 *
 * ## Étape A3 — Peer-review / CSV / initiatives (FAIT)
 *
 * - CSV import `personas` / `pain_points` / `jtbd` → `LEGACY_READ_ONLY` (403) ;
 *   full-project import : skip silencieux + `skippedLegacyEntities`.
 *   Export lecture inchangé.
 * - Peer-review persona (`submitAssetForReview` + `saveCeoFinalDecision` sur
 *   `assetType='persona'`) → `LEGACY_READ_ONLY`. Les votes (`savePeerReview`)
 *   restent lisibles ; aucune écriture sur `sttns_personas.review_status/…`.
 * - `sttns_initiatives.persona_id` : FK retargetée vers `sttns_work_items(id)`
 *   (migration `20260721020000_*`, remap code puis nom). Le RPC
 *   `sttns_duplicate_project` force `persona_id = NULL` à la duplication (Spine
 *   Why n'est pas copié par la RPC — pas de FK cassée).
 * - `fetchInitiativeLinkedPersona` lit d'abord `sttns_work_items` (Spine metadata),
 *   fallback lecture legacy pour rétrocompatibilité.
 *
 * ## Prochaine étape
 *
 * - **A4** DROP `sttns_personas` + tables filles (uniquement après pilote OK).
 *
 * @see README.md § Audit dette Personas legacy
 * @see legacyPersonasFreeze.ts
 */

/** Étape B livrée — routes UI neutralisées. */
export const LEGACY_PERSONAS_STEP_B_COMPLETE = true as const;

/** Étape A1 livrée — FK stories/epics → work_items (tables legacy encore présentes). */
export const LEGACY_PERSONAS_STEP_A1_COMPLETE = true as const;

/**
 * Étape A2 livrée — page Why (`/why`) coupée du SELECT `sttns_personas`.
 * Segment persona lu uniquement depuis `metadata.segment` (Spine).
 * Le bridge `syncLegacyTierFromSpineSegment` reste actif côté écriture Why
 * mais en best-effort (silent no-op si aucun jumeau legacy).
 */
export const LEGACY_PERSONAS_STEP_A2_COMPLETE = true as const;

/**
 * Étape A3 livrée — CSV + peer-review + `sttns_initiatives.persona_id`.
 *
 * - CSV `personas` / `pain_points` / `jtbd` → import gelé (LEGACY_READ_ONLY).
 * - Peer-review persona (submit + CEO finalize) → gelé.
 * - `sttns_initiatives.persona_id` FK retargetée sur `sttns_work_items(id)`.
 * - `fetchInitiativeLinkedPersona` lit Spine en priorité (fallback legacy).
 */
export const LEGACY_PERSONAS_STEP_A3_COMPLETE = true as const;

/** Routes App Router historiques (désormais redirect → `/why`). */
export const LEGACY_PERSONA_ROUTES = [
  "/projects/[slug]/personas",
  "/projects/[slug]/personas/new",
  "/projects/[slug]/personas/[id]",
  "/projects/[slug]/personas/vocabulary",
] as const;

/** Tables / FK encore vivantes côté DB (ne pas DROP — Étape A4 uniquement). */
export const LEGACY_PERSONA_DB_TOUCHPOINTS = [
  "sttns_personas",
  "sttns_persona_pain_points",
  "sttns_persona_jobs",
  "sttns_persona_tier_defs",
  "sttns_persona_job_type_defs",
  "sttns_user_stories.primary_persona_id→work_items",
  "sttns_epics.primary_persona_id→work_items",
  "sttns_initiatives.persona_id→work_items (A3)",
] as const;

/**
 * Modules encore montés (lecture / FK / pont).
 * Écriture catalogue gelée — voir `legacyPersonasFreeze.ts`.
 *
 * A2 : `src/app/projects/[slug]/why/page.tsx` ne fait plus partie de cette liste
 * (SELECT `sttns_personas` retiré · Spine-only via `metadata.segment`).
 * A3 : `csvActions.ts` + `savePeerReview.ts` restent lecture ; leurs chemins
 * d'écriture legacy sont désormais gelés (voir freeze A3).
 */
export const LEGACY_PERSONA_CODE_TOUCHPOINTS = [
  "src/lib/sttns/personas.ts",
  "src/lib/sttns/savePersona.ts",
  "src/lib/sttns/legacyPersonasFreeze.ts",
  "src/app/projects/[slug]/personas/actions.ts",
  "src/components/personas/*",
  "src/lib/personas/*",
  "src/lib/sttns/personaSegmentBridge.ts (bridge best-effort savePersonaAction Why)",
  "src/lib/sttns/access.ts (DRAFT_TABLES.persona)",
  "src/lib/sttns/savePeerReview.ts (A3: submit + CEO finalize gelés)",
  "src/lib/sttns/personaPhotoStorage.ts (chemin legacy)",
  "src/app/projects/csvActions.ts (A3: import personas/pain_points/jtbd gelé)",
  "src/lib/epics/epicStoryPicker.ts",
  "src/lib/sttns/saveUserStory.ts / userStories.ts",
  "src/lib/sttns/remapStoryPersonasToSpine.ts",
  "src/lib/epics/valueChainMapping.ts",
] as const;

/**
 * Étape A3 — écritures legacy explicitement gelées côté application.
 * Sert de checklist et de documentation pour les tests.
 */
export const LEGACY_PERSONA_A3_FROZEN_WRITE_PATHS = [
  "csvActions.importEntityAction(personas|pain_points|jtbd)",
  "csvActions.importFullProjectAction (skip legacy persona entities)",
  "savePeerReview.submitAssetForReview(assetType=persona)",
  "savePeerReview.saveCeoFinalDecision(assetType=persona)",
] as const;

export type LegacyPersonasMigrationOption = "A_migrate" | "B_redirect" | "C_freeze";

/** Chemin produit : B ✅ → C ✅ → A1 ✅ → A2 ✅ → A3/A4. */
export const LEGACY_PERSONAS_RECOMMENDED_PATH: LegacyPersonasMigrationOption[] = [
  "B_redirect",
  "C_freeze",
  "A_migrate",
];

/**
 * Destination Why pour une URL legacy `/personas…`.
 * - `new` → `?tab=persona` (Slide-over création)
 * - reste → matrice ContextMatrix
 */
export function legacyPersonaRedirectPath(
  projectSlug: string,
  legacySegment?: string | null
): string {
  const base = `/projects/${projectSlug}/why`;
  if (legacySegment === "new") return `${base}?tab=persona`;
  return base;
}

/** Re-export freeze flags pour les consommateurs doc. */
export {
  LEGACY_PERSONAS_STEP_C_COMPLETE,
  LEGACY_PERSONAS_WRITE_FROZEN,
  LEGACY_READ_ONLY_CODE,
} from "@/lib/sttns/legacyPersonasFreeze";
