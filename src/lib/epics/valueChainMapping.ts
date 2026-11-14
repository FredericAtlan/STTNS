import { computeEpicDoR } from "@/lib/epics/epicHealth";
import { computeNsmCoverage, NSM_COVERAGE_KEY } from "@/lib/metrics/nsmCoverage";
import { painPointsForPersona, jobsForPersona } from "@/lib/sttns/personas";
import { resolveStoryImpactLabel } from "@/lib/sttns/metrics";
import { parseStoryActions } from "@/lib/sttns/userStories";
import type {
  SttnsEpic,
  SttnsPersona,
  SttnsProjectMetric,
  SttnsUserStory,
  SttnsUserStoryStatus,
} from "@/types/sttns";

export type OrphanReason =
  | "persona_no_story"
  | "pain_ignored"
  | "jtbd_no_story"
  | "jtbd_ghost"
  | "story_no_epic"
  | "story_no_jtbd"
  | "story_no_impact"
  | "story_no_persona"
  | "epic_ghost"
  | "metric_uncovered";

export type MappingFeatureNode = {
  id: string;
  name: string;
  code: string | null;
};

export type MappingStory = {
  id: string;
  title: string;
  contextLabel: string | null;
  status: SttnsUserStoryStatus;
  epicId: string | null;
  epicTitle: string | null;
  features: MappingFeatureNode[];
  impactLabel: string | null;
  orphanReasons: OrphanReason[];
  isOrphan: boolean;
};

export type InitiativeMappingInput = {
  id: string;
  feature_name: string;
  feature_code: string | null;
  epic_id: string | null;
  user_story_id: string | null;
  archived_at: string | null;
};

export type PersonaCastingScope = "active" | "all";

export type ValueChainRow = {
  id: string;
  persona: {
    id: string;
    name: string;
    code: string | null;
    tierLabel: string | null;
    scope: "active" | "reference";
    isOrphan: boolean;
  };
  painPoint: {
    id: string;
    label: string;
    clientKey: string | null;
    isOrphan: boolean;
  } | null;
  jtbd: {
    id: string;
    label: string;
    clientKey: string | null;
    jobType: string;
    isOrphan: boolean;
    isGhost: boolean;
  } | null;
  story: MappingStory | null;
};

export type MappingEpicNode = {
  id: string;
  title: string;
  storyCount: number;
  isGhost: boolean;
};

export type MappingMetricNode = {
  key: string;
  label: string;
  level: number;
  storyCount: number;
  epicCount: number;
  isOrphan: boolean;
};

export type ValueChainMapSummary = {
  personaCount: number;
  orphanPersonaCount: number;
  orphanPainCount: number;
  orphanJtbdCount: number;
  orphanStoryCount: number;
  ghostEpicCount: number;
  orphanMetricCount: number;
  chainRowCount: number;
  /** Stories avec chaîne complète (sans lien manquant). */
  alignedStoryCount: number;
  totalStoryCount: number;
  chainHealthPct: number;
  jtbdTotalCount: number;
  jtbdCoveredCount: number;
  jtbdCoveragePct: number;
  metricTotalCount: number;
  metricCoveragePct: number;
  metricDeliveredCount: number;
  metricDeliveredPct: number;
  totalOrphanSignals: number;
};

export type ValueChainMap = {
  rows: ValueChainRow[];
  unassignedStories: MappingStory[];
  ghostEpics: MappingEpicNode[];
  orphanMetrics: MappingMetricNode[];
  summary: ValueChainMapSummary;
};

export type StoryMappingInput = Pick<
  SttnsUserStory,
  | "id"
  | "title"
  | "context_label"
  | "status"
  | "epic_id"
  | "primary_persona_id"
  | "target_persona_job_id"
  | "impact_metric_id"
  | "impacts_north_star"
  | "notes"
  | "actions"
>;

