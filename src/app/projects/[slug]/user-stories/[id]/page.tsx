import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { getProjectSquadRole } from "@/lib/sttns/access";
import { fetchProjectMembersGrouped } from "@/lib/sttns/projectMembers";
import { getWorkItem, readMetadataDescription } from "@/lib/sttns/workItems";
import { readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import {
  fetchStoryFeatureOptions,
  fetchStoryCycleOptions,
  fetchStoryTasks,
} from "@/lib/sttns/storiesSpine";
import { UserStoryForm } from "@/components/execution/UserStoryForm";
import { StoryTasksPanel } from "@/components/execution/StoryTasksPanel";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";
import { SpineDescriptionViewer } from "@/components/ui/SpineDescriptionField";
import { formatEffortDays, readComplexity, readEffortDays } from "@/lib/sttns/valueEffort";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function UserStoryDetailPage({ params }: Props) {
  const { slug, id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  if (isFeatureExecutionMode(workflow)) {
    redirect(`/projects/${slug}/kanban`);
  }

  const result = await getWorkItem(id);
  if (!result.ok || !result.item || result.item.type !== "story") {
    notFound();
  }
  if (result.item.project_id !== project.id) {
    notFound();
  }

  const item = result.item;
  const squad = await getProjectSquadRole(project.id, user.id);
  const readOnly = squad === "viewer";
  const projectMembers = (await fetchProjectMembersGrouped(project.id)).map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));

  const [features, cycles, tasks] = await Promise.all([
    fetchStoryFeatureOptions(supabase, project.id),
    fetchStoryCycleOptions(supabase, project.id),
    fetchStoryTasks(supabase, id),
  ]);

  const featureInfo = features.find((f) => f.id === item.parent_id);
  const storyDescription = readMetadataDescription(item.metadata);
  const effort = readEffortDays(item.metadata);
  const complexity = readComplexity(item.metadata);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title={item.title}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            <span>Feature : {featureInfo?.title ?? "Sans Feature"}</span>
            {featureInfo?.epicTitle && (
              <>
                <span>·</span>
                <span>Epic : {featureInfo.epicTitle}</span>
              </>
            )}
            <span>·</span>
            <StatusPill status={item.status as StatusType} />
            {effort != null && (
              <>
                <span>·</span>
                <span>{formatEffortDays(effort)}</span>
                {complexity === 3 && <span className="text-warning">· R:3</span>}
              </>
            )}
          </span>
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.userStoryDetail,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link
            href={`/projects/${slug}/user-stories`}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            Stories Backlogs
          </Link>
        }
      />

      {storyDescription && (
        <SpineDescriptionViewer content={storyDescription} className="max-w-3xl" />
      )}

      <div className="max-w-2xl space-y-6">
        <UserStoryForm
          projectId={project.id}
          projectSlug={slug}
          features={features}
          cycles={cycles}
          projectMembers={projectMembers}
          initial={{
            id: item.id,
            title: item.title,
            description: readMetadataDescription(item.metadata) ?? "",
            doc_url: readMetadataDocUrl(item.metadata),
            feature_id: item.parent_id,
            cycle_id: item.cycle_id,
            effort_days: effort,
            complexity,
            metadata: item.metadata,
            status: item.status,
            assignee_id: item.assignee_id,
          }}
          readOnly={readOnly}
        />

        <StoryTasksPanel
          storyId={item.id}
          projectId={project.id}
          projectSlug={slug}
          initialTasks={tasks}
          projectMembers={projectMembers}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
}
