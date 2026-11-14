import { describe, expect, it } from "vitest";
import { buildValueChainMap } from "@/lib/epics/valueChainMapping";
import type { SttnsEpic, SttnsPersona } from "@/types/sttns";

const persona: SttnsPersona = {
  id: "p1",
  project_id: "proj",
  name: "Adja",
  persona_code: "P1",
  project_scope: "active",
  tier_label: "PME",
  profile_summary: null,
  archived_at: null,
  friction_summary: null,
  pain_point_detail: null,
  job_functional: null,
  job_emotional: null,
  job_social: null,
  sort_order: 1,
  created_at: "",
  updated_at: "",
  pain_points: [
    {
      id: "pp1",
      persona_id: "p1",
      label: "Paperwork",
      description: null,
      sort_order: 1,
      created_at: "",
      client_key: "PP-1",
    },
  ],
  jobs: [
    {
      id: "j1",
      persona_id: "p1",
      job_type: "functional",
      description: "Collect receipts",
      sort_order: 1,
      created_at: "",
      client_key: "JTBD-1",
      resolved_pain_point_ids: ["pp1"],
    },
    {
      id: "j2",
      persona_id: "p1",
      job_type: "functional",
      description: "Orphan job",
      sort_order: 2,
      created_at: "",
      resolved_pain_point_ids: [],
    },
  ],
};

describe("buildValueChainMap", () => {
  it("marks orphan jtbd and ghost epic", () => {
    const map = buildValueChainMap({
      personas: [persona],
      stories: [
        {
          id: "s1",
          title: "US-1",
          context_label: null,
          status: "validated",
          epic_id: "e1",
          primary_persona_id: "p1",
          target_persona_job_id: "j1",
          impact_metric_id: "m1",
          impacts_north_star: false,
          notes: null,
          actions: [],
        },
      ],
      epics: [
        {
          id: "e1",
          project_id: "proj",
          title: "E1",
          objective: "Obj",
          primary_persona_id: null,
          target_tier_codes: [],
          impact_metric_root: null,
          success_kpi_target: null,
          delivery_horizon: null,
          status: "draft",
          sort_order: 0,
          archived_at: null,
          created_by: null,
          created_at: "",
          updated_at: "",
        } as SttnsEpic,
        {
          id: "e2",
          project_id: "proj",
          title: "Ghost",
          objective: null,
          primary_persona_id: null,
          target_tier_codes: [],
          impact_metric_root: null,
          success_kpi_target: null,
          delivery_horizon: null,
          status: "draft",
          sort_order: 1,
          archived_at: null,
          created_by: null,
          created_at: "",
          updated_at: "",
        } as SttnsEpic,
      ],
      metrics: [
        {
          id: "m1",
          project_id: "proj",
          parent_id: null,
          name: "Efficiency leaf",
          description: null,
          sort_order: 1,
          legacy_key: "efficiency",
          created_at: "",
          updated_at: "",
        },
      ],
      nsmLabel: "NSM",
    });

    expect(map.summary.orphanJtbdCount).toBeGreaterThanOrEqual(1);
    expect(map.ghostEpics).toHaveLength(1);
    expect(map.rows.some((r) => r.story?.id === "s1")).toBe(true);
  });
});
