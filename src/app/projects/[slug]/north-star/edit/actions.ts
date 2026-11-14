"use server";

import { revalidatePath } from "next/cache";
import { saveProjectMetrics } from "@/lib/sttns/saveProjectMetrics";
import type { MetricDraft } from "@/lib/sttns/metrics";

export async function saveNorthStarMetricsAction(
  projectId: string,
  projectSlug: string,
  nsmLabel: string,
  nsmDescription: string,
  drafts: MetricDraft[],
  existingIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const result = await saveProjectMetrics(
    projectId,
    nsmLabel,
    nsmDescription,
    drafts,
    existingIds
  );

  if (!result.ok) return result;

  revalidatePath(`/projects/${projectSlug}/nsm`);
  revalidatePath(`/projects/${projectSlug}/north-star/edit`);
  revalidatePath(`/projects/${projectSlug}/summary`);

  return { ok: true };
}
