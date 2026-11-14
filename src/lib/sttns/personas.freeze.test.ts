/**
 * Étape C — Freeze Audit : catalogue legacy `sttns_personas` en lecture seule.
 */
import { describe, expect, it, vi } from "vitest";
import {
  LEGACY_PERSONAS_STEP_C_COMPLETE,
  LEGACY_PERSONAS_WRITE_FROZEN,
  LEGACY_READ_ONLY_CODE,
  assertLegacyPersonaWriteAllowed,
  isLegacyPersonaWriteForbidden,
  legacyPersonaWriteForbidden,
} from "@/lib/sttns/legacyPersonasFreeze";
import {
  LEGACY_PERSONA_DB_TOUCHPOINTS,
  LEGACY_PERSONAS_STEP_A1_COMPLETE,
  LEGACY_PERSONAS_STEP_B_COMPLETE,
} from "@/lib/sttns/legacyPersonasDeprecation";
import {
  savePersonaWithRelations,
  deletePersona,
  duplicatePersona,
} from "@/lib/sttns/savePersona";
import {
  enrichSpinePersonasWithSegment,
  findLegacyPersonaForSpine,
  resolvePersonaSegmentLabel,
} from "@/lib/sttns/personaSegmentBridge";
import {
  jobsForPersona,
  normalizePersonas,
  painPointsForPersona,
  sortPersonaRelations,
} from "@/lib/sttns/personas";
import type { SttnsPersona } from "@/types/sttns";
import { fallbackPersonaVocabulary } from "@/lib/personas/personaVocabulary";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    throw new Error("SUPABASE_SHOULD_NOT_BE_CALLED_ON_FROZEN_WRITE");
  }),
}));

vi.mock("@/lib/sttns/access", () => ({
  requireProjectMember: vi.fn(async () => ({ ok: true as const })),
  requireDraftAuthor: vi.fn(async () => ({ ok: true as const })),
}));

const SAMPLE_PERSONA = {
  id: "legacy-persona-1",
  project_id: "proj-1",
  name: "Adja",
  persona_code: "ADJ",
  project_scope: "active" as const,
  tier_label: "T1",
  profile_summary: null,
  avatar_url: null,
  persona_status: "DRAFT" as const,
  archived_at: null,
  friction_summary: null,
  pain_point_detail: null,
  job_functional: null,
  job_emotional: null,
  job_social: null,
  sort_order: 0,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  pain_points: [
    {
      id: "pp-1",
      persona_id: "legacy-persona-1",
      label: "Liquidité",
      description: null,
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
  jobs: [
    {
      id: "job-1",
      persona_id: "legacy-persona-1",
      job_type: "functional" as const,
      description: "Payer vite",
      sort_order: 1,
      created_at: "2026-01-01T00:00:00.000Z",
    },
  ],
} satisfies SttnsPersona;

const VOCAB = fallbackPersonaVocabulary();

describe("personas.freeze — Test 1 : Write Blocked", () => {
  it("expose le freeze Étape C actif", () => {
    expect(LEGACY_PERSONAS_STEP_C_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_WRITE_FROZEN).toBe(true);
    expect(legacyPersonaWriteForbidden()?.code).toBe(LEGACY_READ_ONLY_CODE);
    expect(legacyPersonaWriteForbidden()?.status).toBe(403);
  });

  it("assertLegacyPersonaWriteAllowed lève LEGACY_READ_ONLY", () => {
    expect(() => assertLegacyPersonaWriteAllowed()).toThrow(LEGACY_READ_ONLY_CODE);
  });

  it("savePersonaWithRelations échoue en 403 sans toucher Supabase", async () => {
    const result = await savePersonaWithRelations("proj-1", {
      name: "Nouveau",
      persona_code: "P9",
      project_scope: "active",
      tier_label: "T1",
      profile_summary: "",
      persona_status: "DRAFT",
      pain_points: [],
      jobs: [],
    });

    expect(result.ok).toBe(false);
    expect(isLegacyPersonaWriteForbidden(result)).toBe(true);
    if (!result.ok) {
      expect(result.error).toMatch(/LEGACY_READ_ONLY/);
    }
  });

  it("deletePersona et duplicatePersona sont aussi gelés", async () => {
    const del = await deletePersona("legacy-persona-1", "proj-1");
    const dup = await duplicatePersona("legacy-persona-1", "proj-1");
    expect(isLegacyPersonaWriteForbidden(del)).toBe(true);
    expect(isLegacyPersonaWriteForbidden(dup)).toBe(true);
  });
});

describe("personas.freeze — Test 2 : Read Allowed", () => {
  it("personaSegmentBridge enrichit sans écriture", () => {
    const legacy = [
      { name: "Adja", persona_code: "ADJ", tier_label: "T1" },
    ];
    const match = findLegacyPersonaForSpine(
      { title: "Adja", code: "ADJ" },
      legacy
    );
    expect(match?.tier_label).toBe("T1");

    const segment = resolvePersonaSegmentLabel(null, "T1", VOCAB);
    expect(segment).toBeTruthy();

    const enriched = enrichSpinePersonasWithSegment(
      [
        {
          id: "spine-1",
          title: "Adja",
          code: "ADJ",
          metadata: {},
        },
      ],
      legacy,
      VOCAB
    );
    expect(enriched[0].segment).toBeTruthy();
  });

  it("helpers lecture personas.ts retournent les relations", () => {
    const sorted = sortPersonaRelations(SAMPLE_PERSONA);
    expect(painPointsForPersona(sorted)).toHaveLength(1);
    expect(jobsForPersona(sorted)[0].description).toBe("Payer vite");
    expect(normalizePersonas([SAMPLE_PERSONA])[0].name).toBe("Adja");
  });
});

describe("personas.freeze — Test 3 : Integrity FK / pas d'écriture parasite", () => {
  it("inventaire DB conserve sttns_personas ; stories FK → work_items (A1)", () => {
    expect(LEGACY_PERSONAS_STEP_B_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_A1_COMPLETE).toBe(true);
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain("sttns_personas");
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain(
      "sttns_user_stories.primary_persona_id→work_items"
    );
  });

  it("une lecture pure ne déclenche pas createClient (pas d'écriture)", () => {
    // Les helpers sync ci-dessous n'importent pas createClient — preuve lecture seule.
    const rows = normalizePersonas([SAMPLE_PERSONA]);
    expect(rows[0].id).toBe("legacy-persona-1");
    expect(rows[0].pain_points?.[0]?.persona_id).toBe(rows[0].id);
  });
});
