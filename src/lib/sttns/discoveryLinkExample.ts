/**
 * Exemple Discovery — quelques lignes de démo :
 * 1) Feature → Epic Spine existant
 * 2) Story → Feature Spine existante
 * 3) Nouvelle Epic → nouvelle Feature → nouvelle Story (chaîne session)
 */
import {
  emptyDraftMetadata,
  type DiscoveryDraft,
  type DiscoveryDraftMetadata,
} from "@/lib/sttns/discoveryMatrix";

export type DiscoveryLinkExampleInput = {
  spineEpics: { id: string; title: string }[];
  spineFeatures: { id: string; title: string; epic_id: string | null }[];
  jtbdOptions: { id: string; title: string }[];
  author?: string;
};

export type DiscoveryLinkCoverage = {
  /** Feature brouillon → Epic Spine existant */
  featureToSpineEpic: boolean;
  /** Story brouillon → Feature Spine existante */
  storyToSpineFeature: boolean;
  /** Nouvelle Epic → Feature → Story (session) */
  sessionChain: boolean;
};

export type DiscoveryLinkExample = {
  drafts: DiscoveryDraft[];
  metadata: DiscoveryDraftMetadata;
  coverage: DiscoveryLinkCoverage;
};

function draft(
  partial: Partial<DiscoveryDraft> &
    Pick<DiscoveryDraft, "id" | "type" | "title">
): DiscoveryDraft {
  return {
    parentId: null,
    jtbdId: null,
    impact: null,
    effort_days: null,
    complexity: null,
    description: "",
    doc_url: "",
    spineId: null,
    ...partial,
  };
}

/**
 * Session courte pour illustrer rattachements Spine vs chaîne 100 % brouillon.
 * Nécessite ≥1 Epic Spine et ≥1 Feature Spine.
 */
export function buildDiscoveryLinkExample(
  input: DiscoveryLinkExampleInput
): { ok: true; example: DiscoveryLinkExample } | { ok: false; error: string } {
  const epics = input.spineEpics;
  const features = input.spineFeatures;
  const jtbds = input.jtbdOptions;

  if (epics.length === 0) {
    return {
      ok: false,
      error:
        "Aucun Epic Spine dans ce projet — créez-en un (Portfolio / Arbre) avant de charger l’exemple.",
    };
  }
  if (features.length === 0) {
    return {
      ok: false,
      error:
        "Aucune Feature Spine dans ce projet — créez-en une (Portfolio) avant de charger l’exemple.",
    };
  }

  const spineEpic = epics[0]!;
  const spineFeature =
    features.find((f) => f.epic_id === spineEpic.id) ?? features[0]!;
  const jtbd = jtbds[0] ?? null;

  const idNewEpic = DISCOVERY_LINK_EXAMPLE_IDS.newEpic;
  const idNewFeature = DISCOVERY_LINK_EXAMPLE_IDS.newFeature;
  const idNewStory = DISCOVERY_LINK_EXAMPLE_IDS.newStory;
  const idFeatOnSpineEpic = DISCOVERY_LINK_EXAMPLE_IDS.featOnSpineEpic;
  const idStoryOnSpineFeat = DISCOVERY_LINK_EXAMPLE_IDS.storyOnSpineFeat;

  const drafts: DiscoveryDraft[] = [
    // 1) Feature → Epic existant (Spine)
    draft({
      id: idFeatOnSpineEpic,
      type: "feature",
      title: `[Ex] Feature reliée à l’Epic « ${spineEpic.title} »`,
      parentId: spineEpic.id,
      jtbdId: jtbd?.id ?? null,
      impact: 2,
      effort_days: 2,
      complexity: 1,
      description: `Parent = Epic Spine déjà présent.`,
    }),
    // 2) User Story → Feature existante (Spine)
    draft({
      id: idStoryOnSpineFeat,
      type: "story",
      title: `[Ex] Story reliée à la Feature « ${spineFeature.title} »`,
      parentId: spineFeature.id,
      effort_days: 1,
      complexity: 1,
      description: `Parent = Feature Spine déjà présente.`,
    }),
    // 3) Nouvelle Epic → nouvelle Feature → nouvelle Story
    draft({
      id: idNewEpic,
      type: "epic",
      title: "[Ex] Nouvelle Epic (brouillon)",
      description: "Chaîne 100 % session — pas encore au Spine.",
    }),
    draft({
      id: idNewFeature,
      type: "feature",
      title: "[Ex] Nouvelle Feature → nouvelle Epic",
      parentId: idNewEpic,
      jtbdId: jtbd?.id ?? null,
      impact: 2,
      description: "Reliée à l’Epic brouillon ci-dessus.",
    }),
    draft({
      id: idNewStory,
      type: "story",
      title: "[Ex] Nouvelle Story → nouvelle Feature",
      parentId: idNewFeature,
      effort_days: 1,
      complexity: 1,
      description: "Reliée à la Feature brouillon ci-dessus.",
    }),
  ];

  const coverage: DiscoveryLinkCoverage = {
    featureToSpineEpic: true,
    storyToSpineFeature: true,
    sessionChain: true,
  };

  const now = new Date().toISOString();
  const metadata: DiscoveryDraftMetadata = {
    ...emptyDraftMetadata(input.author ?? ""),
    title: "Exemple — liens Spine + chaîne nouvelle",
    comments:
      "5 lignes : Feature→Epic Spine, Story→Feature Spine, " +
      "puis nouvelle Epic → Feature → Story. Ouvrir Carte ou Mind Map pour visualiser.",
    createdAt: now,
    exportedAt: null,
  };

  return { ok: true, example: { drafts, metadata, coverage } };
}

export const DISCOVERY_LINK_EXAMPLE_IDS = {
  featOnSpineEpic: "draft_ex_feat_on_spine_epic",
  storyOnSpineFeat: "draft_ex_story_on_spine_feat",
  newEpic: "draft_ex_new_epic",
  newFeature: "draft_ex_new_feature",
  newStory: "draft_ex_new_story",
} as const;
