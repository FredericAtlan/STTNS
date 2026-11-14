import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  LEGACY_PERSONAS_STEP_A1_COMPLETE,
  LEGACY_PERSONAS_STEP_A2_COMPLETE,
  LEGACY_PERSONAS_STEP_B_COMPLETE,
  LEGACY_PERSONA_CODE_TOUCHPOINTS,
  LEGACY_PERSONA_ROUTES,
  legacyPersonaRedirectPath,
} from "@/lib/sttns/legacyPersonasDeprecation";

describe("legacyPersonasDeprecation — Étape B Redirect", () => {
  it("marque l'Étape B comme complète", () => {
    expect(LEGACY_PERSONAS_STEP_B_COMPLETE).toBe(true);
  });

  it("liste les 4 routes legacy à neutraliser", () => {
    expect(LEGACY_PERSONA_ROUTES).toHaveLength(4);
    expect(LEGACY_PERSONA_ROUTES.every((r) => r.includes("/personas"))).toBe(true);
  });

  it("redirige le catalogue et le détail vers /why", () => {
    expect(legacyPersonaRedirectPath("demo")).toBe("/projects/demo/why");
    expect(legacyPersonaRedirectPath("demo", "abc-uuid")).toBe("/projects/demo/why");
    expect(legacyPersonaRedirectPath("demo", "vocabulary")).toBe("/projects/demo/why");
  });

  it("redirige /personas/new vers /why?tab=persona", () => {
    expect(legacyPersonaRedirectPath("demo", "new")).toBe(
      "/projects/demo/why?tab=persona"
    );
  });
});

describe("legacyPersonasDeprecation — Étape A2 Why Spine-only", () => {
  it("marque les jalons A1 et A2 comme livrés", () => {
    expect(LEGACY_PERSONAS_STEP_A1_COMPLETE).toBe(true);
    expect(LEGACY_PERSONAS_STEP_A2_COMPLETE).toBe(true);
  });

  it("retire la page Why de l'inventaire des touchpoints legacy", () => {
    const anyWhyPageTouchpoint = LEGACY_PERSONA_CODE_TOUCHPOINTS.some((entry) =>
      entry.includes("src/app/projects/[slug]/why/page.tsx")
    );
    expect(anyWhyPageTouchpoint).toBe(false);
  });

  it("la page Why ne SELECT plus sttns_personas ni n'importe le bridge d'enrich", () => {
    const filePath = path.resolve(
      process.cwd(),
      "src/app/projects/[slug]/why/page.tsx"
    );
    const source = readFileSync(filePath, "utf8");
    expect(source).not.toMatch(/from\(["']sttns_personas["']\)/);
    expect(source).not.toMatch(/enrichSpinePersonasWithSegment/);
    expect(source).not.toMatch(/fetchPersonaVocabulary/);
    // Le pointeur d'aide Why doit renvoyer sur le chapitre framework (pas scoring).
    expect(source).toMatch(/\/help\/framework/);
    // Solves prune : la page ignore les targets absents du set PP chargé.
    expect(source).toMatch(/loadedPainPointIds/);
    expect(source).toMatch(/loadedPainPointIds\.has\(link\.target_id\)/);
  });
});
