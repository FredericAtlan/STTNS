import { createClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/sttns/auth";
import { maxSquadRole } from "@/lib/sttns/squadRoles";
import {
  DRAFT_READONLY_MESSAGE,
  isEntityInDraftOwnership,
  type DraftEntityType,
} from "@/lib/sttns/draftOwnership";
import type {
  SttnsPlatformRole,
  SttnsProjectRole,
  SttnsReviewStatus,
  SttnsSquadProjectRole,
} from "@/types/sttns";

export type AccessResult =
  | { ok: true; userId: string }
  | { ok: false; error: string };

export async function requireAuth(): Promise<AccessResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };
  return { ok: true, userId: user.id };
}

export async function getProjectSquadRole(
  projectId: string,
  userId: string
): Promise<SttnsSquadProjectRole | null> {
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", userId)
    .single();

  if (isPlatformAdmin(profile as { platform_role: SttnsPlatformRole } | null)) {
    return "ceo_admin";
  }

  const { data } = await supabase
    .from("sttns_project_members")
    .select("project_role, role")
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (!data?.length) return null;

  const squadRoles = data.map((row) => {
    const pr = row.project_role as SttnsSquadProjectRole | null;
    if (pr) return pr;
    return row.role === "ceo" ? ("ceo_admin" as const) : ("editor" as const);
  });

  return maxSquadRole(squadRoles);
}

export async function isProjectCeoAdmin(projectId: string, userId: string): Promise<boolean> {
  const squad = await getProjectSquadRole(projectId, userId);
  return squad === "ceo_admin";
}

export async function requireProjectCeoAdmin(projectId: string): Promise<AccessResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const squad = await getProjectSquadRole(projectId, auth.userId);
  if (squad !== "ceo_admin") {
    return { ok: false, error: "Admin projet requis pour cette action." };
  }
  return auth;
}

export async function requireProjectEditor(projectId: string): Promise<AccessResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const squad = await getProjectSquadRole(projectId, auth.userId);
  if (!squad) {
    return { ok: false, error: "Not a member of this project." };
  }
  if (squad === "viewer") {
    return { ok: false, error: "Accès lecture seule — rôle Lecteur sur ce projet." };
  }
  return auth;
}

export async function requirePlatformAdmin(): Promise<AccessResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", auth.userId)
    .single();

  if (!isPlatformAdmin(profile as { platform_role: SttnsPlatformRole } | null)) {
    return { ok: false, error: "Platform admin required." };
  }
  return auth;
}

export async function isProjectMember(projectId: string, userId: string): Promise<boolean> {
  const squad = await getProjectSquadRole(projectId, userId);
  return squad !== null;
}

export async function requireProjectMember(projectId: string): Promise<AccessResult> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const member = await isProjectMember(projectId, auth.userId);
  if (!member) return { ok: false, error: "Not a member of this project." };
  return auth;
}

export async function getProjectRoles(
  projectId: string,
  userId: string
): Promise<SttnsProjectRole[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_members")
    .select("role")
    .eq("project_id", projectId)
    .eq("user_id", userId);

  return (data ?? []).map((r) => r.role as SttnsProjectRole);
}

export async function requireProjectRole(
  projectId: string,
  roles: SttnsProjectRole[]
): Promise<AccessResult & { roles: SttnsProjectRole[] }> {
  const auth = await requireProjectMember(projectId);
  if (!auth.ok) return { ...auth, roles: [] };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", auth.userId)
    .single();

  if (isPlatformAdmin(profile as { platform_role: SttnsPlatformRole } | null)) {
    const allRoles = await getProjectRoles(projectId, auth.userId);
    return { ok: true, userId: auth.userId, roles: allRoles };
  }

  const userRoles = await getProjectRoles(projectId, auth.userId);
  const hasRole = userRoles.some((r) => roles.includes(r));
  if (!hasRole) {
    return { ok: false, error: "Insufficient project role for this action.", roles: userRoles };
  }
  return { ok: true, userId: auth.userId, roles: userRoles };
}

/** Default project slug: first membership, else first active project, else marketchain. */
export async function resolveDefaultProjectSlug(userId: string): Promise<string> {
  const supabase = await createClient();

  const { data: membership } = await supabase
    .from("sttns_project_members")
    .select("project:sttns_projects(slug)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();

  const fromMember = membership?.project as { slug: string } | { slug: string }[] | null;
  const slug = Array.isArray(fromMember) ? fromMember[0]?.slug : fromMember?.slug;
  if (slug) return slug;

  const { data: projects } = await supabase
    .from("sttns_projects")
    .select("slug")
    .eq("is_active", true)
    .order("name")
    .limit(1);

  return projects?.[0]?.slug ?? "marketchain";
}

type DraftAuthorRow = {
  created_by: string | null;
  review_status?: string | null;
  status?: string | null;
};

const DRAFT_TABLES: Record<
  Exclude<DraftEntityType, "initiative">,
  string
> = {
  persona: "sttns_personas",
  user_story: "sttns_user_stories",
  epic: "sttns_epics",
};

/** Bloque la modification / soumission d'un brouillon par un non-auteur. */
export async function requireDraftAuthor(
  projectId: string,
  entityType: Exclude<DraftEntityType, "initiative">,
  entityId: string
): Promise<AccessResult & { createdBy: string | null }> {
  const auth = await requireProjectEditor(projectId);
  if (!auth.ok) return { ...auth, createdBy: null };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", auth.userId)
    .single();

  if (isPlatformAdmin(profile as { platform_role: SttnsPlatformRole } | null)) {
    return { ok: true, userId: auth.userId, createdBy: auth.userId };
  }

  const table = DRAFT_TABLES[entityType];
  const { data: row } = await supabase
    .from(table)
    .select("created_by, review_status, status")
    .eq("id", entityId)
    .eq("project_id", projectId)
    .single();

  if (!row) {
    return { ok: false, error: "Élément introuvable.", createdBy: null };
  }

  const typed = row as DraftAuthorRow;
  const createdBy = typed.created_by;
  const inDraft = isEntityInDraftOwnership(entityType, {
    reviewStatus: typed.review_status as SttnsReviewStatus | null,
    status: typed.status,
  });

  if (inDraft && createdBy && createdBy !== auth.userId) {
    return { ok: false, error: DRAFT_READONLY_MESSAGE, createdBy };
  }

  return { ok: true, userId: auth.userId, createdBy };
}

export async function requireInitiativeCreator(
  projectId: string,
  initiativeId: string
): Promise<AccessResult & { createdBy: string | null }> {
  const auth = await requireProjectEditor(projectId);
  if (!auth.ok) return { ...auth, createdBy: null };

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", auth.userId)
    .single();

  if (isPlatformAdmin(profile as { platform_role: SttnsPlatformRole } | null)) {
    return { ok: true, userId: auth.userId, createdBy: auth.userId };
  }

  const { data: init } = await supabase
    .from("sttns_initiatives")
    .select("created_by, review_status")
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .single();

  if (!init) return { ok: false, error: "Feature introuvable.", createdBy: null };

  const createdBy = init.created_by as string | null;
  if (!createdBy) return { ok: true, userId: auth.userId, createdBy: null };

  if (createdBy !== auth.userId) {
    return {
      ok: false,
      error: DRAFT_READONLY_MESSAGE,
      createdBy,
    };
  }

  return { ok: true, userId: auth.userId, createdBy };
}
