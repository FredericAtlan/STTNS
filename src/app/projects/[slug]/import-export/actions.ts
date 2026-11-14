"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember, requireProjectEditor } from "@/lib/sttns/access";
import type { ImportMode } from "@/lib/sttns/types";
import {
  ALL_EXPORT_ENTITY_KEYS,
  type ExportEntityKey,
  type ExportManifest,
  filesForEntitySelection,
  parseMetadataJson,
  STTNS_EXPORT_FORMAT,
  workItemRowToCsv,
} from "@/lib/sttns/importExportCatalog";
import {
  importWhyMatrixAction,
  exportWhyMatrixAction,
} from "@/app/projects/[slug]/why/whyCsvActions";
import { saveWorkItem } from "@/lib/sttns/workItems";
import type { DbWorkItemType, WorkItemStatus } from "@/lib/sttns/types";

export type ProjectPackFileMap = Record<string, string>;

export type ExportPackResult =
  | { ok: true; manifest: ExportManifest; files: ProjectPackFileMap }
  | { ok: false; error: string };

function csvEscapeNote(): string {
  return [
    "STTNS — Pack Spine v2",
    "",
    "Les liaisons utilisent des UUID (colonnes id, parent_id, context_id, source_id, target_id).",
    "Renommer title/code dans l'UI ou dans le CSV ne casse pas les liens tant que les id restent.",
    "",
    "Ordre d'import recommandé : cycles → why → epics → features → links → stories → tasks.",
  ].join("\n");
}

export async function exportProjectPackAction(
  projectId: string,
  entities: ExportEntityKey[]
): Promise<ExportPackResult> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const selected =
    entities.length > 0 ? entities : ([...ALL_EXPORT_ENTITY_KEYS] as ExportEntityKey[]);

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("sttns_projects")
    .select("name, slug")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return { ok: false, error: projectError?.message ?? "Projet introuvable." };
  }

  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("full_name, email")
    .eq("id", access.userId)
    .maybeSingle();

  const exportedBy =
    profile?.full_name?.trim() || profile?.email?.trim() || access.userId;

  const files: ProjectPackFileMap = {};
  const counts: ExportManifest["counts"] = {};
  const { generateCsv } = await import("@/lib/csv/csvUtils");

  const needsWhy = selected.includes("why");
  const needsDiscovery = selected.includes("discovery");
  const needsCycles = selected.includes("cycles");
  const needsEpics = selected.includes("epics");
  const needsFeatures = selected.includes("features");
  const needsStories = selected.includes("stories");
  const needsTasks = selected.includes("tasks");

  if (needsWhy) {
    const whyRes = await exportWhyMatrixAction(projectId);
    if (!whyRes.ok) return whyRes;
    files["why/personas.csv"] = generateCsv(whyRes.data.personas);
    files["why/pain_points.csv"] = generateCsv(whyRes.data.pain_points);
    files["why/jtbd.csv"] = generateCsv(whyRes.data.jtbd);
    counts.why =
      whyRes.data.personas.length +
      whyRes.data.pain_points.length +
      whyRes.data.jtbd.length;

    const jtbdIds = whyRes.data.jtbd.map((j) => j.id).filter(Boolean);
    if (jtbdIds.length > 0) {
      const { data: solveRows } = await supabase
        .from("sttns_work_item_links")
        .select("source_id, target_id")
        .in("source_id", jtbdIds)
        .eq("type", "solves");
      const linkRows = (solveRows ?? []).map((r) => ({
        source_id: r.source_id,
        target_id: r.target_id,
        type: "solves",
      }));
      files["links/jtbd_solves.csv"] = generateCsv(linkRows);
      counts.jtbd_solves = linkRows.length;
    } else {
      files["links/jtbd_solves.csv"] = generateCsv([]);
      counts.jtbd_solves = 0;
    }
  }

  async function exportWorkItems(type: DbWorkItemType, path: string, countKey: ExportEntityKey) {
    const { data, error } = await supabase
      .from("sttns_work_items")
      .select(
        "id, type, title, code, status, parent_id, cycle_id, sort_order, assignee_id, metadata"
      )
      .eq("project_id", projectId)
      .eq("type", type)
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    if (error) throw new Error(error.message);
    const rows = (data ?? []).map((r) => workItemRowToCsv(r));
    files[path] = generateCsv(rows);
    counts[countKey] = rows.length;
    return (data ?? []).map((r) => r.id as string);
  }

  try {
    if (needsEpics) await exportWorkItems("epic", "spine/epics.csv", "epics");

    let featureIds: string[] = [];
    if (needsFeatures) {
      featureIds = await exportWorkItems("feature", "spine/features.csv", "features");
      if (featureIds.length > 0) {
        const { data: ctx } = await supabase
          .from("sttns_context_links")
          .select("work_item_id, context_type, context_id")
          .in("work_item_id", featureIds);
        const ctxRows = (ctx ?? []).map((r) => ({
          work_item_id: r.work_item_id,
          context_type: r.context_type,
          context_id: r.context_id,
        }));
        files["links/feature_context.csv"] = generateCsv(ctxRows);
        counts.feature_context = ctxRows.length;
      } else {
        files["links/feature_context.csv"] = generateCsv([]);
        counts.feature_context = 0;
      }
    }

    if (needsStories) await exportWorkItems("story", "spine/stories.csv", "stories");
    if (needsTasks) await exportWorkItems("task", "spine/tasks.csv", "tasks");

    if (needsCycles) {
      const { data: cycles, error } = await supabase
        .from("sttns_cycles")
        .select("id, name, start_date, end_date, is_active, capacity_points")
        .eq("project_id", projectId)
        .order("start_date", { ascending: true });
      if (error) throw new Error(error.message);
      files["cycles/cycles.csv"] = generateCsv(cycles ?? []);
      counts.cycles = cycles?.length ?? 0;
    }

    if (needsDiscovery) {
      const { data: drafts, error } = await supabase
        .from("sttns_discovery_drafts")
        .select("id, title, author, comments, payload, created_at, updated_at, owner_id")
        .eq("project_id", projectId)
        .order("updated_at", { ascending: false });
      if (error) throw new Error(error.message);
      files["discovery/sessions.json"] = JSON.stringify(
        {
          schemaVersion: 1,
          sessions: drafts ?? [],
        },
        null,
        2
      );
      counts.discovery = drafts?.length ?? 0;
    }
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Export interrompu.",
    };
  }

  files["README.txt"] = csvEscapeNote();
  const fileList = filesForEntitySelection(selected);
  for (const path of Object.keys(files)) {
    if (path === "README.txt") continue;
    if (!fileList.includes(path) && !path.startsWith("links/")) {
      // keep links if parent entity exported
    }
  }

  const manifest: ExportManifest = {
    format: STTNS_EXPORT_FORMAT,
    version: 2,
    projectName: project.name,
    projectSlug: project.slug,
    exportDate: new Date().toISOString(),
    exportedBy,
    entities: selected,
    files: Object.keys(files).filter((f) => f !== "README.txt").sort(),
    counts,
    linkColumns: {
      parent_id: "spine/*.csv — hiérarchie Epic→Feature→Story→Task",
      feature_context: "links/feature_context.csv — Feature→JTBD (context_type=job)",
      jtbd_solves: "links/jtbd_solves.csv — JTBD→Pain Point (type=solves)",
    },
  };

  files["manifest.json"] = JSON.stringify(manifest, null, 2);

  return { ok: true, manifest, files };
}

