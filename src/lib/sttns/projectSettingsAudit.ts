import type { SupabaseClient } from "@supabase/supabase-js";

export type ProjectSettingsAuditRow = {
  id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  forced: boolean;
  created_at: string;
  changed_by: string | null;
  profile?: { full_name: string | null; email: string | null } | null;
};

export async function logProjectSettingsAudit(
  supabase: SupabaseClient,
  projectId: string,
  changedBy: string,
  fieldName: string,
  oldValue: string | null,
  newValue: string | null
): Promise<void> {
  await supabase.from("sttns_project_settings_audit").insert({
    project_id: projectId,
    changed_by: changedBy,
    field_name: fieldName,
    old_value: oldValue,
    new_value: newValue,
    forced: false,
  });
}

export async function fetchProjectSettingsAudit(
  projectId: string,
  limit = 40
): Promise<ProjectSettingsAuditRow[]> {
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const { data } = await supabase
    .from("sttns_project_settings_audit")
    .select(
      "id, field_name, old_value, new_value, forced, created_at, changed_by, profile:sttns_profiles(full_name, email)"
    )
    .eq("project_id", projectId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => {
    const profileRaw = row.profile as
      | { full_name: string | null; email: string | null }
      | { full_name: string | null; email: string | null }[]
      | null;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    return {
      id: row.id as string,
      field_name: row.field_name as string,
      old_value: row.old_value as string | null,
      new_value: row.new_value as string | null,
      forced: row.forced as boolean,
      created_at: row.created_at as string,
      changed_by: row.changed_by as string | null,
      profile: profile ?? null,
    };
  });
}
