import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireProjectEditor } from "@/lib/sttns/access";
import { assertStoryStatusGovernance, assertFeatureStatusGovernance, assertFeatureImpactAllowsExecution, FEATURE_JTBD_REQUIRED_MESSAGE } from "@/lib/sttns/workflowGovernance";
import { readImpact } from "@/lib/sttns/valueEffort";
import {
  contextTypeSchema,
  parseSaveWorkItemInput,
  saveWorkItemSchema,
  workItemRowSchema,
} from "@/lib/sttns/schema";
import type {
  DbWorkItemType,
  EpicMetadata,
  EpicSaveInput,
  FeatureMetadata,
  FeatureSaveInput,
  GetWorkItemResult,
  JobMetadata,
  JobSaveInput,
  PainPointSaveInput,
  PersonaMetadata,
  PersonaSaveInput,
  SaveWorkItemInput,
  SaveWorkItemResult,
  StoredWorkItem,
  StoryMetadata,
  StorySaveInput,
  TaskSaveInput,
  WorkItemContextLink,
} from "@/lib/sttns/types";
import { isPainPointJob, parsePainPointFields } from "@/lib/sttns/whySpine";

export type {
  DbWorkItemType,
  EpicSaveInput,
  FeatureSaveInput,
  GetWorkItemResult,
  JobSaveInput,
  PainPointSaveInput,
  PersonaSaveInput,
  SaveWorkItemInput,
  SaveWorkItemResult,
  StoredWorkItem,
  StorySaveInput,
  TaskSaveInput,
  WorkItemContextLink,
  WorkItemWithContext,
} from "@/lib/sttns/types";

export {
  WORK_ITEM_CONTEXT_TYPES,
  contextTypeSchema,
  dbWorkItemTypeSchema,
  parseSaveWorkItemInput,
  saveWorkItemSchema,
  workItemStatusSchema,
} from "@/lib/sttns/schema";

/** @deprecated Préférer DbWorkItemType ou SaveWorkItemInput["type"] */
export type WorkItemType = DbWorkItemType;

const expectedParentType: Record<SaveWorkItemInput["type"], DbWorkItemType | null> = {
  epic: null,
  feature: "epic",
  story: "feature",
  task: "story",
  persona: null,
  job: "persona",
  pain_point: "persona",
};

