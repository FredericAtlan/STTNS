"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectCeoAdmin } from "@/lib/sttns/access";
import {
  addMemberWithSquadRole,
  updateMemberSquadRole,
} from "@/lib/sttns/projectMembers";
import { logProjectSettingsAudit } from "@/lib/sttns/projectSettingsAudit";
import {
  projectArchiveConfirmSchema,
  projectGeneralUpdateSchema,
  projectInviteMemberSchema,
  projectWorkflowSettingsUpdateSchema,
  updateMemberSquadRoleSchema,
  type ProjectArchiveConfirmInput,
  type ProjectGeneralUpdateInput,
  type ProjectInviteMemberInput,
  type ProjectWorkflowSettingsUpdateInput,
  type UpdateMemberSquadRoleInput,
  parseProjectWorkflowSettings,
} from "@/lib/sttns/projectSettingsSchema";
import type { SttnsSquadProjectRole } from "@/types/sttns";

function revalidateProjectSettings(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}/settings`);
  revalidatePath(`/projects/${projectSlug}/kanban`);
  revalidatePath(`/projects/${projectSlug}/radar`);
  revalidatePath(`/projects/${projectSlug}/cycles`);
  revalidatePath(`/projects/${projectSlug}/user-stories`);
  revalidatePath(`/projects/${projectSlug}/mindmap`);
  revalidatePath("/", "layout");
  revalidatePath("/");
}

export async function updateProjectSettingsAction(
  projectId: string,
  projectSlug: string,
  data: ProjectWorkflowSettingsUpdateInput
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const parsed = projectWorkflowSettingsUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Paramètres invalides.",
    };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("sttns_projects")
    .select("settings")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("sttns_projects")
    .update({ settings: parsed.data })
    .eq("id", projectId);

  if (error) return { ok: false as const, error: error.message };

  await logProjectSettingsAudit(
    supabase,
    projectId,
    access.userId,
    "workflow_settings",
    JSON.stringify(parseProjectWorkflowSettings(before?.settings)),
    JSON.stringify(parsed.data)
  );

  revalidateProjectSettings(projectSlug);
  return { ok: true as const };
}

export async function updateProjectGeneralAction(
  projectId: string,
  projectSlug: string,
  data: ProjectGeneralUpdateInput
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const parsed = projectGeneralUpdateSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const supabase = await createClient();
  const { data: before } = await supabase
    .from("sttns_projects")
    .select("name, description")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("sttns_projects")
    .update({
      name: parsed.data.name,
      description: parsed.data.description?.trim() || null,
    })
    .eq("id", projectId);

  if (error) return { ok: false as const, error: error.message };

  if (before?.name !== parsed.data.name) {
    await logProjectSettingsAudit(
      supabase,
      projectId,
      access.userId,
      "name",
      before?.name ?? null,
      parsed.data.name
    );
  }
  const newDesc = parsed.data.description?.trim() || null;
  if ((before?.description ?? null) !== newDesc) {
    await logProjectSettingsAudit(
      supabase,
      projectId,
      access.userId,
      "description",
      before?.description ?? null,
      newDesc
    );
  }

  revalidateProjectSettings(projectSlug);
  return { ok: true as const };
}

export async function inviteOrAddProjectMemberAction(
  projectId: string,
  projectSlug: string,
  _projectName: string,
  data: ProjectInviteMemberInput
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const parsed = projectInviteMemberSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  const squadRole = parsed.data.project_role as SttnsSquadProjectRole;
  const supabase = await createClient();

  if (parsed.data.user_id?.trim()) {
    const userId = parsed.data.user_id.trim();
    const { data: profile } = await supabase
      .from("sttns_profiles")
      .select("id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile) {
      return { ok: false as const, error: "Utilisateur introuvable." };
    }

    const result = await addMemberWithSquadRole(supabase, projectId, userId, squadRole);
    if (!result.ok) return result;

    await logProjectSettingsAudit(
      supabase,
      projectId,
      access.userId,
      "member_add",
      null,
      `${userId}:${squadRole}`
    );

    revalidateProjectSettings(projectSlug);
    return { ok: true as const, message: "Membre ajouté au projet." };
  }

  const email = (parsed.data.email ?? "").trim().toLowerCase();
  if (!email) {
    return { ok: false as const, error: "Email requis." };
  }

  const { data: existingProfile } = await supabase
    .from("sttns_profiles")
    .select("id, email")
    .ilike("email", email)
    .maybeSingle();

  if (existingProfile) {
    const result = await addMemberWithSquadRole(
      supabase,
      projectId,
      existingProfile.id,
      squadRole
    );
    if (!result.ok) return result;

    await logProjectSettingsAudit(
      supabase,
      projectId,
      access.userId,
      "member_add",
      null,
      `${email}:${squadRole}`
    );

    revalidateProjectSettings(projectSlug);
    return {
      ok: true as const,
      message: `${email} ajouté avec le rôle ${squadRole}.`,
    };
  }

  await supabase
    .from("sttns_project_invites")
    .update({ status: "cancelled" })
    .eq("project_id", projectId)
    .eq("email", email)
    .eq("status", "pending");

  const functionalRole = squadRole === "ceo_admin" ? "ceo" : "expert";
  const { error: inviteErr } = await supabase.from("sttns_project_invites").insert({
    project_id: projectId,
    email,
    roles: [functionalRole],
    squad_role: squadRole,
    invited_by: access.userId,
    status: "pending",
  });

  if (inviteErr) return { ok: false as const, error: inviteErr.message };

  await logProjectSettingsAudit(
    supabase,
    projectId,
    access.userId,
    "member_invite",
    null,
    `${email}:${squadRole}`
  );

  revalidateProjectSettings(projectSlug);
  return {
    ok: true as const,
    message: `Invitation enregistrée pour ${email} (${squadRole}).`,
  };
}

export async function cancelProjectInviteAction(
  projectId: string,
  projectSlug: string,
  inviteId: string
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  if (!inviteId?.trim()) {
    return { ok: false as const, error: "Invitation introuvable." };
  }

  const supabase = await createClient();
  const { data: invite, error: fetchErr } = await supabase
    .from("sttns_project_invites")
    .select("id, email, status, project_id")
    .eq("id", inviteId.trim())
    .eq("project_id", projectId)
    .maybeSingle();

  if (fetchErr) return { ok: false as const, error: fetchErr.message };
  if (!invite) return { ok: false as const, error: "Invitation introuvable." };
  if (invite.status !== "pending") {
    return { ok: false as const, error: "Cette invitation n'est plus en attente." };
  }

  const { error } = await supabase
    .from("sttns_project_invites")
    .update({ status: "cancelled" })
    .eq("id", invite.id)
    .eq("project_id", projectId)
    .eq("status", "pending");

  if (error) return { ok: false as const, error: error.message };

  await logProjectSettingsAudit(
    supabase,
    projectId,
    access.userId,
    "member_invite_cancel",
    invite.email,
    null
  );

  revalidateProjectSettings(projectSlug);
  return { ok: true as const, message: `Invitation retirée pour ${invite.email}.` };
}

export async function updateMemberSquadRoleAction(
  projectId: string,
  projectSlug: string,
  data: UpdateMemberSquadRoleInput
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const parsed = updateMemberSquadRoleSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Données invalides.",
    };
  }

  if (parsed.data.project_role === "ceo_admin" && access.userId === parsed.data.user_id) {
    // self ok
  } else if (parsed.data.project_role === "ceo_admin") {
    // only ceo_admin can promote to ceo_admin — already gated by requireProjectCeoAdmin
  }

  const supabase = await createClient();
  const { data: beforeRows } = await supabase
    .from("sttns_project_members")
    .select("project_role")
    .eq("project_id", projectId)
    .eq("user_id", parsed.data.user_id)
    .limit(1);

  const beforeRole = (beforeRows?.[0]?.project_role as string | undefined) ?? "editor";

  const result = await updateMemberSquadRole(
    supabase,
    projectId,
    parsed.data.user_id,
    parsed.data.project_role
  );
  if (!result.ok) return result;

  await logProjectSettingsAudit(
    supabase,
    projectId,
    access.userId,
    "member_project_role",
    beforeRole,
    parsed.data.project_role
  );

  revalidateProjectSettings(projectSlug);
  return { ok: true as const };
}

export async function archiveProjectWithConfirmAction(
  projectId: string,
  projectSlug: string,
  data: ProjectArchiveConfirmInput
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const parsed = projectArchiveConfirmSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Confirmation invalide.",
    };
  }

  const supabase = await createClient();
  const { data: updated, error } = await supabase
    .from("sttns_projects")
    .update({ is_active: false })
    .eq("id", projectId)
    .select("id");

  if (error) return { ok: false as const, error: error.message };
  if (!updated?.length) {
    return {
      ok: false as const,
      error: "Projet introuvable ou action non autorisée.",
    };
  }

  await logProjectSettingsAudit(
    supabase,
    projectId,
    access.userId,
    "archive",
    "active",
    "archived"
  );

  revalidatePath("/", "layout");
  revalidatePath("/");
  return { ok: true as const };
}

export async function restoreItemAction(
  id: string,
  table: "sttns_work_items" | "sttns_cycles",
  projectId: string,
  projectSlug: string
) {
  const { requireProjectEditor } = await import("@/lib/sttns/access");
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();

  if (table === "sttns_cycles") {
    const { error } = await supabase
      .from("sttns_cycles")
      .update({ is_active: true })
      .eq("id", id)
      .eq("project_id", projectId);

    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("sttns_work_items")
      .update({ archived_at: null })
      .eq("id", id)
      .eq("project_id", projectId);

    if (error) return { ok: false as const, error: error.message };
  }

  revalidateProjectSettings(projectSlug);
  return { ok: true as const };
}

export async function hardDeleteItemAction(
  id: string,
  table: "sttns_work_items" | "sttns_cycles",
  projectId: string,
  projectSlug: string
) {
  const access = await requireProjectCeoAdmin(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();

  if (table === "sttns_cycles") {
    const { error } = await supabase
      .from("sttns_cycles")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (error) return { ok: false as const, error: error.message };
  } else {
    const { error } = await supabase
      .from("sttns_work_items")
      .delete()
      .eq("id", id)
      .eq("project_id", projectId);

    if (error) return { ok: false as const, error: error.message };
  }

  revalidateProjectSettings(projectSlug);
  return { ok: true as const };
}
