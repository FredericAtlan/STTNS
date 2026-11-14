import { createClient } from "@/lib/supabase/server";
import type { SttnsProjectInvite, SttnsProjectRole } from "@/types/sttns";

const VALID_INVITE_ROLES: SttnsProjectRole[] = ["ceo", "cto", "expert"];

export function sanitizeInviteRoles(roles: string[]): SttnsProjectRole[] {
  const out = roles.filter((r): r is SttnsProjectRole =>
    VALID_INVITE_ROLES.includes(r as SttnsProjectRole)
  );
  return out.length ? out : ["expert"];
}

export async function fetchPendingInvites(projectId: string): Promise<SttnsProjectInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_invites")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as SttnsProjectInvite[];
}

export async function applyPendingInvitesForUser(
  userId: string,
  email: string
): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("sttns_apply_pending_invites", {
    p_user_id: userId,
    p_email: email,
  });
  if (error) return 0;
  return typeof data === "number" ? data : 0;
}

export async function assignProjectRoles(
  projectId: string,
  userId: string,
  roles: SttnsProjectRole[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  for (const role of roles) {
    const { error } = await supabase.from("sttns_project_members").insert({
      project_id: projectId,
      user_id: userId,
      role,
    });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
  }
  return { ok: true };
}
