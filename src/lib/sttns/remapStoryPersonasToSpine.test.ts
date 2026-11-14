import { describe, expect, it } from "vitest";
import {
  buildJobIdRemap,
  buildPersonaIdRemap,
  findSpineJtbdForLegacyJob,
  findSpinePersonaForLegacy,
  remapOrNull,
} from "@/lib/sttns/remapStoryPersonasToSpine";
import {
  buildSpineWhySandbox,
  SPINE_WHY_IDS,
  SPINE_WHY_SANDBOX_PROJECT,
} from "@/lib/sttns/spineWhySandbox";

describe("remapStoryPersonasToSpine (A1)", () => {
  const sandbox = buildSpineWhySandbox();
  const spinePersonas = sandbox.personas.map((p) => ({
    id: p.id,
    project_id: SPINE_WHY_SANDBOX_PROJECT.id,
    title: p.title,
    code: p.code,
  }));
  const spineJobs = [
    ...sandbox.painPoints.map((pp) => ({
      id: pp.id,
      parent_id: pp.persona_id,
      title: `[Pain Point: high] ${pp.title}`,
      code: null as string | null,
      metadata: { spine_role: "pain_point" as const },
    })),
    ...sandbox.jtbds.map((j) => ({
      id: j.id,
      parent_id: j.parent_id,
      title: j.title,
      code: null as string | null,
      metadata: {},
    })),
  ];

  const legacyPersonas = [
    {
      id: "legacy-yao",
      project_id: SPINE_WHY_SANDBOX_PROJECT.id,
      name: "Yao Koffi",
      persona_code: "YAO",
    },
    {
      id: "legacy-adja",
      project_id: SPINE_WHY_SANDBOX_PROJECT.id,
      name: "Adja Cissé",
      persona_code: "ADJA",
    },
    {
      id: "legacy-orphan",
      project_id: SPINE_WHY_SANDBOX_PROJECT.id,
      name: "Inconnu",
      persona_code: "ZZZ",
    },
  ];

  it("match persona par code puis nom", () => {
    expect(findSpinePersonaForLegacy(legacyPersonas[0], spinePersonas)?.id).toBe(
      SPINE_WHY_IDS.personaYao
    );
    expect(
      findSpinePersonaForLegacy(
        { ...legacyPersonas[1], persona_code: null },
        spinePersonas
      )?.id
    ).toBe(SPINE_WHY_IDS.personaAdja);
    expect(findSpinePersonaForLegacy(legacyPersonas[2], spinePersonas)).toBeUndefined();
  });

  it("buildPersonaIdRemap ignore les orphelins", () => {
    const map = buildPersonaIdRemap(legacyPersonas, spinePersonas);
    expect(map.get("legacy-yao")).toBe(SPINE_WHY_IDS.personaYao);
    expect(map.get("legacy-adja")).toBe(SPINE_WHY_IDS.personaAdja);
    expect(map.has("legacy-orphan")).toBe(false);
  });

  it("match JTBD sous persona Spine et ignore Pain Points", () => {
    const yaoJtbd = sandbox.jtbds.find((j) => j.id === SPINE_WHY_IDS.jtbdYao)!;
    const matched = findSpineJtbdForLegacyJob(
      {
        id: "legacy-job-yao",
        persona_id: "legacy-yao",
        description: yaoJtbd.title,
        client_key: null,
      },
      spineJobs,
      SPINE_WHY_IDS.personaYao
    );
    expect(matched?.id).toBe(SPINE_WHY_IDS.jtbdYao);

    const ppMatch = findSpineJtbdForLegacyJob(
      {
        id: "legacy-pp",
        persona_id: "legacy-yao",
        description: sandbox.painPoints[0].title,
        client_key: null,
      },
      spineJobs,
      SPINE_WHY_IDS.personaYao
    );
    expect(ppMatch).toBeUndefined();
  });

  it("buildJobIdRemap + remapOrNull", () => {
    const personaRemap = buildPersonaIdRemap(legacyPersonas, spinePersonas);
    const yaoJtbd = sandbox.jtbds.find((j) => j.id === SPINE_WHY_IDS.jtbdYao)!;
    const jobRemap = buildJobIdRemap(
      [
        {
          id: "legacy-job-yao",
          persona_id: "legacy-yao",
          description: yaoJtbd.title,
          client_key: null,
        },
      ],
      spineJobs,
      personaRemap
    );
    expect(jobRemap.get("legacy-job-yao")).toBe(SPINE_WHY_IDS.jtbdYao);
    expect(remapOrNull("legacy-yao", personaRemap)).toBe(SPINE_WHY_IDS.personaYao);
    expect(remapOrNull("missing", personaRemap)).toBeNull();
    expect(
      remapOrNull(SPINE_WHY_IDS.personaLaura, personaRemap, new Set([SPINE_WHY_IDS.personaLaura]))
    ).toBe(SPINE_WHY_IDS.personaLaura);
  });
});
