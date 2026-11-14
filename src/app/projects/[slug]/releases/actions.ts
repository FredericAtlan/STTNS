"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import type { SttnsReleaseStatus } from "@/types/sttns";

function revalidateReleasePaths(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}/features`);
  revalidatePath(`/projects/${projectSlug}/roadmap`);
}

export async function createReleaseAction(
  projectId: string,
  projectSlug: string,
  input: { label: string; target_date?: string | null; status?: SttnsReleaseStatus }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const label = input.label.trim().toUpperCase();
  if (!label) return { ok: false, error: "Le libellé release est obligatoire (ex. RL1)." };

  const supabase = await createClient();
  const { data: maxRow } = await supabase
    .from("sttns_releases")
    .select("sort_order")
    .eq("project_id", projectId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data, error } = await supabase
    .from("sttns_releases")
    .insert({
      project_id: projectId,
      label,
      status: input.status ?? "draft",
      target_date: input.target_date?.trim() || null,
      sort_order: ((maxRow?.sort_order as number | undefined) ?? 0) + 10,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Échec création release." };
  revalidateReleasePaths(projectSlug);
  return { ok: true, id: data.id };
}

export async function updateReleaseStatusAction(
  projectId: string,
  projectSlug: string,
  releaseId: string,
  status: SttnsReleaseStatus
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_releases")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", releaseId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidateReleasePaths(projectSlug);
  return { ok: true };
}
