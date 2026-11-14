"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, requireProjectMember } from "@/lib/sttns/access";
import {
  fetchProjectMembersGrouped,
  mapMemberRowsToSquadPreviews,
  type ProjectSquadMemberPreview,
} from "@/lib/sttns/projectMembers";
import { seedPersonaVocabularyForProject } from "@/lib/personas/personaVocabulary";
import type { SttnsProject } from "@/types/sttns";

export async function createProjectAction(data: {
  name: string;
  slug: string;
  description: string | null;
  nsm_label: string;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const name = data.name.trim();
  const slug = data.slug.trim().toLowerCase();
  if (!name || !slug) return { ok: false, error: "Name and slug are required." };
  if (slug === "new") return { ok: false, error: "Slug 'new' is reserved." };

  const supabase = await createClient();
  const { data: project, error: err } = await supabase
    .from("sttns_projects")
    .insert({
      name,
      slug,
      description: data.description?.trim() || null,
      nsm_label: data.nsm_label.trim() || "North Star to define",
      nsm_description: null,
    })
    .select("id, slug")
    .single();

  if (err || !project) {
    return { ok: false, error: err?.message ?? "Could not create project." };
  }

  const { error: memberErr } = await supabase.from("sttns_project_members").insert({
    project_id: project.id,
    user_id: auth.userId,
    role: "ceo",
  });

  if (memberErr) {
    return { ok: false, error: memberErr.message };
  }

  await supabase.from("sttns_modules").insert([
    { code: "platform", name: "Platform", sort_order: 1, project_id: project.id },
    { code: "core", name: "Core business", sort_order: 2, project_id: project.id },
  ]);

  await seedPersonaVocabularyForProject(supabase, project.id);

  revalidatePath("/");
  revalidatePath(`/projects/${project.slug}/summary`);
  return { ok: true, slug: project.slug };
}

export async function duplicateProjectAction(
  projectId: string
): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data: project, error } = await supabase
    .from("sttns_projects")
    .select("*")
    .eq("id", projectId)
    .single();
  if (error || !project) return { ok: false, error: error?.message ?? "Project not found." };

  const base = project as SttnsProject;
  const slug = `${base.slug}-copy-${Date.now().toString(36)}`;
  const name = `${base.name} Copy`;

  const { data: newId, error: rpcErr } = await supabase.rpc("sttns_duplicate_project", {
    source_id: projectId,
    new_slug: slug,
    new_name: name,
    creator_id: auth.userId,
  });

  if (rpcErr || !newId) {
    return { ok: false, error: rpcErr?.message ?? "Could not duplicate project." };
  }

  revalidatePath("/", "layout");
  revalidatePath("/");
  revalidatePath(`/projects/${slug}/summary`);
  return { ok: true, slug };
}

export async function archiveProjectAction(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sttns_projects")
    .update({ is_active: false })
    .eq("id", projectId)
    .select();

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) {
    return { ok: false, error: "Project not found or you don't have permission to archive it." };
  }
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function renameProjectAction(
  projectId: string,
  newName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const { isProjectCeoAdmin } = await import("@/lib/sttns/access");
  const isCeo = await isProjectCeoAdmin(projectId, auth.userId);
  if (!isCeo) {
    return { ok: false, error: "Only the project CEO or a platform admin can rename a project." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_projects")
    .update({ name: newName.trim() })
    .eq("id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteProjectAction(
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  // We need to use the service client or an RPC because the RLS policy for DELETE on sttns_projects
  // is restricted to platform admins only: USING (sttns_is_platform_admin())
  // However, a project CEO should be able to delete their own project.
  // We'll check if the user is CEO, and if so, use the service client to bypass RLS.
  const { isProjectCeoAdmin } = await import("@/lib/sttns/access");
  const isCeo = await isProjectCeoAdmin(projectId, auth.userId);
  
  if (!isCeo) {
    return { ok: false, error: "Only the project CEO or a platform admin can delete a project." };
  }

  const { createServiceClient } = await import("@/lib/supabase/server");
  const serviceClient = createServiceClient();
  
  if (!serviceClient) {
    return { ok: false, error: "Server configuration error: Service role key missing." };
  }

  const { error } = await serviceClient.from("sttns_projects").delete().eq("id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/");
  return { ok: true };
}

export type { ProjectSquadMemberPreview };

export async function fetchProjectSquadMembersAction(
  projectId: string
): Promise<
  { ok: true; members: ProjectSquadMemberPreview[] } | { ok: false; error: string }
> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const rows = await fetchProjectMembersGrouped(projectId);
  return {
    ok: true,
    members: mapMemberRowsToSquadPreviews(rows),
  };
}