function normalizeNullableString(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export { readMetadataDescription, readMetadataDocUrl, parseMetadataDocUrlInput } from "@/lib/sttns/workItemMetadata";

function dedupeContextLinks(
  links: WorkItemContextLink[] | undefined
): WorkItemContextLink[] {
  if (!links?.length) return [];

  const seen = new Set<string>();
  const deduped: WorkItemContextLink[] = [];

  for (const link of links) {
    const key = `${link.type}:${link.context_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(link);
  }

  return deduped;
}

function resolveDbType(input: SaveWorkItemInput): DbWorkItemType {
  return input.type === "pain_point" ? "job" : input.type;
}

function riceZeroPayload() {
  return {
    rice_reach: 0,
    rice_impact: 0,
    rice_confidence: 0,
    rice_effort: 0,
  };
}

function storedBase(
  row: z.infer<typeof workItemRowSchema>,
  contextLinks: WorkItemContextLink[]
): Omit<StoredWorkItem, "type" | "metadata"> & { metadata: unknown } {
  return {
    id: row.id,
    project_id: row.project_id,
    parent_id: row.parent_id,
    status: row.status,
    assignee_id: row.assignee_id,
    priority: row.priority,
    title: row.title,
    code: row.code,
    sort_order: row.sort_order,
    tree_path: row.tree_path,
    created_at: row.created_at,
    updated_at: row.updated_at,
    archived_at: row.archived_at,
    created_by: row.created_by,
    updated_by: row.updated_by,
    cycle_id: row.cycle_id,
    effort_points: row.effort_points,
    rice_reach: row.rice_reach,
    rice_impact: row.rice_impact,
    rice_confidence: row.rice_confidence,
    rice_effort: row.rice_effort,
    rice_score: row.rice_score,
    context_links: contextLinks,
    metadata: row.metadata ?? {},
  };
}

export function parseStoredWorkItem(
  row: z.infer<typeof workItemRowSchema>,
  contextLinks: WorkItemContextLink[],
  solvedPainPoints: string[] = []
): StoredWorkItem {
  const base = storedBase(row, contextLinks);

  switch (row.type) {
    case "persona":
      return {
        ...base,
        type: "persona",
        metadata: (row.metadata as PersonaMetadata | undefined) ?? {},
      };
    case "job":
      if (isPainPointJob(row.metadata, row.title)) {
        return {
          ...base,
          type: "pain_point",
          parent_id: row.parent_id!,
          metadata: parsePainPointFields(row.title, row.metadata),
        };
      }
      return {
        ...base,
        type: "job",
        parent_id: row.parent_id!,
        metadata: (row.metadata as JobMetadata | undefined) ?? {},
        solved_pain_points: solvedPainPoints,
      };
    case "epic":
      return {
        ...base,
        type: "epic",
        metadata: (row.metadata as EpicMetadata | undefined) ?? {},
      };
    case "feature":
      return {
        ...base,
        type: "feature",
        parent_id: row.parent_id!,
        metadata: (row.metadata as FeatureMetadata | undefined) ?? {},
      };
    case "story":
      return {
        ...base,
        type: "story",
        parent_id: row.parent_id!,
        metadata: (row.metadata as StoryMetadata | undefined) ?? {},
      };
    case "task":
      return {
        ...base,
        type: "task",
        parent_id: row.parent_id!,
        metadata: (row.metadata as Record<string, unknown> | undefined) ?? {},
      };
    default: {
      const _exhaustive: never = row.type;
      throw new Error(`Type work item inconnu: ${_exhaustive}`);
    }
  }
}

export function buildSaveInputFromStored(
  item: StoredWorkItem,
  overrides: Partial<SaveWorkItemInput> = {}
): SaveWorkItemInput {
  const base = {
    id: item.id,
    project_id: item.project_id,
    title: item.title,
    status: item.status,
    assignee_id: item.assignee_id,
    priority: item.priority,
    code: item.code,
    sort_order: item.sort_order,
    archived_at: item.archived_at,
    context_links: item.context_links,
  };

  switch (item.type) {
    case "persona":
      return {
        ...base,
        type: "persona",
        parent_id: null,
        metadata: item.metadata,
        ...overrides,
      } as PersonaSaveInput;
    case "pain_point":
      return {
        ...base,
        type: "pain_point",
        parent_id: item.parent_id,
        metadata: item.metadata,
        ...overrides,
      } as PainPointSaveInput;
    case "job":
      return {
        ...base,
        type: "job",
        parent_id: item.parent_id,
        metadata: item.metadata,
        solved_pain_points: item.solved_pain_points,
        ...overrides,
      } as JobSaveInput;
    case "epic":
      return {
        ...base,
        type: "epic",
        parent_id: null,
        metadata: item.metadata,
        ...overrides,
      } as EpicSaveInput;
    case "feature":
      return {
        ...base,
        type: "feature",
        parent_id: item.parent_id,
        cycle_id: item.cycle_id,
        metadata: item.metadata,
        ...overrides,
      } as FeatureSaveInput;
    case "story":
      return {
        ...base,
        type: "story",
        parent_id: item.parent_id,
        cycle_id: item.cycle_id,
        metadata: item.metadata,
        ...overrides,
      } as StorySaveInput;
    case "task":
      return {
        ...base,
        type: "task",
        parent_id: item.parent_id,
        metadata: item.metadata,
        ...overrides,
      } as TaskSaveInput;
    default: {
      const _exhaustive: never = item;
      throw new Error("Type stored work item inconnu");
    }
  }
}

function toDbPayload(input: SaveWorkItemInput) {
  const dbType = resolveDbType(input);

  const shared = {
    project_id: input.project_id,
    type: dbType,
    status: input.status,
    assignee_id: input.assignee_id ?? null,
    priority: input.priority,
    sort_order: input.sort_order,
    archived_at: input.archived_at ?? undefined,
  };

  switch (input.type) {
    case "persona":
      return {
        ...shared,
        parent_id: null,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata,
        cycle_id: null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "pain_point":
      return {
        ...shared,
        parent_id: input.parent_id,
        title: `[Pain Point: ${input.metadata.severity}] ${input.metadata.label}`,
        code: normalizeNullableString(input.code),
        metadata: {
          spine_role: "pain_point",
          severity: input.metadata.severity,
          label: input.metadata.label,
        },
        cycle_id: null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "job":
      return {
        ...shared,
        parent_id: input.parent_id,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata,
        cycle_id: null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "epic":
      return {
        ...shared,
        parent_id: null,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata,
        cycle_id: null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "feature":
      return {
        ...shared,
        parent_id: input.parent_id,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata,
        cycle_id: input.cycle_id ?? null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "story":
      return {
        ...shared,
        parent_id: input.parent_id,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata ?? {},
        cycle_id: input.cycle_id ?? null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    case "task":
      return {
        ...shared,
        parent_id: input.parent_id,
        title: input.title.trim(),
        code: normalizeNullableString(input.code),
        metadata: input.metadata ?? {},
        cycle_id: null,
        effort_points: 0,
        ...riceZeroPayload(),
      };
    default: {
      const _exhaustive: never = input;
      throw new Error(`Type save input inconnu: ${_exhaustive}`);
    }
  }
}

async function assertParentCompatibility(
  supabase: Awaited<ReturnType<typeof createClient>>,
  projectId: string,
  input: SaveWorkItemInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const expectedType = expectedParentType[input.type];

  if (!expectedType || !input.parent_id) {
    return { ok: true };
  }

  const { data: parent, error } = await supabase
    .from("sttns_work_items")
    .select("id, project_id, type, archived_at")
    .eq("id", input.parent_id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!parent) return { ok: false, error: "Le parent indiqué est introuvable." };
  if (parent.project_id !== projectId) {
    return { ok: false, error: "Le parent doit appartenir au même projet." };
  }
  if (parent.archived_at) {
    return { ok: false, error: "Le parent est archivé et ne peut pas recevoir d'enfant." };
  }
  if (parent.type !== expectedType) {
    return {
      ok: false,
      error: `Le type parent attendu est ${expectedType}.`,
    };
  }

  return { ok: true };
}

async function replaceWorkItemLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceId: string,
  targetIds: string[],
  linkType: string,
  actorId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await supabase
    .from("sttns_work_item_links")
    .delete()
    .eq("source_id", sourceId)
    .eq("type", linkType);

  if (deleteError) return { ok: false, error: deleteError.message };

  const uniqueTargets = Array.from(new Set(targetIds));
  if (!uniqueTargets.length) return { ok: true };

  const { error: insertError } = await supabase.from("sttns_work_item_links").insert(
    uniqueTargets.map((targetId) => ({
      source_id: sourceId,
      target_id: targetId,
      type: linkType,
      created_by: actorId,
    }))
  );

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true };
}

async function replaceContextLinks(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workItemId: string,
  links: WorkItemContextLink[],
  actorId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { error: deleteError } = await supabase
    .from("sttns_context_links")
    .delete()
    .eq("work_item_id", workItemId);

  if (deleteError) return { ok: false, error: deleteError.message };

  if (!links.length) return { ok: true };

  const { error: insertError } = await supabase.from("sttns_context_links").insert(
    links.map((link) => ({
      work_item_id: workItemId,
      context_type: link.type,
      context_id: link.context_id,
      created_by: actorId,
    }))
  );

  if (insertError) return { ok: false, error: insertError.message };
  return { ok: true };
}

export async function saveWorkItem(data: SaveWorkItemInput): Promise<SaveWorkItemResult> {
  let parsed: SaveWorkItemInput;
  try {
    parsed = parseSaveWorkItemInput(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        ok: false,
        error: error.issues[0]?.message ?? "Données invalides.",
        issues: error.issues,
      };
    }
    throw error;
  }

  const supabase = await createClient();
  const access = await requireProjectEditor(parsed.project_id);
  if (!access.ok) return access;

  let workItemId: string | null = parsed.id ?? null;
  let previousStatus: string | null = null;
  let existingArchivedAt: string | null = null;
  let existingParentId: string | null = null;

  if (workItemId) {
    const { data: existingRow, error: existingError } = await supabase
      .from("sttns_work_items")
      .select("status, archived_at, parent_id")
      .eq("id", workItemId)
      .eq("project_id", parsed.project_id)
      .maybeSingle();

    if (existingError) {
      return { ok: false, error: existingError.message };
    }

    previousStatus = existingRow?.status ?? null;
    existingArchivedAt = existingRow?.archived_at ?? null;
    existingParentId = existingRow?.parent_id ?? null;
  }

  const isNewArchive = Boolean(parsed.archived_at && !existingArchivedAt);
  const isParentChange =
    Boolean(parsed.parent_id) &&
    (!workItemId || parsed.parent_id !== existingParentId);

  if (isParentChange && !isNewArchive) {
    const parentCheck = await assertParentCompatibility(supabase, parsed.project_id, parsed);
    if (!parentCheck.ok) return parentCheck;
  }

  if (parsed.type === "feature") {
    const effectiveStatus = parsed.status ?? previousStatus;
    const impactGate = assertFeatureImpactAllowsExecution(
      readImpact(parsed.metadata),
      effectiveStatus
    );
    if (!impactGate.ok) return impactGate;

    // Ne pas retirer le JTBD d'une Feature déjà / encore en exécution.
    if (
      effectiveStatus === "in_progress" &&
      parsed.context_links !== undefined &&
      !parsed.context_links.some((link) => link.type === "job")
    ) {
      return { ok: false, error: FEATURE_JTBD_REQUIRED_MESSAGE };
    }
  }

  const dbPayload = toDbPayload(parsed);
  // Évite le trigger DB « parent archivé » quand parent_id n'a pas changé (ex. archivage story).
  if (workItemId && !isParentChange) {
    delete (dbPayload as { parent_id?: string | null }).parent_id;
  }

  const payload = {
    ...dbPayload,
    updated_by: access.userId,
  };

  if (workItemId && parsed.type === "story") {
    if (parsed.status && parsed.status !== previousStatus) {
      const governance = await assertStoryStatusGovernance(
        supabase,
        parsed.project_id,
        workItemId,
        previousStatus,
        parsed.status
      );
      if (!governance.ok) return governance;
    }
  }

  if (workItemId && parsed.type === "feature") {
    if (parsed.status && parsed.status !== previousStatus) {
      const governance = await assertFeatureStatusGovernance(
        supabase,
        parsed.project_id,
        workItemId,
        previousStatus,
        parsed.status,
        { contextLinks: parsed.context_links }
      );
      if (!governance.ok) return governance;
    }
  }

  if (!workItemId && parsed.type === "story" && parsed.status) {
    const governance = await assertStoryStatusGovernance(
      supabase,
      parsed.project_id,
      null,
      null,
      parsed.status
    );
    if (!governance.ok) return governance;
  }

  if (!workItemId && parsed.type === "feature" && parsed.status) {
    const governance = await assertFeatureStatusGovernance(
      supabase,
      parsed.project_id,
      null,
      null,
      parsed.status,
      { contextLinks: parsed.context_links }
    );
    if (!governance.ok) return governance;
  }

  if (workItemId) {
    const { data: updated, error } = await supabase
      .from("sttns_work_items")
      .update(payload)
      .eq("id", workItemId)
      .eq("project_id", parsed.project_id)
      .select("id")
      .single();

    if (error || !updated) {
      return {
        ok: false,
        error: error?.message ?? "Impossible de mettre à jour l'item.",
      };
    }

    workItemId = updated.id;
  } else {
    const { data: inserted, error } = await supabase
      .from("sttns_work_items")
      .insert({
        ...payload,
        created_by: access.userId,
      })
      .select("id")
      .single();

    if (error || !inserted) {
      return {
        ok: false,
        error: error?.message ?? "Impossible de créer l'item.",
      };
    }

    workItemId = inserted.id;
  }

  if (parsed.context_links !== undefined) {
    const result = await replaceContextLinks(
      supabase,
      workItemId!,
      dedupeContextLinks(parsed.context_links),
      access.userId
    );
    if (!result.ok) return result;
  }

  if (parsed.type === "job" && parsed.solved_pain_points !== undefined) {
    const linkResult = await replaceWorkItemLinks(
      supabase,
      workItemId!,
      parsed.solved_pain_points,
      "solves",
      access.userId
    );
    if (!linkResult.ok) return linkResult;
  }

  return { ok: true, id: workItemId! };
}

export async function getWorkItem(id: string): Promise<GetWorkItemResult> {
  if (!z.string().uuid().safeParse(id).success) {
    return { ok: false, error: "Identifiant d'item invalide." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sttns_work_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data) return { ok: true, item: null };

  const parsed = workItemRowSchema.safeParse(data);
  if (!parsed.success) {
    return { ok: false, error: "La ligne récupérée ne respecte pas le schéma Spine." };
  }

  const { data: links, error: linksError } = await supabase
    .from("sttns_context_links")
    .select("context_type, context_id")
    .eq("work_item_id", id);

  if (linksError) return { ok: false, error: linksError.message };

  const { data: solvedLinks, error: solvedLinksError } = await supabase
    .from("sttns_work_item_links")
    .select("target_id")
    .eq("source_id", id)
    .eq("type", "solves");

  if (solvedLinksError) return { ok: false, error: solvedLinksError.message };

  const contextLinks: WorkItemContextLink[] = (links ?? []).map((link) => ({
    type: contextTypeSchema.parse(link.context_type),
    context_id: link.context_id,
  }));

  const solvedPainPoints = (solvedLinks ?? []).map((link) => link.target_id);

  try {
    return {
      ok: true,
      item: parseStoredWorkItem(parsed.data, contextLinks, solvedPainPoints),
    };
  } catch (parseError) {
    return {
      ok: false,
      error: parseError instanceof Error ? parseError.message : "Item malformé en base.",
    };
  }
}