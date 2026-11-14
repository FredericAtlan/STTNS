/**
 * Hard Stop Feature → JTBD (server-side).
 *
 * Vérifie que `saveInitiativeAction` refuse toute Feature sans context_link
 * `type=job`, indépendamment du chemin d'appel (Discovery, FeatureForm).
 * Miroir serveur de la règle UI FeatureForm.
 */
import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(async () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: null, error: null }),
        }),
      }),
    }),
  })),
}));

vi.mock("@/lib/sttns/access", () => ({
  requireProjectMember: vi.fn(async () => ({ ok: true as const })),
  requireProjectEditor: vi.fn(async () => ({ ok: true as const, userId: "u-1" })),
}));

const saveWorkItemMock = vi.fn();

vi.mock("@/lib/sttns/workItems", () => ({
  saveWorkItem: (...args: unknown[]) => saveWorkItemMock(...args),
  getWorkItem: vi.fn(async () => ({ ok: true as const, item: null })),
  buildSaveInputFromStored: vi.fn((item: unknown) => item),
}));

vi.mock("@/lib/sttns/workflowGovernance", () => ({
  fetchProjectWorkflowSettings: vi.fn(async () => ({})),
}));

vi.mock("@/lib/sttns/projectExecutionMode", () => ({
  isEpicEqualsCycle: () => false,
}));

vi.mock("@/lib/sttns/cycleEpicLink", () => ({
  findEpicIdByCycleId: vi.fn(async () => null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { saveInitiativeAction } from "@/app/projects/[slug]/features/actions";

describe("saveInitiativeAction — Constitution Spine Feature ↔ JTBD", () => {
  beforeEach(() => {
    saveWorkItemMock.mockReset();
    saveWorkItemMock.mockResolvedValue({ ok: true as const, id: "feat-1" });
  });

  it("refuse une Feature sans context_links (0 JTBD)", async () => {
    const result = await saveInitiativeAction(
      "demo",
      {
        project_id: "proj-1",
        feature_name: "Feature sans JTBD",
        epic_id: "epic-1",
        impact: 2,
        context_links: [],
      },
      { metricSelect: "" }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toMatch(/JTBD/i);
      expect(result.error).toMatch(/Constitution Spine/i);
    }
    expect(saveWorkItemMock).not.toHaveBeenCalled();
  });

  it("refuse une Feature avec uniquement des context_links non-job", async () => {
    const result = await saveInitiativeAction(
      "demo",
      {
        project_id: "proj-1",
        feature_name: "Feature persona-only",
        epic_id: "epic-1",
        impact: 2,
        context_links: [{ type: "persona" as const, context_id: "persona-1" }],
      },
      { metricSelect: "" }
    );
    expect(result.ok).toBe(false);
    expect(saveWorkItemMock).not.toHaveBeenCalled();
  });

  it("accepte une Feature avec au moins un context_link type=job", async () => {
    const result = await saveInitiativeAction(
      "demo",
      {
        project_id: "proj-1",
        feature_name: "Feature OK",
        epic_id: "epic-1",
        impact: 2,
        context_links: [{ type: "job" as const, context_id: "jtbd-1" }],
      },
      { metricSelect: "" }
    );
    expect(result.ok).toBe(true);
    expect(saveWorkItemMock).toHaveBeenCalledTimes(1);
  });
});
