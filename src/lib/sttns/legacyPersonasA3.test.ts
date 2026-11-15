/**
 * Étape A3 — Freeze CSV + peer-review + retarget `sttns_initiatives.persona_id`.
 *
 * Miroir de `legacyPersonasDeprecation.test.ts` : verrouille la posture A3 (flag,
 * touchpoints, chemins d'écriture gelés, migration retarget).
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it, vi } from "vitest";
import {
  LEGACY_PERSONAS_STEP_A1_COMPLETE,
  LEGACY_PERSONAS_STEP_A2_COMPLETE,
  LEGACY_PERSONAS_STEP_A3_COMPLETE,
  LEGACY_PERSONAS_STEP_B_COMPLETE,
  LEGACY_PERSONA_A3_FROZEN_WRITE_PATHS,
  LEGACY_PERSONA_CODE_TOUCHPOINTS,
  LEGACY_PERSONA_DB_TOUCHPOINTS,
} from "@/lib/sttns/legacyPersonasDeprecation";
import {
  LEGACY_PERSONAS_STEP_C_COMPLETE,
  LEGACY_READ_ONLY_CODE,
  LEGACY_READ_ONLY_MESSAGE,
  isLegacyPersonaCsvEntity,
  LEGACY_CSV_PERSONA_ENTITIES,
} from "@/lib/sttns/legacyPersonasFreeze";
import {
  importEntityAction,
  importFullProjectAction,
} from "@/app/projects/csvActions";
import { submitAssetForReview, saveCeoFinalDecision } from "@/lib/sttns/savePeerReview";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => {
    throw new Error("SUPABASE_SHOULD_NOT_BE_CALLED_ON_FROZEN_WRITE");
  }),
}));

vi.mock("@/lib/sttns/access", () => ({
  requireAuth: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
  requireProjectMember: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
  requireProjectEditor: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
  requireProjectCeoAdmin: vi.fn(async () => ({ ok: true as const, userId: "user-1" })),
  requireDraftAuthor: vi.fn(async () => ({ ok: true as const })),
}));

describe("legacyPersonasA3 — Test 1 : Flags & inventaire", () => {
  it("expose la chaîne B → C → A1 → A2 → A3 comme complète", () => {
    expect(LEGACY_PERSONAS_STEP_B_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_C_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_A1_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_A2_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_A3_COMPLETE).toBe(true);
  });

  it("retarget FK initiatives.persona_id documenté dans l'inventaire DB", () => {
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain(
      "sttns_initiatives.persona_id→work_items (A3)"
    );
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).not.toContain(
      "initiatives.persona_id→sttns_personas (A3)"
    );
  });

  it("touchpoints code A3 annotés (CSV + peer-review)", () => {
    expect(
      LEGACY_PERSONA_CODE_TOUCHPOINTS.some((e) =>
        e.includes("src/app/projects/csvActions.ts") && e.includes("A3")
      )
    ).toBe(true);
    expect(
      LEGACY_PERSONA_CODE_TOUCHPOINTS.some((e) =>
        e.includes("src/lib/sttns/savePeerReview.ts") && e.includes("A3")
      )
    ).toBe(true);
  });

  it("liste des chemins d'écriture gelés A3 couvre CSV + peer-review", () => {
    const paths = LEGACY_PERSONA_A3_FROZEN_WRITE_PATHS.join("\n");
    expect(paths).toMatch(/csvActions\.importEntityAction/);
    expect(paths).toMatch(/csvActions\.importFullProjectAction/);
    expect(paths).toMatch(/savePeerReview\.submitAssetForReview/);
    expect(paths).toMatch(/savePeerReview\.saveCeoFinalDecision/);
  });
});

describe("legacyPersonasA3 — Test 2 : CSV Freeze", () => {
  it("expose la liste des entités catalogue personas legacy", () => {
    expect(LEGACY_CSV_PERSONA_ENTITIES).toEqual(["personas", "pain_points", "jtbd"]);
    expect(isLegacyPersonaCsvEntity("personas")).toBe(true);
    expect(isLegacyPersonaCsvEntity("pain_points")).toBe(true);
    expect(isLegacyPersonaCsvEntity("jtbd")).toBe(true);
    expect(isLegacyPersonaCsvEntity("epics")).toBe(false);
    expect(isLegacyPersonaCsvEntity("user_stories")).toBe(false);
  });

  it("importEntityAction refuse personas sans toucher Supabase", async () => {
    const res = await importEntityAction("proj-1", "personas", "merge", [
      { name: "Adja", persona_code: "ADJ" },
    ]);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/LEGACY_READ_ONLY/);
      expect((res as { code?: string }).code).toBe(LEGACY_READ_ONLY_CODE);
      expect((res as { status?: number }).status).toBe(403);
    }
  });

  it("importEntityAction refuse pain_points et jtbd", async () => {
    const pp = await importEntityAction("proj-1", "pain_points", "merge", [
      { label: "Liquidité" },
    ]);
    const jt = await importEntityAction("proj-1", "jtbd", "merge", [
      { description: "Payer" },
    ]);
    expect(pp.ok).toBe(false);
    expect(jt.ok).toBe(false);
  });

  it("importFullProjectAction skip silencieusement les entités personas legacy", async () => {
    const res = await importFullProjectAction("proj-1", "merge", {
      personas: [{ name: "Adja", persona_code: "ADJ" }],
      pain_points: [{ label: "Liquidité" }],
      jtbd: [{ description: "Payer" }],
    });
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.skippedLegacyEntities).toEqual(
        expect.arrayContaining(["personas", "pain_points", "jtbd"])
      );
      expect(res.legacyPersonaFreeze).toBe(LEGACY_READ_ONLY_MESSAGE);
    }
  });
});

describe("legacyPersonasA3 — Test 3 : Peer-review persona Freeze", () => {
  it("submitAssetForReview(assetType='persona') refuse en 403 sans toucher Supabase", async () => {
    const res = await submitAssetForReview(
      "proj-1",
      "persona",
      "legacy-persona-1",
      "Adja",
      "user-1"
    );
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/LEGACY_READ_ONLY/);
    }
  });

  it("saveCeoFinalDecision(assetType='persona') refuse en 403", async () => {
    const res = await saveCeoFinalDecision("proj-1", "persona", "legacy-persona-1", {
      decision: "build",
      comment: "",
    });
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error).toMatch(/LEGACY_READ_ONLY/);
    }
  });
});

describe("legacyPersonasA3 — Test 4 : Migration retarget", () => {
  const migrationPath = path.resolve(
    process.cwd(),
    "supabase/migrations/20260721020000_retarget_initiatives_persona_fk_to_spine.sql"
  );

  it("migration présente et retargète la FK vers sttns_work_items", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/DROP CONSTRAINT IF EXISTS sttns_initiatives_persona_id_fkey/);
    expect(sql).toMatch(/REFERENCES sttns_work_items\(id\)/);
    expect(sql).toMatch(/type = 'persona'/);
    // Remap code puis nom (miroir A1)
    expect(sql).toMatch(/upper\(btrim\(p\.persona_code\)\) = upper\(btrim\(wi\.code\)\)/);
    expect(sql).toMatch(/lower\(btrim\(p\.name\)\) = lower\(btrim\(wi\.title\)\)/);
    // Orphelins → NULL
    expect(sql).toMatch(/SET persona_id = NULL/);
  });

  it("RPC sttns_duplicate_project force persona_id=NULL sur initiatives dupliquées", () => {
    const sql = readFileSync(migrationPath, "utf8");
    expect(sql).toMatch(/CREATE OR REPLACE FUNCTION sttns_duplicate_project/);
    // La 3ᵉ colonne de la SELECT ... persona_id de l'INSERT initiatives doit être NULL.
    expect(sql).toMatch(/metric_description, NULL, sm\.new_id/);
  });
});
