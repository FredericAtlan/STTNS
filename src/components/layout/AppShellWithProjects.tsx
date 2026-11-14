import { AppShell } from "@/components/layout/AppShell";
import { bootstrapProjectAccess } from "@/lib/sttns/bootstrapProjectAccess";
import { isPlatformAdmin } from "@/lib/sttns/auth";
import { fetchSquadPreviewsByProjectIds } from "@/lib/sttns/projectMembers";
import { getAllProjects, getArchivedProjects } from "@/lib/sttns/projects";
import { countOpenTasks } from "@/lib/sttns/tasks";
import { createClient } from "@/lib/supabase/server";
import type { SttnsProfile, SttnsProjectMember, SttnsProject } from "@/types/sttns";
import { unstable_noStore as noStore } from "next/cache";

export async function AppShellWithProjects({
  children,
}: {
  children: React.ReactNode;
}) {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAdmin = false;
  let userProfile: SttnsProfile | null = null;
  if (user) {
    await bootstrapProjectAccess(user);

    const { data: profile } = await supabase
      .from("sttns_profiles")
      .select("id, full_name, email, avatar_url, platform_role")
      .eq("id", user.id)
      .single();
    userProfile = profile as SttnsProfile | null;
    isAdmin = isPlatformAdmin(profile);
  }

  const projects = user ? await getAllProjects() : [];
  const archivedProjects = user ? await getArchivedProjects() : [];
  const openTaskCount = user ? await countOpenTasks(user.id) : 0;

  const squadPreviewsByProjectId = user
    ? await fetchSquadPreviewsByProjectIds([
        ...projects.map((p) => p.id),
        ...archivedProjects.map((p) => p.id),
      ])
    : {};

  // Get current project from pathname for membership info
  // We can't access pathname in server component, so we'll pass projects and let client handle it
  // But we can fetch all memberships for this user across all projects
  let userMemberships: SttnsProjectMember[] = [];
  if (user) {
    const { data: memberships } = await supabase
      .from("sttns_project_members")
      .select("id, project_id, user_id, role, created_at")
      .eq("user_id", user.id);
    userMemberships = (memberships ?? []) as SttnsProjectMember[];
  }

  // Create a map of project_id -> role for quick lookup
  const projectRoles = new Map<string, string>();
  for (const m of userMemberships) {
    projectRoles.set(m.project_id, m.role);
  }

  // Also create a map for validation_mode lookup
  const projectValidationModes = new Map<string, SttnsProject["validation_mode"]>();
  for (const p of projects) {
    projectValidationModes.set(p.id, p.validation_mode ?? "peer_ceo");
  }

  return (
    <AppShell
      projects={projects}
      archivedProjects={archivedProjects}
      openTaskCount={openTaskCount}
      isPlatformAdmin={isAdmin}
      userProfile={userProfile}
      projectRoles={projectRoles}
      projectValidationModes={projectValidationModes}
      squadPreviewsByProjectId={squadPreviewsByProjectId}
    >
      {children}
    </AppShell>
  );
}
