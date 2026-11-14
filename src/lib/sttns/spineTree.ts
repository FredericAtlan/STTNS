import type { SupabaseClient } from "@supabase/supabase-js";
import type { EpicMetadata } from "@/lib/sttns/types";
import { readTaskNotionUrl } from "@/lib/sttns/schema";
import { readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import { computeCycleStatus, type CycleDisplayStatus } from "@/lib/sttns/cycles";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import {
  calculateEpicRollup,
  calculateFeatureDays,
  countRiskyUnits,
  readComplexity,
  readEffortDays,
  readImpact,
  type ComplexityLevel,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";
import { isPainPointJob, parsePainPointFields } from "@/lib/sttns/whySpine";

/** Onglets de l'explorateur Spine */
export type SpineExplorerTab = "strategy" | "product" | "execution";

export type SpineTreeNodeKind =
  | "persona"
  | "why_group"
  | "pain_point"
  | "jtbd"
  | "epic"
  | "feature"
  | "story"
  | "task"
  | "cycle";

export type SpineTreeNode = {
  id: string;
  title: string;
  kind: SpineTreeNodeKind;
  health?: "healthy" | "incomplete";
  /** Statut métier brut (story, cycle…) pour StatusPill */
  status?: string;
  meta?: {
    code?: string | null;
    severity?: string;
    solvedPainPointCount?: number;
    cycleStatus?: CycleDisplayStatus;
    cycleStartDate?: string;
    cycleEndDate?: string;
    taskDone?: boolean;
    assigneeId?: string | null;
    notionUrl?: string | null;
    childCount?: number;
    /** Feature parente — affichée sous l’onglet Exécution (Cycles). */
    featureTitle?: string | null;
    featureId?: string | null;
    epicId?: string | null;
    epicTitle?: string | null;
    /** JTBD — pain points résolus (vue Stratégie Mind Map). */
    solvedPainPointIds?: string[];
    /** @deprecated Preférer effortDays (matrice Jours). */
    effortPoints?: number | null;
    /** Jours d'effort (story) ou jours calculés (feature). */
    effortDays?: number | null;
    /** Complexité/Risque 1–3 (story ou feature Shape Up) — clé metadata.complexity. */
    complexity?: ComplexityLevel | null;
    /** Impact Feature 0–3. */
    impact?: ImpactLevel | null;
    /** Feature : nombre d'unités en Risque 3. */
    riskyCount?: number;
    /** Epic : ∑ Impact Features. */
    totalImpact?: number | null;
    /** Epic : ratio Valeur/Effort (null si pas de jours). */
    valueEffortRatio?: number | null;
    /** Lien doc (Epic/Feature/Story) ou Notion (task). */
    docUrl?: string | null;
    /** Cycle sprint — affiché sur les stories (vue Produit). */
    cycleName?: string | null;
  };
  children: SpineTreeNode[];
};

export type SpineTreeMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

export type SpineTreeHierarchy = {
  rootKind: SpineTreeNodeKind;
  strategicKinds: SpineTreeNodeKind[];
  levels: SpineTreeNodeKind[];
};

export const SPINE_TREE_HIERARCHIES: Record<SpineExplorerTab, SpineTreeHierarchy> = {
  strategy: {
    rootKind: "persona",
    strategicKinds: ["persona", "why_group", "jtbd", "epic"],
    levels: ["persona", "why_group", "pain_point", "jtbd", "epic", "feature", "story", "task"],
  },
  product: {
    rootKind: "epic",
    strategicKinds: ["epic", "feature", "story"],
    levels: ["epic", "feature", "story", "task"],
  },
  execution: {
    rootKind: "cycle",
    strategicKinds: ["cycle", "story"],
    levels: ["cycle", "story", "task"],
  },
};

export type SpineTreeDataset = {
  strategy: SpineTreeNode[];
  product: SpineTreeNode[];
  execution: SpineTreeNode[];
  members: SpineTreeMember[];
};

export const SPINE_UNASSIGNED_CYCLE_ID = "spine-unassigned-cycle";
export const SPINE_ORPHAN_STORIES_GROUP_ID = "spine-orphan-stories";

/** @deprecated — conservé pour compatibilité interne */
export type SpineTreeTask = {
  id: string;
  title: string;
  status: string;
  done: boolean;
};

export type SpineTreeStory = {
  id: string;
  title: string;
  status: string;
  tasks: SpineTreeTask[];
};

export type SpineTreeFeature = {
  id: string;
  title: string;
  linkedJtbdId: string | null;
  stories: SpineTreeStory[];
};

export type SpineTreeEpic = {
  id: string;
  title: string;
  features: SpineTreeFeature[];
};

export type SpineTreeJtbd = {
  id: string;
  title: string;
  solvedPainPointIds: string[];
};

export type SpineTreePainPoint = {
  id: string;
  title: string;
  severity: string;
};

export type SpineTreePersona = {
  id: string;
  title: string;
  code: string | null;
  painPoints: SpineTreePainPoint[];
  jtbds: SpineTreeJtbd[];
  epics: SpineTreeEpic[];
};

type RawRow = {
  id: string;
  type: string;
  parent_id: string | null;
  title: string;
  status: string;
  code: string | null;
  sort_order: number;
  metadata: unknown;
  cycle_id: string | null;
  effort_points: number | null;
  assignee_id: string | null;
};

type RawCycle = {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
};

type BuildContext = {
  personas: RawRow[];
  jobs: RawRow[];
  epics: RawRow[];
  features: RawRow[];
  stories: RawRow[];
  tasks: RawRow[];
  cycles: RawCycle[];
  featureJtbdMap: Map<string, string>;
  jtbdSolvesMap: Map<string, string[]>;
  epicsByPersona: Map<string, RawRow[]>;
  featuresByEpic: Map<string, RawRow[]>;
  storiesByFeature: Map<string, RawRow[]>;
  tasksByStory: Map<string, RawRow[]>;
  storiesByCycle: Map<string, RawRow[]>;
  featuresByCycle: Map<string, RawRow[]>;
  unassignedStories: RawRow[];
  unassignedFeatures: RawRow[];
  featuresById: Map<string, RawRow>;
  epicsById: Map<string, RawRow>;
  cyclesById: Map<string, RawCycle>;
  executionUnit: "story" | "feature";
};


function storyHealth(story: RawRow): "healthy" | "incomplete" {
  return readEffortDays(story.metadata) != null && readComplexity(story.metadata) != null
    ? "healthy"
    : "incomplete";
}

function featureHealth(feature: RawRow, stories: RawRow[], linkedJtbdId: string | null): "healthy" | "incomplete" {
  if (!linkedJtbdId) return "incomplete";
  if (readImpact(feature.metadata) == null) return "incomplete";
  if (stories.length === 0) {
    // Shape Up / feature seule : jours + Risque (complexity) sur la feature
    if (readEffortDays(feature.metadata) == null || readComplexity(feature.metadata) == null) {
      return "incomplete";
    }
    return "healthy";
  }
  if (stories.some((s) => storyHealth(s) === "incomplete")) return "incomplete";
  return "healthy";
}

function epicHealth(features: RawRow[], featuresByEpic: Map<string, RawRow[]>, ctx: BuildContext): "healthy" | "incomplete" {
  if (features.length === 0) return "incomplete";
  for (const f of features) {
    const stories = ctx.storiesByFeature.get(f.id) ?? [];
    const jtbd = ctx.featureJtbdMap.get(f.id) ?? null;
    if (featureHealth(f, stories, jtbd) === "incomplete") return "incomplete";
  }
  return "healthy";
}

function buildTaskNodes(tasks: RawRow[]): SpineTreeNode[] {
  return tasks.map((t) => ({
    id: t.id,
    title: t.title,
    kind: "task" as const,
    status: t.status,
    meta: {
      taskDone: t.status === "done",
      assigneeId: t.assignee_id ?? null,
      notionUrl: readTaskNotionUrl(t.metadata),
      docUrl: readTaskNotionUrl(t.metadata),
    },
    children: [],
  }));
}

function buildStoryNode(story: RawRow, ctx: BuildContext): SpineTreeNode {
  const tasks = ctx.tasksByStory.get(story.id) ?? [];
  const featureRow = story.parent_id ? ctx.featuresById.get(story.parent_id) : undefined;
  const epicRow = featureRow?.parent_id ? ctx.epicsById.get(featureRow.parent_id) : undefined;
  const cycleName = story.cycle_id ? ctx.cyclesById.get(story.cycle_id)?.name ?? null : null;
  return {
    id: story.id,
    title: story.title,
    kind: "story",
    status: story.status,
    health: storyHealth(story),
    meta: {
      childCount: tasks.length,
      featureTitle: featureRow?.title ?? null,
      featureId: featureRow?.id ?? null,
      epicId: epicRow?.id ?? null,
      epicTitle: epicRow?.title ?? null,
      effortDays: readEffortDays(story.metadata),
      complexity: readComplexity(story.metadata),
      assigneeId: story.assignee_id ?? null,
      docUrl: readMetadataDocUrl(story.metadata),
      cycleName,
    },
    children: buildTaskNodes(tasks),
  };
}

function buildFeatureNode(feature: RawRow, ctx: BuildContext): SpineTreeNode {
  const stories = ctx.storiesByFeature.get(feature.id) ?? [];
  const linkedJtbdId = ctx.featureJtbdMap.get(feature.id) ?? null;
  const storyMetas = stories.map((s) => s.metadata);
  const calculatedDays = calculateFeatureDays(feature.metadata, storyMetas);
  const riskyCount = countRiskyUnits(feature.metadata, storyMetas);

  return {
    id: feature.id,
    title: feature.title,
    kind: "feature",
    status: feature.status,
    health: featureHealth(feature, stories, linkedJtbdId),
    meta: {
      childCount: stories.length,
      impact: readImpact(feature.metadata),
      effortDays: calculatedDays,
      complexity: stories.length === 0 ? readComplexity(feature.metadata) : null,
      riskyCount,
      docUrl: readMetadataDocUrl(feature.metadata),
    },
    children: stories.map((s) => buildStoryNode(s, ctx)),
  };
}

function buildEpicNode(epic: RawRow, ctx: BuildContext): SpineTreeNode {
  const features = ctx.featuresByEpic.get(epic.id) ?? [];
  const featureStats = features.map((f) => {
    const stories = ctx.storiesByFeature.get(f.id) ?? [];
    const storyMetas = stories.map((s) => s.metadata);
    return {
      impact: readImpact(f.metadata),
      calculatedDays: calculateFeatureDays(f.metadata, storyMetas),
    };
  });
  const { totalImpact, totalDays, ratio: valueEffortRatio } =
    calculateEpicRollup(featureStats);

  return {
    id: epic.id,
    title: epic.title,
    kind: "epic",
    status: epic.status,
    health: epicHealth(features, ctx.featuresByEpic, ctx),
    meta: {
      code: epic.code,
      childCount: features.length,
      totalImpact,
      effortDays: totalDays,
      valueEffortRatio,
      docUrl: readMetadataDocUrl(epic.metadata),
    },
    children: features.map((f) => buildFeatureNode(f, ctx)),
  };
}

function buildStrategyTree(ctx: BuildContext): SpineTreeNode[] {
  return ctx.personas.map((p) => {
    const personaJobs = ctx.jobs.filter((j) => j.parent_id === p.id);
    const painPoints: SpineTreeNode[] = [];
    const jtbds: SpineTreeNode[] = [];

    for (const j of personaJobs) {
      if (isPainPointJob(j.metadata, j.title)) {
        const parsed = parsePainPointFields(j.title, j.metadata);
        painPoints.push({
          id: j.id,
          title: parsed.label,
          kind: "pain_point",
          meta: { severity: parsed.severity },
          children: [],
        });
      } else {
        const solved = ctx.jtbdSolvesMap.get(j.id) ?? [];
        jtbds.push({
          id: j.id,
          title: j.title.length > 60 ? `${j.title.slice(0, 60)}…` : j.title,
          kind: "jtbd",
          meta: { solvedPainPointCount: solved.length, solvedPainPointIds: solved },
          children: [],
        });
      }
    }

    const personaEpics = (ctx.epicsByPersona.get(p.id) ?? []).map((e) => buildEpicNode(e, ctx));

    const whyChildren: SpineTreeNode[] = [];
    if (painPoints.length > 0 || jtbds.length > 0) {
      whyChildren.push({
        id: `${p.id}-why`,
        title: "Pain Points & JTBD",
        kind: "why_group",
        meta: { childCount: painPoints.length + jtbds.length },
        children: [...painPoints, ...jtbds],
      });
    }

    const personaHealth: "healthy" | "incomplete" =
      painPoints.length === 0 || jtbds.length === 0 || personaEpics.length === 0
        ? "incomplete"
        : personaEpics.some((e) => e.health === "incomplete")
          ? "incomplete"
          : "healthy";

    return {
      id: p.id,
      title: p.code ? `[${p.code}] ${p.title}` : p.title,
      kind: "persona",
      health: personaHealth,
      meta: { code: p.code },
      children: [...whyChildren, ...personaEpics],
    };
  });
}

function buildProductTree(ctx: BuildContext): SpineTreeNode[] {
  const featureIds = new Set(ctx.features.map((f) => f.id));
  const epicIds = new Set(ctx.epics.map((e) => e.id));

  const epicNodes = ctx.epics.map((e) => buildEpicNode(e, ctx));

  const orphanFeatureNodes = ctx.features
    .filter((f) => !f.parent_id || !epicIds.has(f.parent_id))
    .map((f) => buildFeatureNode(f, ctx));

  const orphanStoryRows = ctx.stories.filter(
    (s) => !s.parent_id || !featureIds.has(s.parent_id)
  );
  const orphanStoryNodes = orphanStoryRows.map((s) => buildStoryNode(s, ctx));

  const nodes: SpineTreeNode[] = [...epicNodes, ...orphanFeatureNodes];

  if (orphanStoryNodes.length > 0) {
    nodes.push({
      id: SPINE_ORPHAN_STORIES_GROUP_ID,
      title: "Stories sans feature",
      kind: "why_group",
      health: "incomplete",
      meta: { childCount: orphanStoryNodes.length },
      children: orphanStoryNodes,
    });
  }

  return nodes;
}

function buildExecutionFeatureNode(feature: RawRow, ctx: BuildContext): SpineTreeNode {
  const linkedJtbdId = ctx.featureJtbdMap.get(feature.id) ?? null;
  const epicRow = feature.parent_id ? ctx.epicsById.get(feature.parent_id) : undefined;
  const cycleName = feature.cycle_id ? ctx.cyclesById.get(feature.cycle_id)?.name ?? null : null;
  return {
    id: feature.id,
    title: feature.title,
    kind: "feature",
    status: feature.status,
    health: linkedJtbdId ? "healthy" : "incomplete",
    meta: {
      childCount: 0,
      epicId: epicRow?.id ?? null,
      epicTitle: epicRow?.title ?? null,
      assigneeId: feature.assignee_id ?? null,
      docUrl: readMetadataDocUrl(feature.metadata),
      cycleName,
    },
    children: [],
  };
}

function buildExecutionTree(ctx: BuildContext): SpineTreeNode[] {
  if (isFeatureExecutionMode({ executionUnit: ctx.executionUnit })) {
    const nodes: SpineTreeNode[] = ctx.cycles.map((cycle) => {
      const cycleFeatures = ctx.featuresByCycle.get(cycle.id) ?? [];
      const cycleStatus = computeCycleStatus({
        start_date: cycle.start_date,
        end_date: cycle.end_date,
        is_active: cycle.is_active,
      });
      return {
        id: cycle.id,
        title: cycle.name,
        kind: "cycle",
        status: cycleStatus,
        meta: {
          cycleStatus,
          cycleStartDate: cycle.start_date,
          cycleEndDate: cycle.end_date,
          childCount: cycleFeatures.length,
        },
        health: cycleFeatures.length > 0 ? "healthy" : "incomplete",
        children: cycleFeatures.map((f) => buildExecutionFeatureNode(f, ctx)),
      };
    });

    if (ctx.unassignedFeatures.length > 0) {
      nodes.push({
        id: SPINE_UNASSIGNED_CYCLE_ID,
        title: "Sans cycle",
        kind: "cycle",
        status: "planned",
        meta: { cycleStatus: "planned", childCount: ctx.unassignedFeatures.length },
        health: "incomplete",
        children: ctx.unassignedFeatures.map((f) => buildExecutionFeatureNode(f, ctx)),
      });
    }

    return nodes;
  }

  const nodes: SpineTreeNode[] = ctx.cycles.map((cycle) => {
    const stories = ctx.storiesByCycle.get(cycle.id) ?? [];
    const cycleStatus = computeCycleStatus({
      start_date: cycle.start_date,
      end_date: cycle.end_date,
      is_active: cycle.is_active,
    });
    return {
      id: cycle.id,
      title: cycle.name,
      kind: "cycle",
      status: cycleStatus,
      meta: {
        cycleStatus,
        cycleStartDate: cycle.start_date,
        cycleEndDate: cycle.end_date,
        childCount: stories.length,
      },
      health: stories.length > 0 ? "healthy" : "incomplete",
      children: stories.map((s) => buildStoryNode(s, ctx)),
    };
  });

  if (ctx.unassignedStories.length > 0) {
    nodes.push({
      id: SPINE_UNASSIGNED_CYCLE_ID,
      title: "Sans cycle",
      kind: "cycle",
      status: "planned",
      meta: { cycleStatus: "planned", childCount: ctx.unassignedStories.length },
      health: "incomplete",
      children: ctx.unassignedStories.map((s) => buildStoryNode(s, ctx)),
    });
  }

  return nodes;
}

function assembleSpineTreeDataset(ctx: BuildContext): Omit<SpineTreeDataset, "members"> {
  return {
    strategy: buildStrategyTree(ctx),
    product: buildProductTree(ctx),
    execution: buildExecutionTree(ctx),
  };
}

async function fetchSpineMembers(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineTreeMember[]> {
  const { data } = await supabase
    .from("sttns_project_members")
    .select("user_id, profile:sttns_profiles(full_name, email)")
    .eq("project_id", projectId);

  return (data ?? []).map((row) => {
    const profileRaw = row.profile as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    return {
      user_id: row.user_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
    };
  });
}

async function buildContext(
  supabase: SupabaseClient,
  projectId: string
): Promise<BuildContext | null> {
  const [{ data: rows, error }, { data: cycles }, { data: projectRow }] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select(
        "id, type, parent_id, title, status, code, sort_order, metadata, cycle_id, effort_points, assignee_id"
      )
      .eq("project_id", projectId)
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
    // Inclut les cycles inactifs pour éviter que leurs stories ne disparaissent
    // silencieusement de la vue Exécution (bug P0.8). Actifs d'abord, puis les
    // plus récents pour garder l'historique lisible.
    supabase
      .from("sttns_cycles")
      .select("id, name, start_date, end_date, is_active")
      .eq("project_id", projectId)
      .order("is_active", { ascending: false })
      .order("start_date", { ascending: true }),
    supabase.from("sttns_projects").select("settings").eq("id", projectId).single(),
  ]);

  const workflow = parseProjectWorkflowSettings(projectRow?.settings);

  if (error || !rows?.length) {
    const emptyCtx: BuildContext = {
      personas: [],
      jobs: [],
      epics: [],
      features: [],
      stories: [],
      tasks: [],
      cycles: (cycles ?? []) as RawCycle[],
      featureJtbdMap: new Map(),
      jtbdSolvesMap: new Map(),
      epicsByPersona: new Map(),
      featuresByEpic: new Map(),
      storiesByFeature: new Map(),
      tasksByStory: new Map(),
      storiesByCycle: new Map(),
      featuresByCycle: new Map(),
      unassignedStories: [],
      unassignedFeatures: [],
      featuresById: new Map(),
      epicsById: new Map(),
      cyclesById: new Map(),
      executionUnit: workflow.executionUnit,
    };
    return emptyCtx;
  }

  const items = rows as RawRow[];
  const ids = items.map((r) => r.id);

  const [{ data: contextLinks }, { data: solveLinks }] = await Promise.all([
    ids.length
      ? supabase
          .from("sttns_context_links")
          .select("work_item_id, context_id, context_type")
          .in("work_item_id", ids)
          .eq("context_type", "job")
      : Promise.resolve({ data: [] }),
    ids.length
      ? supabase
          .from("sttns_work_item_links")
          .select("source_id, target_id")
          .in("source_id", ids)
          .eq("type", "solves")
      : Promise.resolve({ data: [] }),
  ]);

  const featureJtbdMap = new Map<string, string>();
  for (const link of contextLinks ?? []) {
    featureJtbdMap.set(link.work_item_id, link.context_id);
  }

  const jtbdSolvesMap = new Map<string, string[]>();
  for (const link of solveLinks ?? []) {
    const list = jtbdSolvesMap.get(link.source_id) ?? [];
    list.push(link.target_id);
    jtbdSolvesMap.set(link.source_id, list);
  }

  const personas = items.filter((r) => r.type === "persona");
  const jobs = items.filter((r) => r.type === "job");
  const epics = items.filter((r) => r.type === "epic");
  const features = items.filter((r) => r.type === "feature");
  const stories = items.filter((r) => r.type === "story");
  const tasks = items.filter((r) => r.type === "task");

  const featuresById = new Map<string, RawRow>();
  for (const f of features) {
    featuresById.set(f.id, f);
  }

  const epicsById = new Map<string, RawRow>();
  for (const e of epics) {
    epicsById.set(e.id, e);
  }

  const cyclesById = new Map<string, RawCycle>();
  for (const c of (cycles ?? []) as RawCycle[]) {
    cyclesById.set(c.id, c);
  }

  const tasksByStory = new Map<string, RawRow[]>();
  for (const t of tasks) {
    if (!t.parent_id) continue;
    const list = tasksByStory.get(t.parent_id) ?? [];
    list.push(t);
    tasksByStory.set(t.parent_id, list);
  }

  const storiesByFeature = new Map<string, RawRow[]>();
  for (const s of stories) {
    if (!s.parent_id) continue;
    const list = storiesByFeature.get(s.parent_id) ?? [];
    list.push(s);
    storiesByFeature.set(s.parent_id, list);
  }

  const featuresByEpic = new Map<string, RawRow[]>();
  for (const f of features) {
    if (!f.parent_id) continue;
    const list = featuresByEpic.get(f.parent_id) ?? [];
    list.push(f);
    featuresByEpic.set(f.parent_id, list);
  }

  const epicsByPersona = new Map<string, RawRow[]>();
  for (const e of epics) {
    const meta = (e.metadata ?? {}) as EpicMetadata;
    const personaId = meta.persona_id;
    if (!personaId) continue;
    const list = epicsByPersona.get(personaId) ?? [];
    list.push(e);
    epicsByPersona.set(personaId, list);
  }

  const storiesByCycle = new Map<string, RawRow[]>();
  const unassignedStories: RawRow[] = [];
  for (const s of stories) {
    if (s.cycle_id) {
      const list = storiesByCycle.get(s.cycle_id) ?? [];
      list.push(s);
      storiesByCycle.set(s.cycle_id, list);
    } else {
      unassignedStories.push(s);
    }
  }

  const featuresByCycle = new Map<string, RawRow[]>();
  const unassignedFeatures: RawRow[] = [];
  for (const f of features) {
    if (f.cycle_id) {
      const list = featuresByCycle.get(f.cycle_id) ?? [];
      list.push(f);
      featuresByCycle.set(f.cycle_id, list);
    } else {
      unassignedFeatures.push(f);
    }
  }

  return {
    personas,
    jobs,
    epics,
    features,
    stories,
    tasks,
    cycles: (cycles ?? []) as RawCycle[],
    featureJtbdMap,
    jtbdSolvesMap,
    epicsByPersona,
    featuresByEpic,
    storiesByFeature,
    tasksByStory,
    storiesByCycle,
    featuresByCycle,
    unassignedStories,
    unassignedFeatures,
    featuresById,
    epicsById,
    cyclesById,
    executionUnit: workflow.executionUnit,
  };
}

/** Charge et assemble les 3 perspectives de l'arbre Spine. */
export async function fetchSpineTree(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineTreeDataset> {
  const [ctx, members] = await Promise.all([
    buildContext(supabase, projectId),
    fetchSpineMembers(supabase, projectId),
  ]);

  if (!ctx) {
    return { strategy: [], product: [], execution: [], members };
  }

  return { ...assembleSpineTreeDataset(ctx), members };
}

/** Racine demandée pour un onglet */
export function getSpineRootNodes(dataset: SpineTreeDataset, tab: SpineExplorerTab): SpineTreeNode[] {
  return dataset[tab];
}

/** Déplie epic/feature/cycle/story pour rendre les user stories visibles sous les features. */
export function collectDefaultExpandedNodeIds(nodes: SpineTreeNode[]): Record<string, boolean> {
  const open: Record<string, boolean> = {};

  function walk(node: SpineTreeNode) {
    if (node.children.length === 0) return;

    const shouldOpen =
      node.kind === "feature" ||
      node.kind === "cycle" ||
      (node.kind === "story" && node.children.some((c) => c.kind === "task")) ||
      ((node.kind === "epic" || node.kind === "persona" || node.kind === "why_group") &&
        node.children.some(
          (child) =>
            child.kind === "story" ||
            child.children.some((grand) => grand.kind === "story" || grand.children.length > 0)
        ));

    if (shouldOpen) {
      open[node.id] = true;
    }

    node.children.forEach(walk);
  }

  nodes.forEach(walk);
  return open;
}

/** Compte les nœuds par kind dans un dataset (stats page) */
export function countSpineNodes(dataset: SpineTreeDataset): {
  personas: number;
  epics: number;
  features: number;
  stories: number;
  tasks: number;
  cycles: number;
} {
  let features = 0;
  let stories = 0;
  let tasks = 0;

  function walk(nodes: SpineTreeNode[]) {
    for (const n of nodes) {
      if (n.kind === "feature") features += 1;
      if (n.kind === "story") stories += 1;
      if (n.kind === "task") tasks += 1;
      walk(n.children);
    }
  }

  walk(dataset.strategy);
  walk(dataset.product);
  walk(dataset.execution);

  return {
    personas: dataset.strategy.length,
    epics: dataset.product.filter(
      (n) => n.kind === "epic" && n.id !== SPINE_ORPHAN_STORIES_GROUP_ID
    ).length,
    features,
    stories,
    tasks,
    cycles: dataset.execution.filter((n) => n.id !== SPINE_UNASSIGNED_CYCLE_ID).length,
  };
}
