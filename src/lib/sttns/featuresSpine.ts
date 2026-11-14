import type { SupabaseClient } from "@supabase/supabase-js";
import { readMetadataDescription } from "@/lib/sttns/workItemMetadata";
import { readEpicCycleId } from "@/lib/sttns/cycleEpicLink";
import { readImpact } from "@/lib/sttns/valueEffort";
import { splitWhyJobs } from "@/lib/sttns/whySpine";

export const FEATURE_STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "Revue",
  done: "Terminé",
};

export interface SpineEpicOption {
  id: string;
  title: string;
  code: string | null;
  cycle_id?: string | null;
}

export interface JtbdOption {
  id: string;
  title: string;
  personaName: string;
}

export interface SpineFeatureListItem {
  id: string;
  title: string;
  code: string | null;
  status: string;
  /** Impact Feature 0–3 (metadata) — remplace l'affichage rice_score. */
  impact: number | null;
  epicTitle: string;
}

export async function fetchSpineEpics(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineEpicOption[]> {
  const { data } = await supabase
    .from("sttns_work_items")
    .select("id, title, code, metadata")
    .eq("project_id", projectId)
    .eq("type", "epic")
    .is("archived_at", null)
    .order("title");

  return (
    data?.map((row) => ({
      id: row.id,
      title: row.title,
      code: row.code,
      cycle_id: readEpicCycleId(row.metadata),
    })) ?? []
  );
}

export async function fetchJtbdOptions(
  supabase: SupabaseClient,
  projectId: string
): Promise<JtbdOption[]> {
  const { data: jobs } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id, metadata")
    .eq("project_id", projectId)
    .eq("type", "job")
    .is("archived_at", null);

  const { data: personas } = await supabase
    .from("sttns_work_items")
    .select("id, title")
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null);

  const personaMap = Object.fromEntries(
    personas?.map((p) => [p.id, p.title]) ?? []
  );

  const { jtbds } = splitWhyJobs(jobs ?? []);

  return jtbds.map((job) => ({
    id: job.id,
    title: job.title,
    personaName: personaMap[job.parent_id ?? ""] ?? "Inconnu",
  }));
}

export async function fetchSpineFeatures(
  supabase: SupabaseClient,
  projectId: string
): Promise<SpineFeatureListItem[]> {
  const { data: features } = await supabase
    .from("sttns_work_items")
    .select("id, title, code, status, parent_id, metadata")
    .eq("project_id", projectId)
    .eq("type", "feature")
    .is("archived_at", null)
    .order("title");

  if (!features?.length) return [];

  const epicIds = Array.from(
    new Set(features.map((f) => f.parent_id).filter(Boolean) as string[])
  );

  const { data: epics } =
    epicIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title")
          .eq("project_id", projectId)
          .eq("type", "epic")
          .in("id", epicIds)
      : { data: [] };

  const epicMap = Object.fromEntries(
    epics?.map((e) => [e.id, e.title]) ?? []
  );

  return features.map((f) => ({
    id: f.id,
    title: f.title,
    code: f.code,
    status: f.status,
    impact: readImpact(f.metadata),
    epicTitle: f.parent_id ? epicMap[f.parent_id] ?? "Epic inconnu" : "Sans Epic",
  }));
}

export function readFeatureDescription(metadata: unknown): string {
  return readMetadataDescription(metadata) ?? "";
}