function storyOrphanReasons(
  story: StoryMappingInput,
  epicTitleById: Map<string, string>
): OrphanReason[] {
  const reasons: OrphanReason[] = [];
  if (!story.primary_persona_id?.trim()) reasons.push("story_no_persona");
  if (!story.target_persona_job_id?.trim()) reasons.push("story_no_jtbd");
  if (!story.epic_id?.trim()) reasons.push("story_no_epic");
  if (!story.impacts_north_star && !story.impact_metric_id?.trim()) {
    reasons.push("story_no_impact");
  }
  void epicTitleById;
  return reasons;
}

function resolveStoryFeatures(
  story: StoryMappingInput,
  initiativeById: Map<string, InitiativeMappingInput>,
  initiativesByStoryId: Map<string, InitiativeMappingInput[]>,
  initiativesByEpicId: Map<string, InitiativeMappingInput[]>
): MappingFeatureNode[] {
  const seen = new Map<string, MappingFeatureNode>();

  const add = (init: InitiativeMappingInput) => {
    if (init.archived_at) return;
    seen.set(init.id, {
      id: init.id,
      name: init.feature_name.trim() || "Feature sans nom",
      code: init.feature_code?.trim() || null,
    });
  };

  for (const init of initiativesByStoryId.get(story.id) ?? []) add(init);
  for (const action of parseStoryActions(story.actions)) {
    if (!action.initiative_id) continue;
    const init = initiativeById.get(action.initiative_id);
    if (init) add(init);
  }
  if (story.epic_id) {
    for (const init of initiativesByEpicId.get(story.epic_id) ?? []) add(init);
  }

  return Array.from(seen.values());
}

function toMappingStory(
  story: StoryMappingInput,
  epicTitleById: Map<string, string>,
  metrics: SttnsProjectMetric[],
  nsmLabel: string,
  initiativeById: Map<string, InitiativeMappingInput>,
  initiativesByStoryId: Map<string, InitiativeMappingInput[]>,
  initiativesByEpicId: Map<string, InitiativeMappingInput[]>
): MappingStory {
  const orphanReasons = storyOrphanReasons(story, epicTitleById);
  return {
    id: story.id,
    title: story.title,
    contextLabel: story.context_label?.trim() || story.notes?.trim() || null,
    status: story.status,
    epicId: story.epic_id,
    epicTitle: story.epic_id ? epicTitleById.get(story.epic_id) ?? null : null,
    features: resolveStoryFeatures(
      story,
      initiativeById,
      initiativesByStoryId,
      initiativesByEpicId
    ),
    impactLabel: resolveStoryImpactLabel(story as SttnsUserStory, metrics, nsmLabel),
    orphanReasons,
    isOrphan: orphanReasons.length > 0,
  };
}

function jobsForPain(
  painId: string,
  jobs: ReturnType<typeof jobsForPersona>
): ReturnType<typeof jobsForPersona> {
  return jobs.filter((job) => (job.resolved_pain_point_ids ?? []).includes(painId));
}

function storiesForJtbd(
  jtbdId: string,
  stories: StoryMappingInput[]
): StoryMappingInput[] {
  return stories.filter((s) => s.target_persona_job_id === jtbdId);
}

function pushRow(
  rows: ValueChainRow[],
  persona: ValueChainRow["persona"],
  painPoint: ValueChainRow["painPoint"],
  jtbd: ValueChainRow["jtbd"],
  story: MappingStory | null
) {
  rows.push({
    id: `${persona.id}-${painPoint?.id ?? "np"}-${jtbd?.id ?? "nj"}-${story?.id ?? rows.length}`,
    persona,
    painPoint,
    jtbd,
    story,
  });
}

