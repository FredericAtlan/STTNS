import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { getProjectSquadRole, isProjectMember } from "@/lib/sttns/access";
import { projectHomePath } from "@/lib/sttns/paths";
import {
  fetchProjectMembersGrouped,
  fetchProjectPendingInvites,
} from "@/lib/sttns/projectMembers";
import { fetchProjectSettingsAudit } from "@/lib/sttns/projectSettingsAudit";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { ProjectSettingsNav, type ProjectSettingsTab } from "@/components/settings/ProjectSettingsNav";
import { ProjectGeneralPanel } from "@/components/settings/ProjectGeneralPanel";
import { ProjectGovernancePanel } from "@/components/settings/ProjectGovernancePanel";
import { ProjectTeamPanel } from "@/components/settings/ProjectTeamPanel";
import { ProjectDangerZone } from "@/components/settings/ProjectDangerZone";
import { ProjectSettingsAuditPanel } from "@/components/settings/ProjectSettingsAuditPanel";
import { ProjectArchivesPanel } from "@/components/settings/ProjectArchivesPanel";
import { SquadRoleBadge } from "@/components/settings/SquadRoleBadge";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

function resolveTab(tab?: string): ProjectSettingsTab {
  if (tab === "governance" || tab === "team" || tab === "danger" || tab === "archives") return tab;
  return "general";
}

export default async function ProjectSettingsPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab: tabParam } = await searchParams;
  const activeTab = resolveTab(tabParam);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const isMember = await isProjectMember(project.id, user.id);
  if (!isMember) {
    redirect(projectHomePath(slug));
  }

  const squadRole = await getProjectSquadRole(project.id, user.id);
  const canEdit = squadRole === "ceo_admin";

  const workflowSettings = parseProjectWorkflowSettings(project.settings);

  const [members, pendingInvites, auditEntries] = await Promise.all([
    fetchProjectMembersGrouped(project.id),
    fetchProjectPendingInvites(project.id),
    fetchProjectSettingsAudit(project.id),
  ]);

  let archivedItems: Array<{
    id: string;
    title: string;
    type: "story" | "epic" | "feature" | "cycle";
    table: "sttns_work_items" | "sttns_cycles";
    archivedAt?: string | null;
  }> = [];

  if (activeTab === "archives") {
    const [workItemsRes, cyclesRes] = await Promise.all([
      supabase
        .from("sttns_work_items")
        .select("id, title, type, archived_at")
        .eq("project_id", project.id)
        .not("archived_at", "is", null)
        .in("type", ["story", "epic", "feature"]),
      supabase
        .from("sttns_cycles")
        .select("id, name, is_active, start_date")
        .eq("project_id", project.id)
        .eq("is_active", false),
    ]);

    const workItems = (workItemsRes.data ?? []).map((item) => ({
      id: item.id,
      title: item.title,
      type: item.type as "story" | "epic" | "feature",
      table: "sttns_work_items" as const,
      archivedAt: item.archived_at,
    }));

    const cycles = (cyclesRes.data ?? []).map((cycle) => ({
      id: cycle.id,
      title: cycle.name,
      type: "cycle" as const,
      table: "sttns_cycles" as const,
      archivedAt: cycle.start_date,
    }));

    archivedItems = [...workItems, ...cycles];
  }

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Paramètres"
        description={
          canEdit ? (
            "Gouvernance Squad — admin projet, workflow et équipe."
          ) : (
            <>
              Consultation des paramètres — votre accès :{" "}
              {squadRole && <SquadRoleBadge role={squadRole} className="align-middle" />}
            </>
          )
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.settings,
          href: `/projects/${slug}/help/application`,
        }}
      />

      <ProjectSettingsNav projectSlug={slug} activeTab={activeTab} />

      {activeTab === "general" && (
        <ProjectGeneralPanel
          projectId={project.id}
          projectSlug={slug}
          initialName={project.name}
          initialDescription={project.description}
          canEdit={canEdit}
        />
      )}

      {activeTab === "governance" && (
        <ProjectGovernancePanel
          projectId={project.id}
          projectSlug={slug}
          initial={workflowSettings}
          canEdit={canEdit}
        />
      )}

      {activeTab === "team" && (
        <ProjectTeamPanel
          projectId={project.id}
          projectSlug={slug}
          projectName={project.name}
          members={members}
          pendingInvites={pendingInvites}
          canEdit={canEdit}
          currentUserId={user.id}
        />
      )}

      {activeTab === "archives" && (
        <ProjectArchivesPanel
          projectId={project.id}
          projectSlug={slug}
          archivedItems={archivedItems}
          squadRole={squadRole}
        />
      )}

      {activeTab === "danger" && (
        <ProjectDangerZone
          projectId={project.id}
          projectSlug={slug}
          projectName={project.name}
          canEdit={canEdit}
        />
      )}

      <ProjectSettingsAuditPanel entries={auditEntries} />
    </div>
  );
}
