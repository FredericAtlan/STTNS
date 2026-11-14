/**
 * Étape B — Redirect & Deprecate : verrouillage redirections `/personas*` → `/why`.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import {
  LEGACY_PERSONA_HTTP_REDIRECTS,
  matchLegacyPersonaHttpRedirect,
} from "@/lib/sttns/legacyPersonaHttpRedirects.mjs";
import {
  LEGACY_PERSONA_DB_TOUCHPOINTS,
  LEGACY_PERSONAS_STEP_B_COMPLETE,
  legacyPersonaRedirectPath,
} from "@/lib/sttns/legacyPersonasDeprecation";
import type { SttnsPersona, SttnsPersonaJob, SttnsPersonaPainPoint } from "@/types/sttns";
import * as personasDataLayer from "@/lib/sttns/personas";
import * as savePersonaLayer from "@/lib/sttns/savePersona";

const redirectMock = vi.fn((url: string) => {
  const err = new Error(`NEXT_REDIRECT:${url}`);
  (err as Error & { digest?: string }).digest = `NEXT_REDIRECT;replace;${url};308`;
  throw err;
});

vi.mock("next/navigation", () => ({
  redirect: (url: string) => redirectMock(url),
}));

describe("personas.redirect — Test 1 : Redirection /personas → /why", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("règle HTTP 308 : /projects/:slug/personas → /projects/:slug/why", () => {
    const hit = matchLegacyPersonaHttpRedirect("/projects/marketchain/personas");
    expect(hit).not.toBeNull();
    expect(hit?.statusCode).toBe(308);
    expect(hit?.permanent).toBe(true);
    expect(hit?.destination).toBe("/projects/marketchain/why");
  });

  it("page App Router appelle redirect() vers /why", async () => {
    const { default: LegacyPersonasIndexRedirect } = await import(
      "@/app/projects/[slug]/personas/page"
    );

    await expect(
      LegacyPersonasIndexRedirect({
        params: Promise.resolve({ slug: "demo" }),
      })
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/projects/demo/why");
  });
});

describe("personas.redirect — Test 2 : Redirection dynamique /personas/[id] → /why", () => {
  beforeEach(() => {
    redirectMock.mockClear();
  });

  it("règle HTTP 308 : /projects/:slug/personas/123 → /why", () => {
    const hit = matchLegacyPersonaHttpRedirect("/projects/demo/personas/123");
    expect(hit).not.toBeNull();
    expect(hit?.statusCode).toBe(308);
    expect(hit?.destination).toBe("/projects/demo/why");
  });

  it("page App Router [id] appelle redirect() vers /why (id legacy non mappé)", async () => {
    const { default: LegacyPersonaDetailRedirect } = await import(
      "@/app/projects/[slug]/personas/[id]/page"
    );

    await expect(
      LegacyPersonaDetailRedirect({
        params: Promise.resolve({ slug: "demo", id: "123" }),
      })
    ).rejects.toThrow(/NEXT_REDIRECT/);

    expect(redirectMock).toHaveBeenCalledWith("/projects/demo/why");
  });

  it("couvre aussi /personas/new (destination Why)", () => {
    const hit = matchLegacyPersonaHttpRedirect("/projects/demo/personas/new");
    expect(hit?.destination).toBe("/projects/demo/why?tab=persona");
    expect(legacyPersonaRedirectPath("demo", "new")).toContain("/why");
  });
});

describe("personas.redirect — Test 3 : Intégrité tables / types aval (sttns_personas)", () => {
  it("inventaire DB conserve sttns_personas ; stories FK → work_items (A1)", () => {
    expect(LEGACY_PERSONAS_STEP_B_COMPLETE).toBe(true);
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain("sttns_personas");
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain("sttns_persona_pain_points");
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain("sttns_persona_jobs");
    expect(LEGACY_PERSONA_DB_TOUCHPOINTS).toContain(
      "sttns_user_stories.primary_persona_id→work_items"
    );
  });

  it("type SttnsPersona (monde DRAFT/READY) reste importable et structuré", () => {
    const persona = {
      id: "persona-uuid",
      project_id: "proj-uuid",
      name: "Adja",
      persona_code: "ADJ",
      project_scope: "active",
      tier_label: "T1",
      profile_summary: null,
      avatar_url: null,
      persona_status: "DRAFT",
      archived_at: null,
      friction_summary: null,
      pain_point_detail: null,
      job_functional: null,
      job_emotional: null,
      job_social: null,
      sort_order: 0,
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    } satisfies SttnsPersona;

    expect(persona.persona_status === "DRAFT" || persona.persona_status === "READY").toBe(
      true
    );
    expect(persona.id).toBeTruthy();

    const pain = {
      id: "pp-1",
      persona_id: persona.id,
      label: "Friction",
      description: null,
      sort_order: 0,
      created_at: persona.created_at,
    } satisfies SttnsPersonaPainPoint;

    const job = {
      id: "job-1",
      persona_id: persona.id,
      job_type: "functional",
      description: "Job",
      sort_order: 0,
      created_at: persona.created_at,
    } satisfies SttnsPersonaJob;

    expect(pain.persona_id).toBe(persona.id);
    expect(job.persona_id).toBe(persona.id);
  });

  it("couche data legacy (personas + savePersona) reste exportée pour CSV / peer-review", () => {
    expect(typeof personasDataLayer.fetchProjectPersonas).toBe("function");
    expect(typeof personasDataLayer.fetchPersonaById).toBe("function");
    expect(typeof personasDataLayer.painPointsForPersona).toBe("function");
    expect(typeof personasDataLayer.jobsForPersona).toBe("function");
    expect(typeof savePersonaLayer.savePersonaWithRelations).toBe("function");
    expect(typeof savePersonaLayer.deletePersona).toBe("function");
    expect(typeof savePersonaLayer.duplicatePersona).toBe("function");
  });

  it("next.config expose bien les 4 règles permanentes vers /why", () => {
    expect(LEGACY_PERSONA_HTTP_REDIRECTS.length).toBe(4);
    expect(LEGACY_PERSONA_HTTP_REDIRECTS.every((r) => r.permanent)).toBe(true);
    expect(
      LEGACY_PERSONA_HTTP_REDIRECTS.every((r) => r.destination.includes("/why"))
    ).toBe(true);
  });
});