async function archiveDeliveryWorkItems(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editor = await requireProjectEditor(projectId);
  if (!editor.ok) return editor;

  const supabase = await createClient();
  const types: DbWorkItemType[] = ["task", "story", "feature", "epic"];
  const archivedAt = new Date().toISOString();

  for (const type of types) {
    const { data: rows, error } = await supabase
      .from("sttns_work_items")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", type)
      .is("archived_at", null);

    if (error) return { ok: false, error: error.message };

    for (const row of rows ?? []) {
      const current = await supabase
        .from("sttns_work_items")
        .select("*")
        .eq("id", row.id)
        .maybeSingle();
      if (!current.data) continue;

      const result = await saveWorkItem({
        id: row.id,
        project_id: projectId,
        type,
        title: current.data.title,
        status: current.data.status as WorkItemStatus,
        parent_id: current.data.parent_id,
        code: current.data.code,
        sort_order: current.data.sort_order ?? 0,
        priority: current.data.priority ?? 3,
        metadata: (current.data.metadata as Record<string, unknown>) ?? {},
        archived_at: archivedAt,
      } as Parameters<typeof saveWorkItem>[0]);
      if (!result.ok) return result;
    }
  }

  revalidatePath(`/projects/${projectSlug}/portfolio`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  return { ok: true };
}

type CsvRow = Record<string, unknown>;

function cell(row: CsvRow, key: string): string {
  const v = row[key];
  if (v == null) return "";
  return String(v).trim();
}

async function importSpineCsvRows(
  projectId: string,
  projectSlug: string,
  type: DbWorkItemType,
  rows: CsvRow[],
  mode: ImportMode
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editor = await requireProjectEditor(projectId);
  if (!editor.ok) return editor;

  const forceCreate = mode === "append";

  for (const row of rows) {
    const title = cell(row, "title");
    if (!title) continue;

    const idRaw = cell(row, "id");
    const id =
      !forceCreate && idRaw && /^[0-9a-f-]{36}$/i.test(idRaw) ? idRaw : undefined;

    const parentRaw = cell(row, "parent_id");
    const parent_id = parentRaw || null;
    const cycleRaw = cell(row, "cycle_id");
    const cycle_id = cycleRaw || null;
    const assigneeRaw = cell(row, "assignee_id");
    const assignee_id = assigneeRaw || null;

    const status = (cell(row, "status") || "todo") as WorkItemStatus;
    const metadata = parseMetadataJson(row.metadata_json ?? row.metadata);

    const payload = {
      id,
      project_id: projectId,
      type,
      title,
      code: cell(row, "code") || null,
      status,
      parent_id,
      cycle_id,
      assignee_id,
      sort_order: Number(row.sort_order ?? 0) || 0,
      priority: 3,
      metadata,
    };

    const result = await saveWorkItem(payload as Parameters<typeof saveWorkItem>[0]);
    if (!result.ok) {
      return {
        ok: false,
        error: `${type} « ${title.slice(0, 40)} » : ${result.error}`,
      };
    }
  }

  revalidatePath(`/projects/${projectSlug}/portfolio`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath(`/projects/${projectSlug}/kanban`);
  return { ok: true };
}

async function importContextLinks(
  projectId: string,
  rows: CsvRow[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editor = await requireProjectEditor(projectId);
  if (!editor.ok) return editor;

  const supabase = await createClient();

  for (const row of rows) {
    const workItemId = cell(row, "work_item_id");
    const contextType = cell(row, "context_type") || "job";
    const contextId = cell(row, "context_id");
    if (!workItemId || !contextId) continue;

    const { data: feature } = await supabase
      .from("sttns_work_items")
      .select("id")
      .eq("id", workItemId)
      .eq("project_id", projectId)
      .eq("type", "feature")
      .maybeSingle();

    if (!feature) continue;

    const { data: existing } = await supabase
      .from("sttns_context_links")
      .select("id")
      .eq("work_item_id", workItemId)
      .eq("context_type", contextType)
      .eq("context_id", contextId)
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from("sttns_context_links").insert({
      work_item_id: workItemId,
      context_type: contextType,
      context_id: contextId,
      created_by: editor.userId,
    });
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

async function importJtbdSolvesLinks(
  projectId: string,
  rows: CsvRow[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editor = await requireProjectEditor(projectId);
  if (!editor.ok) return editor;

  const supabase = await createClient();

  for (const row of rows) {
    const sourceId = cell(row, "source_id");
    const targetId = cell(row, "target_id");
    if (!sourceId || !targetId) continue;

    const { data: existing } = await supabase
      .from("sttns_work_item_links")
      .select("source_id")
      .eq("source_id", sourceId)
      .eq("target_id", targetId)
      .eq("type", "solves")
      .maybeSingle();

    if (existing) continue;

    const { error } = await supabase.from("sttns_work_item_links").insert({
      source_id: sourceId,
      target_id: targetId,
      type: "solves",
      created_by: editor.userId,
    });
    if (error) return { ok: false, error: error.message };
  }

  void projectId;
  return { ok: true };
}

async function importCyclesCsv(
  projectId: string,
  projectSlug: string,
  rows: CsvRow[],
  mode: ImportMode
): Promise<{ ok: true } | { ok: false; error: string }> {
  const editor = await requireProjectEditor(projectId);
  if (!editor.ok) return editor;

  const supabase = await createClient();

  if (mode === "replace") {
    await supabase.from("sttns_cycles").delete().eq("project_id", projectId);
  }

  for (const row of rows) {
    const name = cell(row, "name");
    if (!name) continue;

    const payload = {
      project_id: projectId,
      name,
      start_date: cell(row, "start_date"),
      end_date: cell(row, "end_date"),
      is_active: row.is_active !== false && row.is_active !== "false",
      capacity_points: Number(row.capacity_points ?? 0) || 0,
    };

    const id = cell(row, "id");
    if (id && mode !== "append") {
      const { error } = await supabase.from("sttns_cycles").upsert({
        id,
        ...payload,
      });
      if (error) return { ok: false, error: error.message };
    } else {
      const { error } = await supabase.from("sttns_cycles").insert(payload);
      if (error) return { ok: false, error: error.message };
    }
  }

  revalidatePath(`/projects/${projectSlug}/cycles`);
  return { ok: true };
}

export async function importProjectPackAction(
  projectId: string,
  projectSlug: string,
  mode: ImportMode,
  pack: {
    why?: { personas: CsvRow[]; pain_points: CsvRow[]; jtbd: CsvRow[] };
    jtbd_solves?: CsvRow[];
    feature_context?: CsvRow[];
    epics?: CsvRow[];
    features?: CsvRow[];
    stories?: CsvRow[];
    tasks?: CsvRow[];
    cycles?: CsvRow[];
    discovery?: { sessions?: unknown[] };
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  if (mode === "replace") {
    if (pack.why) {
      const cleared = await importWhyMatrixAction(projectId, projectSlug, "replace", {
        personas: pack.why.personas,
        pain_points: pack.why.pain_points,
        jtbd: pack.why.jtbd,
      });
      if (!cleared.ok) return cleared;
    }
    if (pack.epics || pack.features || pack.stories || pack.tasks) {
      const arch = await archiveDeliveryWorkItems(projectId, projectSlug);
      if (!arch.ok) return arch;
    }
  }

  if (pack.cycles?.length) {
    const res = await importCyclesCsv(projectId, projectSlug, pack.cycles, mode);
    if (!res.ok) return res;
  }

  if (pack.why && mode !== "replace") {
    const res = await importWhyMatrixAction(projectId, projectSlug, mode, {
      personas: pack.why.personas,
      pain_points: pack.why.pain_points,
      jtbd: pack.why.jtbd,
    });
    if (!res.ok) return res;
  }

  if (pack.epics?.length) {
    const res = await importSpineCsvRows(projectId, projectSlug, "epic", pack.epics, mode);
    if (!res.ok) return res;
  }
  if (pack.features?.length) {
    const res = await importSpineCsvRows(
      projectId,
      projectSlug,
      "feature",
      pack.features,
      mode
    );
    if (!res.ok) return res;
  }
  if (pack.feature_context?.length) {
    const res = await importContextLinks(projectId, pack.feature_context);
    if (!res.ok) return res;
  }
  if (pack.stories?.length) {
    const res = await importSpineCsvRows(projectId, projectSlug, "story", pack.stories, mode);
    if (!res.ok) return res;
  }
  if (pack.tasks?.length) {
    const res = await importSpineCsvRows(projectId, projectSlug, "task", pack.tasks, mode);
    if (!res.ok) return res;
  }

  if (pack.jtbd_solves?.length) {
    const res = await importJtbdSolvesLinks(projectId, pack.jtbd_solves);
    if (!res.ok) return res;
  }

  if (pack.discovery?.sessions?.length) {
    const editor = await requireProjectEditor(projectId);
    if (!editor.ok) return editor;
    const supabase = await createClient();
    for (const session of pack.discovery.sessions) {
      const s = session as Record<string, unknown>;
      const title = String(s.title ?? "Session importée");
      const payload = s.payload ?? {};
      const { error } = await supabase.from("sttns_discovery_drafts").insert({
        project_id: projectId,
        owner_id: editor.userId,
        title,
        author: String(s.author ?? ""),
        comments: String(s.comments ?? "Import pack"),
        payload,
      });
      if (error) return { ok: false, error: error.message };
    }
    revalidatePath(`/projects/${projectSlug}/discovery`);
  }

  revalidatePath(`/projects/${projectSlug}/import-export`);
  return { ok: true };
}

/** Compteurs affichés sur le hub. */
export async function fetchImportExportStatsAction(projectId: string): Promise<
  | {
      ok: true;
      counts: Partial<Record<ExportEntityKey | "jtbd_solves" | "feature_context", number>>;
    }
  | { ok: false; error: string }
> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();

  const countType = async (type: string) => {
    const { count } = await supabase
      .from("sttns_work_items")
      .select("id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("type", type)
      .is("archived_at", null);
    return count ?? 0;
  };

  const [personas, jobs, epics, features, stories, tasks, cycles, discovery] =
    await Promise.all([
      countType("persona"),
      supabase
        .from("sttns_work_items")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .eq("type", "job")
        .is("archived_at", null)
        .then((r) => r.count ?? 0),
      countType("epic"),
      countType("feature"),
      countType("story"),
      countType("task"),
      supabase
        .from("sttns_cycles")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .then((r) => r.count ?? 0),
      supabase
        .from("sttns_discovery_drafts")
        .select("id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .then((r) => r.count ?? 0),
    ]);

  return {
    ok: true,
    counts: {
      why: personas + jobs,
      epics,
      features,
      stories,
      tasks,
      cycles,
      discovery,
    },
  };
}