export function buildValueChainMap(input: {
  personas: SttnsPersona[];
  stories: StoryMappingInput[];
  epics: SttnsEpic[];
  metrics: SttnsProjectMetric[];
  initiatives?: InitiativeMappingInput[];
  nsmLabel: string;
  /** KPI / agrégats : personas au casting actif uniquement */
  personaScope?: PersonaCastingScope;
}): ValueChainMap {
  const { epics, metrics, nsmLabel, personaScope = "all" } = input;
  const initiatives = input.initiatives ?? [];
  const scopedPersonas =
    personaScope === "active"
      ? input.personas.filter((p) => p.project_scope !== "reference")
      : input.personas;
  const activePersonaIds = new Set(
    input.personas.filter((p) => p.project_scope !== "reference").map((p) => p.id)
  );
  const scopedPersonaIds = new Set(scopedPersonas.map((p) => p.id));
  const stories =
    personaScope === "active"
      ? input.stories.filter(
          (s) => !s.primary_persona_id || scopedPersonaIds.has(s.primary_persona_id)
        )
      : input.stories;
  const personas = scopedPersonas;

  const epicTitleById = new Map(epics.map((e) => [e.id, e.title]));
  const initiativeById = new Map(initiatives.map((i) => [i.id, i]));
  const initiativesByStoryId = new Map<string, InitiativeMappingInput[]>();
  const initiativesByEpicId = new Map<string, InitiativeMappingInput[]>();
  for (const init of initiatives) {
    if (init.archived_at) continue;
    if (init.user_story_id) {
      const list = initiativesByStoryId.get(init.user_story_id) ?? [];
      list.push(init);
      initiativesByStoryId.set(init.user_story_id, list);
    }
    if (init.epic_id) {
      const epicList = initiativesByEpicId.get(init.epic_id) ?? [];
      epicList.push(init);
      initiativesByEpicId.set(init.epic_id, epicList);
    }
  }

  const mapStory = (story: StoryMappingInput) =>
    toMappingStory(
      story,
      epicTitleById,
      metrics,
      nsmLabel,
      initiativeById,
      initiativesByStoryId,
      initiativesByEpicId
    );
  const placedStoryIds = new Set<string>();
  const rows: ValueChainRow[] = [];

  const storiesByPersona = new Map<string, StoryMappingInput[]>();
  for (const story of stories) {
    if (!story.primary_persona_id) continue;
    const list = storiesByPersona.get(story.primary_persona_id) ?? [];
    list.push(story);
    storiesByPersona.set(story.primary_persona_id, list);
  }

  let orphanPainCount = 0;
  let orphanJtbdCount = 0;
  let orphanPersonaCount = 0;

  const sortedPersonas = [...personas].sort((a, b) => {
    const scopeA = a.project_scope === "reference" ? 1 : 0;
    const scopeB = b.project_scope === "reference" ? 1 : 0;
    if (scopeA !== scopeB) return scopeA - scopeB;
    return (a.persona_code ?? a.name).localeCompare(b.persona_code ?? b.name);
  });

  for (const persona of sortedPersonas) {
    const pains = painPointsForPersona(persona).filter((p) => p.label.trim());
    const jobs = jobsForPersona(persona).filter((j) => j.description.trim());
    const personaStories = storiesByPersona.get(persona.id) ?? [];
    const personaBase: ValueChainRow["persona"] = {
      id: persona.id,
      name: persona.name,
      code: persona.persona_code?.trim() || null,
      tierLabel: persona.tier_label?.trim() || null,
      scope: persona.project_scope === "reference" ? "reference" : "active",
      isOrphan: personaStories.length === 0,
    };

    if (personaBase.isOrphan) orphanPersonaCount += 1;

    const painIdsWithJtbd = new Set<string>();
    const jtbdIdsPlaced = new Set<string>();

    for (const pain of pains) {
      const linkedJobs = jobsForPain(pain.id, jobs);
      const painNode = {
        id: pain.id,
        label: pain.label.trim(),
        clientKey: pain.client_key?.trim() || null,
        isOrphan: linkedJobs.length === 0,
      };
      if (painNode.isOrphan) orphanPainCount += 1;

      if (!linkedJobs.length) {
        pushRow(rows, personaBase, painNode, null, null);
        continue;
      }

      for (const job of linkedJobs) {
        painIdsWithJtbd.add(pain.id);
        jtbdIdsPlaced.add(job.id);
        const jtbdStories = storiesForJtbd(job.id, personaStories);
        const jtbdNode = {
          id: job.id,
          label: job.description.trim(),
          clientKey: job.client_key?.trim() || null,
          jobType: job.job_type,
          isOrphan: jtbdStories.length === 0,
          isGhost: (job.resolved_pain_point_ids ?? []).length === 0,
        };
        if (jtbdNode.isOrphan) orphanJtbdCount += 1;

        if (!jtbdStories.length) {
          pushRow(rows, personaBase, painNode, jtbdNode, null);
          continue;
        }

        for (const raw of jtbdStories) {
          placedStoryIds.add(raw.id);
          const mappingStory = mapStory(raw);
          pushRow(rows, personaBase, painNode, jtbdNode, mappingStory);
        }
      }
    }

    for (const job of jobs) {
      if (jtbdIdsPlaced.has(job.id)) continue;
      const jtbdStories = storiesForJtbd(job.id, personaStories);
      const jtbdNode = {
        id: job.id,
        label: job.description.trim(),
        clientKey: job.client_key?.trim() || null,
        jobType: job.job_type,
        isOrphan: jtbdStories.length === 0,
        isGhost: (job.resolved_pain_point_ids ?? []).length === 0,
      };
      if (jtbdNode.isOrphan) orphanJtbdCount += 1;
      if (jtbdNode.isGhost && jtbdNode.isOrphan) orphanJtbdCount += 0;

      if (!jtbdStories.length) {
        pushRow(rows, personaBase, null, jtbdNode, null);
        continue;
      }

      for (const raw of jtbdStories) {
        placedStoryIds.add(raw.id);
        pushRow(
          rows,
          personaBase,
          null,
          jtbdNode,
          mapStory(raw)
        );
      }
    }

    for (const raw of personaStories) {
      if (placedStoryIds.has(raw.id)) continue;
      placedStoryIds.add(raw.id);
      pushRow(rows, personaBase, null, null, mapStory(raw));
    }

    if (!pains.length && !jobs.length && personaStories.length === 0) {
      pushRow(rows, personaBase, null, null, null);
    }
  }

  const unassignedStories = stories
    .filter((s) => !s.primary_persona_id?.trim())
    .map((s) => mapStory(s));

  const ghostEpics: MappingEpicNode[] = epics
    .filter((e) => !e.archived_at)
    .map((epic) => {
      const storyCount = stories.filter((s) => {
        if (s.epic_id !== epic.id) return false;
        if (personaScope !== "active") return true;
        return !s.primary_persona_id || activePersonaIds.has(s.primary_persona_id);
      }).length;
      const dor = computeEpicDoR({
        title: epic.title,
        objective: epic.objective,
        linkedStoryCount: storyCount,
      });
      return {
        id: epic.id,
        title: epic.title,
        storyCount,
        isGhost: dor.isGhost,
      };
    })
    .filter((e) => e.isGhost);

  const coverage = computeNsmCoverage(
    metrics.map((m) => ({ id: m.id, parent_id: m.parent_id })),
    stories.map((s) => ({
      id: s.id,
      title: s.title,
      context_label: s.context_label,
      epic_id: s.epic_id,
      impacts_north_star: s.impacts_north_star,
      impact_metric_id: s.impact_metric_id,
      status: s.status,
    })),
    epics.map((e) => ({ id: e.id, title: e.title }))
  );

  const metricById = Object.fromEntries(metrics.map((m) => [m.id, m]));
  const orphanMetrics: MappingMetricNode[] = [];

  const nsmNode = coverage.nodes[NSM_COVERAGE_KEY];
  orphanMetrics.push({
    key: NSM_COVERAGE_KEY,
    label: nsmLabel,
    level: 1,
    storyCount: nsmNode?.storyCount ?? 0,
    epicCount: nsmNode?.epicCount ?? 0,
    isOrphan: (nsmNode?.storyCount ?? 0) === 0,
  });

  for (const metric of metrics) {
    const node = coverage.nodes[metric.id];
    const parent = metric.parent_id ? metricById[metric.parent_id] : null;
    const level = !metric.parent_id ? 2 : parent && !parent.parent_id ? 3 : 4;
    orphanMetrics.push({
      key: metric.id,
      label: metric.name,
      level,
      storyCount: node?.storyCount ?? 0,
      epicCount: node?.epicCount ?? 0,
      isOrphan: (node?.storyCount ?? 0) === 0,
    });
  }

  const orphanStoryCount =
    rows.filter((r) => r.story?.isOrphan).length +
    unassignedStories.filter((s) => s.isOrphan).length;

  const allMappingStories = [
    ...rows.map((r) => r.story).filter((s): s is MappingStory => !!s),
    ...unassignedStories,
  ];
  const alignedStoryCount = allMappingStories.filter((s) => !s.isOrphan).length;
  const totalStoryCount = allMappingStories.length;
  const chainHealthPct =
    totalStoryCount > 0 ? Math.round((alignedStoryCount / totalStoryCount) * 100) : 0;

  const jtbdIds = new Set<string>();
  const jtbdCoveredIds = new Set<string>();
  for (const row of rows) {
    if (!row.jtbd) continue;
    jtbdIds.add(row.jtbd.id);
    if (row.story) jtbdCoveredIds.add(row.jtbd.id);
  }
  const jtbdTotalCount = jtbdIds.size;
  const jtbdCoveredCount = jtbdCoveredIds.size;
  const jtbdCoveragePct =
    jtbdTotalCount > 0 ? Math.round((jtbdCoveredCount / jtbdTotalCount) * 100) : 0;

  const metricTotalCount = orphanMetrics.length;
  const orphanMetricCount = orphanMetrics.filter((m) => m.isOrphan).length;
  const metricCoveragePct =
    metricTotalCount > 0
      ? Math.round(((metricTotalCount - orphanMetricCount) / metricTotalCount) * 100)
      : 0;

  let metricDeliveredCount = 0;
  for (const metric of orphanMetrics) {
    const node = coverage.nodes[metric.key];
    if (node && node.deliveredStoryIds.length > 0) {
      metricDeliveredCount += 1;
    }
  }
  const metricDeliveredPct =
    metricTotalCount > 0 ? Math.round((metricDeliveredCount / metricTotalCount) * 100) : 0;

  const ghostEpicCount = ghostEpics.length;
  const totalOrphanSignals =
    orphanPersonaCount +
    orphanPainCount +
    orphanJtbdCount +
    orphanStoryCount +
    ghostEpicCount +
    orphanMetricCount;

  return {
    rows,
    unassignedStories,
    ghostEpics,
    orphanMetrics: orphanMetrics.filter((m) => m.isOrphan),
    summary: {
      personaCount: scopedPersonas.length,
      orphanPersonaCount,
      orphanPainCount,
      orphanJtbdCount,
      orphanStoryCount,
      ghostEpicCount,
      orphanMetricCount,
      chainRowCount: rows.length,
      alignedStoryCount,
      totalStoryCount,
      chainHealthPct,
      jtbdTotalCount,
      jtbdCoveredCount,
      jtbdCoveragePct,
      metricTotalCount,
      metricCoveragePct,
      metricDeliveredCount,
      metricDeliveredPct,
      totalOrphanSignals,
    },
  };
}

export const ORPHAN_REASON_LABELS: Record<OrphanReason, string> = {
  persona_no_story: "Persona sans story",
  pain_ignored: "PP sans JTBD",
  jtbd_no_story: "JTBD sans story",
  jtbd_ghost: "JTBD fantôme",
  story_no_epic: "Story sans epic",
  story_no_jtbd: "Story sans JTBD",
  story_no_impact: "Story sans métrique",
  story_no_persona: "Story sans persona",
  epic_ghost: "Epic fantôme",
  metric_uncovered: "Métrique non couverte",
};
