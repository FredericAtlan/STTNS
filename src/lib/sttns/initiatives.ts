import type { SupabaseClient } from "@supabase/supabase-js";

const FEATURE_CODE_PATTERN = /^F(\d+)$/i;

/** Extrait le numéro d'un code type F01, F10… */
export function parseFeatureCodeNumber(code: string | null | undefined): number | null {
  if (!code?.trim()) return null;
  const match = code.trim().match(FEATURE_CODE_PATTERN);
  if (!match) return null;
  return parseInt(match[1]!, 10);
}

/** Propose le prochain code séquentiel (F01, F02, …) pour un projet. */
export function proposeNextFeatureCode(existingCodes: (string | null | undefined)[]): string {
  let max = 0;
  for (const code of existingCodes) {
    const n = parseFeatureCodeNumber(code);
    if (n != null && n > max) max = n;
  }
  return `F${String(max + 1).padStart(2, "0")}`;
}

export async function fetchProposedFeatureCode(
  supabase: SupabaseClient,
  projectId: string
): Promise<string> {
  const { data } = await supabase
    .from("sttns_initiatives")
    .select("feature_code")
    .eq("project_id", projectId);

  return proposeNextFeatureCode((data ?? []).map((row) => row.feature_code));
}

export async function assignProposedFeatureCodeIfMissing(
  supabase: SupabaseClient,
  projectId: string,
  featureCode: string | null | undefined
): Promise<string> {
  if (featureCode?.trim()) return featureCode.trim().toUpperCase();
  return fetchProposedFeatureCode(supabase, projectId);
}
