import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SttnsProfile, SttnsProjectInvite, SttnsProjectRole, SttnsSquadProjectRole } from "@/types/sttns";
import { maxSquadRole } from "@/lib/sttns/squadRoles";

export type ProjectMemberRow = {
  user_id: string;
  roles: SttnsProjectRole[];
  project_role: SttnsSquadProjectRole;
  profile: Pick<SttnsProfile, "id" | "full_name" | "email" | "avatar_url">;
  joined_at: string;
};

export type ProjectSquadMemberPreview = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export function mapMemberRowsToSquadPreviews(rows: ProjectMemberRow[]): ProjectSquadMemberPreview[] {
  return rows.map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));
}

/** Précharge les miniatures squad pour la barre projet (évite un fetch client fragile). */
export async function fetchSquadPreviewsByProjectIds(
  projectIds: string[]
): Promise<Record<string, ProjectSquadMemberPreview[]>> {
  const uniqueIds = Array.from(new Set(projectIds.filter(Boolean)));
  if (uniqueIds.length === 0) return {};

  const entries = await Promise.all(
    uniqueIds.map(async (projectId) => {
      const rows = await fetchProjectMembersGrouped(projectId);
      return [projectId, mapMemberRowsToSquadPreviews(rows)] as const;
    })
  );

  return Object.fromEntries(entries);
}

function resolveRowSquadRole(
  projectRole: SttnsSquadProjectRole | null | undefined,
  functionalRole: SttnsProjectRole
): SttnsSquadProjectRole {
  if (projectRole) return projectRole;
  return functionalRole === "ceo" ? "ceo_admin" : "editor";
}

export async function fetchProjectMembersGrouped(
  projectId: string
): Promise<ProjectMemberRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_members")
    .select(
      "user_id, role, project_role, created_at, profile:sttns_profiles(id, full_name, email, avatar_url)"
    )
    .eq("project_id", projectId)
    .order("created_at");

  const byUser = new Map<string, ProjectMemberRow>();

  for (const row of data ?? []) {
    const profileRaw = row.profile as
      | Pick<SttnsProfile, "id" | "full_name" | "email" | "avatar_url">
      | Pick<SttnsProfile, "id" | "full_name" | "email" | "avatar_url">[]
      | null;
    const profile = Array.isArray(profileRaw) ? profileRaw[0] : profileRaw;
    if (!profile) continue;

    const squad = resolveRowSquadRole(
      row.project_role as SttnsSquadProjectRole | null,
      row.role as SttnsProjectRole
    );

    const existing = byUser.get(row.user_id);
    if (existing) {
      if (!existing.roles.includes(row.role as SttnsProjectRole)) {
        existing.roles.push(row.role as SttnsProjectRole);
      }
      existing.project_role = maxSquadRole([existing.project_role, squad]);
      continue;
    }

    byUser.set(row.user_id, {
      user_id: row.user_id,
      roles: [row.role as SttnsProjectRole],
      project_role: squad,
      profile,
      joined_at: row.created_at as string,
    });
  }

  return Array.from(byUser.values()).sort((a, b) =>
    (a.profile.full_name ?? a.profile.email ?? "").localeCompare(
      b.profile.full_name ?? b.profile.email ?? ""
    )
  );
}

export async function fetchProjectPendingInvites(
  projectId: string
): Promise<SttnsProjectInvite[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_invites")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: false });
  return (data ?? []) as SttnsProjectInvite[];
}

/** Rôle fonctionnel par défaut pour un accès squad. */
function functionalRoleForSquad(squadRole: SttnsSquadProjectRole): SttnsProjectRole {
  if (squadRole === "ceo_admin") return "ceo";
  return "expert";
}

export async function addMemberWithSquadRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  squadRole: SttnsSquadProjectRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const functional = functionalRoleForSquad(squadRole);

  const { error } = await supabase.from("sttns_project_members").insert({
    project_id: projectId,
    user_id: userId,
    role: functional,
    project_role: squadRole,
  });

  if (error && !error.message.includes("duplicate")) {
    return { ok: false, error: error.message };
  }

  await supabase
    .from("sttns_project_members")
    .update({ project_role: squadRole })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (squadRole === "ceo_admin") {
    const { error: ceoErr } = await supabase.from("sttns_project_members").insert({
      project_id: projectId,
      user_id: userId,
      role: "ceo",
      project_role: "ceo_admin",
    });
    if (ceoErr && !ceoErr.message.includes("duplicate")) {
      return { ok: false, error: ceoErr.message };
    }
  }

  return { ok: true };
}

export async function updateMemberSquadRole(
  supabase: SupabaseClient,
  projectId: string,
  userId: string,
  squadRole: SttnsSquadProjectRole
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: rows } = await supabase
    .from("sttns_project_members")
    .select("id")
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (!rows?.length) {
    return { ok: false, error: "Membre introuvable." };
  }

  const { error } = await supabase
    .from("sttns_project_members")
    .update({ project_role: squadRole })
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };

  if (squadRole === "ceo_admin") {
    const { error: ceoErr } = await supabase.from("sttns_project_members").insert({
      project_id: projectId,
      user_id: userId,
      role: "ceo",
      project_role: "ceo_admin",
    });
    if (ceoErr && !ceoErr.message.includes("duplicate")) {
      return { ok: false, error: ceoErr.message };
    }
  }

  return { ok: true };
}
