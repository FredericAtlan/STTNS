/**
 * Bac à sable Spine Why — jeu de données déterministe (Yao, Adja, Laura).
 *
 * Utilisé par :
 * - `scripts/seedSpine.ts` (insertion DB, idempotente)
 * - tests unitaires Why / Discovery (fixtures en mémoire, sans legacy)
 *
 * Aucune référence à `sttns_personas`.
 */

export const SPINE_WHY_SANDBOX_PROJECT = {
  slug: "spine-why-sandbox",
  name: "Spine Why Sandbox",
  id: "11111111-1111-4111-a111-000000000001",
} as const;

/** UUID v4-like stables (namespace sandbox). */
export const SPINE_WHY_IDS = {
  personaYao: "11111111-1111-4111-a111-000000000101",
  personaAdja: "11111111-1111-4111-a111-000000000102",
  personaLaura: "11111111-1111-4111-a111-000000000103",
  ppYao: "11111111-1111-4111-a111-000000000201",
  ppAdja: "11111111-1111-4111-a111-000000000202",
  ppLaura: "11111111-1111-4111-a111-000000000203",
  jtbdYao: "11111111-1111-4111-a111-000000000301",
  jtbdAdja: "11111111-1111-4111-a111-000000000302",
  jtbdLaura: "11111111-1111-4111-a111-000000000303",
  epicYao: "11111111-1111-4111-a111-000000000401",
  epicAdja: "11111111-1111-4111-a111-000000000402",
  epicLaura: "11111111-1111-4111-a111-000000000403",
  featureYao: "11111111-1111-4111-a111-000000000501",
  featureAdja: "11111111-1111-4111-a111-000000000502",
  featureLaura: "11111111-1111-4111-a111-000000000503",
} as const;

export type SpineWhySandboxPersona = {
  id: string;
  title: string;
  code: string;
  status: string;
  segment: string;
  description: string;
};

export type SpineWhySandboxPainPoint = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  persona_id: string;
};

export type SpineWhySandboxJtbd = {
  id: string;
  title: string;
  parent_id: string;
  status: string;
  solved_pain_point_ids: string[];
};

export type SpineWhySandboxEpic = {
  id: string;
  title: string;
  code: string;
};

export type SpineWhySandboxFeature = {
  id: string;
  title: string;
  code: string;
  epic_id: string;
  jtbd_id: string;
  impact: 0 | 1 | 2 | 3;
};

export type SpineWhySandbox = {
  project: typeof SPINE_WHY_SANDBOX_PROJECT;
  personas: SpineWhySandboxPersona[];
  painPoints: SpineWhySandboxPainPoint[];
  jtbds: SpineWhySandboxJtbd[];
  epics: SpineWhySandboxEpic[];
  features: SpineWhySandboxFeature[];
};

