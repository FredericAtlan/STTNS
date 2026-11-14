import { describe, expect, it } from "vitest";
import {
  assertSpineWhySandboxIntegrity,
  buildSpineWhySandbox,
  sandboxToDiscoverySpineProps,
  sandboxToWhyMatrixProps,
  SPINE_WHY_SANDBOX_PROJECT,
  type SpineWhySandbox,
} from "@/lib/sttns/spineWhySandbox";
import {
  countGhostJtbds,
  countOrphanPainPoints,
} from "@/lib/sttns/whyHealth";

declare global {
  // eslint-disable-next-line no-var
  var __STTNS_SPINE_WHY_SANDBOX__: SpineWhySandbox | undefined;
}

describe("spineWhySandbox — bac à sable Why", () => {
  it("expose 3 personas Yao / Adja / Laura avec chaînes complètes", () => {
    const sandbox = buildSpineWhySandbox();
    expect(() => assertSpineWhySandboxIntegrity(sandbox)).not.toThrow();
    expect(sandbox.personas.map((p) => p.code).sort()).toEqual([
      "ADJA",
      "LAURA",
      "YAO",
    ]);
    expect(sandbox.painPoints).toHaveLength(3);
    expect(sandbox.jtbds).toHaveLength(3);
    expect(sandbox.features).toHaveLength(3);
    expect(sandbox.project.slug).toBe(SPINE_WHY_SANDBOX_PROJECT.slug);
  });

  it("vitest setup a pré-chargé le sandbox (idempotent)", () => {
    expect(globalThis.__STTNS_SPINE_WHY_SANDBOX__?.personas).toHaveLength(3);
    expect(globalThis.__STTNS_SPINE_WHY_SANDBOX__?.project.slug).toBe(
      SPINE_WHY_SANDBOX_PROJECT.slug
    );
  });

  it("graphe sain : 0 PP orphelin / 0 JTBD fantôme", () => {
    const { painPoints, jtbs } = sandboxToWhyMatrixProps();
    expect(countOrphanPainPoints(painPoints, jtbs)).toBe(0);
    expect(countGhostJtbds(jtbs)).toBe(0);
  });

  it("projection Discovery expose epics, features et JTBD liés", () => {
    const props = sandboxToDiscoverySpineProps();
    expect(props.spineEpics).toHaveLength(3);
    expect(props.spineFeatures).toHaveLength(3);
    expect(props.jtbdOptions).toHaveLength(3);
    expect(props.jtbdOptions.every((j) => j.personaName.length > 0)).toBe(true);
  });
});
