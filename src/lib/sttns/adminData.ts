import { createClient } from "@/lib/supabase/server";
import { readImpact } from "@/lib/sttns/valueEffort";
import type { SttnsProject, SttnsProjectInvite, SttnsProfile } from "@/types/sttns";

export interface AdminUserRow extends SttnsProfile {
  memberships: { project_id: string; project_name: string; project_slug: string; role: string }[];
}

export interface AdminProjectRow extends Pick<SttnsProject, "id" | "slug" | "name" | "is_active"> {
  member_count: number;
  pending_invites: number;
}

export interface AdminInviteRow extends SttnsProjectInvite {
  project_name: string;
  project_slug: string;
}

export async function fetchAdminStats() {
  const supabase = await createClient();
  const [
    { count: users },
    { count: admins },
    { count: projects },
    { count: pendingInvites },
    { count: openTasks },
  ] = await Promise.all([
    supabase.from("sttns_profiles").select("*", { count: "exact", head: true }),
    supabase.from("sttns_profiles").select("*", { count: "exact", head: true }).eq("platform_role", "admin"),
    supabase.from("sttns_projects").select("*", { count: "exact", head: true }),
    supabase.from("sttns_project_invites").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("sttns_user_tasks").select("*", { count: "exact", head: true }).eq("status", "open"),
  ]);

  return {
    users: users ?? 0,
    admins: admins ?? 0,
    projects: projects ?? 0,
    pendingInvites: pendingInvites ?? 0,
    openTasks: openTasks ?? 0,
  };
}

/** Taux de remplissage moyen sur les entités clés (profils nommés, stories avec effort). */
export async function fetchDatabaseFillRate(): Promise<number> {
  const supabase = await createClient();
  const [
    { count: totalProfiles },
    { count: namedProfiles },
    { count: totalStories },
    { count: storiesWithEffort },
  ] = await Promise.all([
    supabase.from("sttns_profiles").select("*", { count: "exact", head: true }),
    supabase
      .from("sttns_profiles")
      .select("*", { count: "exact", head: true })
      .not("full_name", "is", null)
      .neq("full_name", ""),
    supabase
      .from("sttns_work_items")
      .select("*", { count: "exact", head: true })
      .eq("type", "story")
      .is("archived_at", null),
    supabase
      .from("sttns_work_items")
      .select("*", { count: "exact", head: true })
      .eq("type", "story")
      .is("archived_at", null)
      .not("effort_points", "is", null)
      .gt("effort_points", 0),
  ]);

  const rates: number[] = [];
  if (totalProfiles && totalProfiles > 0) {
    rates.push(((namedProfiles ?? 0) / totalProfiles) * 100);
  }
  if (totalStories && totalStories > 0) {
    rates.push(((storiesWithEffort ?? 0) / totalStories) * 100);
  }

  if (rates.length === 0) return 0;
  return Math.round(rates.reduce((sum, rate) => sum + rate, 0) / rates.length);
}

export async function fetchAdminUsers(): Promise<AdminUserRow[]> {
  const supabase = await createClient();
  const [{ data: profiles }, { data: members }] = await Promise.all([
    supabase
      .from("sttns_profiles")
      .select("id, full_name, email, avatar_url, platform_role")
      .order("full_name"),
    supabase.from("sttns_project_members").select("user_id, role, project_id, project:sttns_projects(name, slug)"),
  ]);

  const byUser = new Map<string, AdminUserRow>();

  for (const p of profiles ?? []) {
    byUser.set(p.id, {
      ...(p as SttnsProfile),
      memberships: [],
    });
  }

  for (const m of members ?? []) {
    const row = byUser.get(m.user_id);
    if (!row) continue;
    const proj = m.project as { name: string; slug: string } | { name: string; slug: string }[] | null;
    const p = Array.isArray(proj) ? proj[0] : proj;
    if (!p) continue;
    row.memberships.push({
      project_id: m.project_id,
      project_name: p.name,
      project_slug: p.slug,
      role: m.role,
    });
  }

  return Array.from(byUser.values());
}

export async function fetchAdminProjects(): Promise<AdminProjectRow[]> {
  const supabase = await createClient();
  const { data: projects } = await supabase
    .from("sttns_projects")
    .select("id, slug, name, is_active")
    .order("name");

  const rows: AdminProjectRow[] = [];
  for (const p of projects ?? []) {
    const [{ count: memberCount }, { count: inviteCount }] = await Promise.all([
      supabase
        .from("sttns_project_members")
        .select("*", { count: "exact", head: true })
        .eq("project_id", p.id),
      supabase
        .from("sttns_project_invites")
        .select("*", { count: "exact", head: true })
        .eq("project_id", p.id)
        .eq("status", "pending"),
    ]);
    rows.push({
      ...p,
      member_count: memberCount ?? 0,
      pending_invites: inviteCount ?? 0,
    });
  }
  return rows;
}

export async function fetchAdminInvites(): Promise<AdminInviteRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_invites")
    .select("*, project:sttns_projects(name, slug)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row) => {
    const proj = row.project as { name: string; slug: string } | null;
    const { project: _, ...invite } = row;
    return {
      ...(invite as SttnsProjectInvite),
      project_name: proj?.name ?? "—",
      project_slug: proj?.slug ?? "",
    };
  });
}

export interface GlobalHygieneSummary {
  orphanFeatures: number;
  stagnantStories: number;
  /** Features Impact 0 (Gaspillage) — remplace l'ancien compteur Epics RICE faible. */
  lowRiceEpics: number;
  activeProjects: number;
}

export async function fetchGlobalHygieneSummary(): Promise<GlobalHygieneSummary> {
  const supabase = await createClient();

  const [{ count: activeProjects }, { data: features }] = await Promise.all([
    supabase
      .from("sttns_projects")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true),
    supabase
      .from("sttns_work_items")
      .select("id, metadata")
      .eq("type", "feature")
      .is("archived_at", null),
  ]);

  const featureIds = features?.map((f) => f.id) ?? [];
  const wasteFeatures =
    features?.filter((f) => readImpact(f.metadata) === 0).length ?? 0;

  let orphanFeatures = 0;
  if (featureIds.length > 0) {
    const { data: jobLinks } = await supabase
      .from("sttns_context_links")
      .select("work_item_id")
      .in("work_item_id", featureIds)
      .eq("context_type", "job");

    const linked = new Set(jobLinks?.map((l) => l.work_item_id) ?? []);
    orphanFeatures = featureIds.filter((id) => !linked.has(id)).length;
  }

  const fiveDaysAgo = new Date();
  fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

  const { count: stagnantStories } = await supabase
    .from("sttns_work_items")
    .select("*", { count: "exact", head: true })
    .eq("type", "story")
    .in("status", ["in_progress", "review"])
    .lt("updated_at", fiveDaysAgo.toISOString())
    .is("archived_at", null);

  return {
    orphanFeatures,
    stagnantStories: stagnantStories ?? 0,
    lowRiceEpics: wasteFeatures,
    activeProjects: activeProjects ?? 0,
  };
}

export async function fetchAdminProfilesList(): Promise<SttnsProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_profiles")
    .select("id, full_name, email, avatar_url, platform_role")
    .order("full_name");
  return (data ?? []) as SttnsProfile[];
}