/** Graphe Why complet — 3 personas × (PP → JTBD → Feature via Epic). */
export function buildSpineWhySandbox(): SpineWhySandbox {
  const personas: SpineWhySandboxPersona[] = [
    {
      id: SPINE_WHY_IDS.personaYao,
      title: "Yao Koffi",
      code: "YAO",
      status: "todo",
      segment: "Expert-Comptable",
      description: "Cabinet multi-clients — chasse aux pièces et clôture liasse.",
    },
    {
      id: SPINE_WHY_IDS.personaAdja,
      title: "Adja Cissé",
      code: "ADJA",
      status: "todo",
      segment: "Traiteur / PME informelle",
      description: "Gère un traiteur à Abidjan — besoin d'historique finançable.",
    },
    {
      id: SPINE_WHY_IDS.personaLaura,
      title: "Laura Schneider",
      code: "LAURA",
      status: "todo",
      segment: "VC / Investisseur",
      description: "Due diligence PME africaines — pipeline pré-qualifié.",
    },
  ];

  const painPoints: SpineWhySandboxPainPoint[] = [
    {
      id: SPINE_WHY_IDS.ppYao,
      title: "Chasse permanente aux pièces comptables",
      severity: "high",
      persona_id: SPINE_WHY_IDS.personaYao,
    },
    {
      id: SPINE_WHY_IDS.ppAdja,
      title: "Micro-crédit inaccessible sans historique",
      severity: "critical",
      persona_id: SPINE_WHY_IDS.personaAdja,
    },
    {
      id: SPINE_WHY_IDS.ppLaura,
      title: "Due diligence trop longue et coûteuse",
      severity: "high",
      persona_id: SPINE_WHY_IDS.personaLaura,
    },
  ];

  const jtbds: SpineWhySandboxJtbd[] = [
    {
      id: SPINE_WHY_IDS.jtbdYao,
      title:
        "Quand [un client m'envoie des pièces], je veux [un espace pré-catégorisé] afin de [clôturer la liasse plus vite]",
      parent_id: SPINE_WHY_IDS.personaYao,
      status: "todo",
      solved_pain_point_ids: [SPINE_WHY_IDS.ppYao],
    },
    {
      id: SPINE_WHY_IDS.jtbdAdja,
      title:
        "Quand [je reçois une facture fournisseur], je veux [la scanner via mobile] afin de [bâtir un historique finançable]",
      parent_id: SPINE_WHY_IDS.personaAdja,
      status: "todo",
      solved_pain_point_ids: [SPINE_WHY_IDS.ppAdja],
    },
    {
      id: SPINE_WHY_IDS.jtbdLaura,
      title:
        "Quand [j'évalue une PME], je veux [un pipeline pré-qualifié] afin de [réduire mon temps de due diligence]",
      parent_id: SPINE_WHY_IDS.personaLaura,
      status: "todo",
      solved_pain_point_ids: [SPINE_WHY_IDS.ppLaura],
    },
  ];

  const epics: SpineWhySandboxEpic[] = [
    {
      id: SPINE_WHY_IDS.epicYao,
      title: "Espace comptable collaboratif",
      code: "E-YAO",
    },
    {
      id: SPINE_WHY_IDS.epicAdja,
      title: "Capture & Financement PME",
      code: "E-ADJA",
    },
    {
      id: SPINE_WHY_IDS.epicLaura,
      title: "Deal Flow pré-qualifié",
      code: "E-LAURA",
    },
  ];

  const features: SpineWhySandboxFeature[] = [
    {
      id: SPINE_WHY_IDS.featureYao,
      title: "Inbox pièces pré-catégorisée",
      code: "F-YAO",
      epic_id: SPINE_WHY_IDS.epicYao,
      jtbd_id: SPINE_WHY_IDS.jtbdYao,
      impact: 2,
    },
    {
      id: SPINE_WHY_IDS.featureAdja,
      title: "OCR Vision & capture mobile",
      code: "F-ADJA",
      epic_id: SPINE_WHY_IDS.epicAdja,
      jtbd_id: SPINE_WHY_IDS.jtbdAdja,
      impact: 3,
    },
    {
      id: SPINE_WHY_IDS.featureLaura,
      title: "Pipeline PME pré-qualifié",
      code: "F-LAURA",
      epic_id: SPINE_WHY_IDS.epicLaura,
      jtbd_id: SPINE_WHY_IDS.jtbdLaura,
      impact: 2,
    },
  ];

  return {
    project: SPINE_WHY_SANDBOX_PROJECT,
    personas,
    painPoints,
    jtbds,
    epics,
    features,
  };
}

/** Props ContextMatrix / PersonaWorkspace depuis le sandbox. */
export function sandboxToWhyMatrixProps(sandbox: SpineWhySandbox = buildSpineWhySandbox()) {
  return {
    personas: sandbox.personas.map((p) => ({
      id: p.id,
      title: p.title,
      code: p.code,
      status: p.status,
      segment: p.segment,
      description: p.description,
      avatar_url: null as string | null,
      doc_url: null as string | null,
    })),
    painPoints: sandbox.painPoints,
    jtbs: sandbox.jtbds,
  };
}

/** Props DiscoveryMatrix (Spine parents + JTBD) depuis le sandbox. */
export function sandboxToDiscoverySpineProps(
  sandbox: SpineWhySandbox = buildSpineWhySandbox()
) {
  const personaById = new Map(sandbox.personas.map((p) => [p.id, p]));
  return {
    projectId: sandbox.project.id,
    projectSlug: sandbox.project.slug,
    spineEpics: sandbox.epics.map((e) => ({ id: e.id, title: e.title })),
    spineFeatures: sandbox.features.map((f) => ({
      id: f.id,
      title: f.title,
      epic_id: f.epic_id,
    })),
    jtbdOptions: sandbox.jtbds.map((j) => ({
      id: j.id,
      title: j.title,
      personaName: personaById.get(j.parent_id)?.title ?? "Persona",
    })),
  };
}

/** Invariants graphe (tests + validation seed). */
export function assertSpineWhySandboxIntegrity(
  sandbox: SpineWhySandbox = buildSpineWhySandbox()
): void {
  if (sandbox.personas.length !== 3) {
    throw new Error(`Sandbox: attendu 3 personas, reçu ${sandbox.personas.length}`);
  }
  for (const persona of sandbox.personas) {
    const pps = sandbox.painPoints.filter((p) => p.persona_id === persona.id);
    const jtbds = sandbox.jtbds.filter((j) => j.parent_id === persona.id);
    if (pps.length < 1) throw new Error(`Sandbox: ${persona.code} sans Pain Point`);
    if (jtbds.length < 1) throw new Error(`Sandbox: ${persona.code} sans JTBD`);
    for (const jtbd of jtbds) {
      if (!jtbd.solved_pain_point_ids.length) {
        throw new Error(`Sandbox: JTBD ${jtbd.id} sans solves`);
      }
      const feat = sandbox.features.find((f) => f.jtbd_id === jtbd.id);
      if (!feat) throw new Error(`Sandbox: JTBD ${jtbd.id} sans Feature liée`);
      if (!sandbox.epics.some((e) => e.id === feat.epic_id)) {
        throw new Error(`Sandbox: Feature ${feat.id} Epic manquant`);
      }
    }
  }
}
