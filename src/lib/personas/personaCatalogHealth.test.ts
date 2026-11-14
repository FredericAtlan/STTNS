import { describe, expect, it } from "vitest";

import { computePersonaCatalogHealth } from "./personaCatalogHealth";
import type { SttnsPersona } from "@/types/sttns";

function basePersona(overrides: Partial<SttnsPersona> = {}): SttnsPersona {
  return {
    id: "p1",
    project_id: "proj",
    name: "Test",
    tier_label: "T2",
    profile_summary: null,
    friction_summary: null,
    pain_point_detail: null,
    job_functional: null,
    job_emotional: null,
    job_social: null,
    sort_order: 1,
    created_at: "",
    updated_at: "",
    archived_at: null,
    ...overrides,
  };
}

describe("computePersonaCatalogHealth", () => {
  it("marks empty persona", () => {
    const health = computePersonaCatalogHealth(basePersona());
    expect(health.level).toBe("empty");
  });

  it("marks incomplete when only pains exist", () => {
    const health = computePersonaCatalogHealth(
      basePersona({
        pain_points: [
          {
            id: "pain-1",
            persona_id: "p1",
            label: "Douleur",
            description: null,
            sort_order: 1,
            created_at: "",
            client_key: "pp-1",
          },
        ],
      })
    );
    expect(health.level).toBe("incomplete");
  });
});
