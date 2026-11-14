"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePlatformAdmin } from "@/lib/sttns/access";
import type { SttnsPlatformRole, SttnsProjectRole } from "@/types/sttns";

function revalidateAdmin() {
  revalidatePath("/admin");
  revalidatePath("/admin/users");
  revalidatePath("/admin/projects");
  revalidatePath("/admin/invites");
  revalidatePath("/admin/security");
  revalidatePath("/settings/profile");
  revalidatePath("/me");
}

export async function setPlatformRoleAction(
  userId: string,
  role: SttnsPlatformRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return admin;

  if (userId === admin.userId && role !== "admin") {
    const supabase = await createClient();
    const { count } = await supabase
      .from("sttns_profiles")
      .select("*", { count: "exact", head: true })
      .eq("platform_role", "admin");

    if ((count ?? 0) <= 1) {
      return { ok: false, error: "Impossible de retirer le dernier administrateur." };
    }
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_profiles")
    .update({ platform_role: role })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  revalidateAdmin();
  return { ok: true };
}

export async function updateUserProfileAdminAction(
  userId: string,
  data: { full_name: string }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_profiles")
    .update({ full_name: data.full_name.trim() || null })
    .eq("id", userId);

  if (error) return { ok: false, error: error.message };
  revalidateAdmin();
  return { ok: true };
}

export async function adminToggleProjectRoleAction(
  projectId: string,
  projectSlug: string,
  userId: string,
  role: SttnsProjectRole,
  assign: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  if (assign) {
    const { error } = await supabase.from("sttns_project_members").insert({
      project_id: projectId,
      user_id: userId,
      role,
    });
    if (error && !error.message.includes("duplicate")) {
      return { ok: false, error: error.message };
    }
  } else {
    const { error } = await supabase
      .from("sttns_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return { ok: false, error: error.message };
  }

  revalidateAdmin();
  revalidatePath(`/projects/${projectSlug}/settings`);
  revalidatePath(`/projects/${projectSlug}/settings?tab=team`);
  return { ok: true };
}

export async function cancelProjectInviteAction(
  inviteId: string,
  projectSlug?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requirePlatformAdmin();
  if (!admin.ok) return admin;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_project_invites")
    .update({ status: "cancelled" })
    .eq("id", inviteId)
    .eq("status", "pending");

  if (error) return { ok: false, error: error.message };
  revalidateAdmin();
  if (projectSlug) {
    revalidatePath(`/projects/${projectSlug}/settings`);
    revalidatePath(`/projects/${projectSlug}/settings?tab=team`);
  }
  return { ok: true };
}
