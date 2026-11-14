import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { fetchProjectMembersGrouped } from "@/lib/sttns/projectMembers";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import {
  fetchStoryCycleOptions,
  fetchStoryFeatureOptions,
} from "@/lib/sttns/storiesSpine";
import { readTaskNotionUrl } from "@/lib/sttns/schema";
import { readMetadataDescription } from "@/lib/sttns/workItems";
import { KanbanBoard } from "@/components/execution/KanbanBoard";
import { FeatureKanbanBoard } from "@/components/execution/FeatureKanbanBoard";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import Link from "next/link";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { readComplexity, readEffortDays, readImpact } from "@/lib/sttns/valueEffort";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cycle_id?: string }>;
}

export default async function KanbanPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cycle_id: cycleId } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);
  const featureMode = isFeatureExecutionMode(workflow);

  const [features, cycles, memberRows, editContext] = await Promise.all([
    fetchStoryFeatureOptions(supabase, project.id),
    fetchStoryCycleOptions(supabase, project.id),
    fetchProjectMembersGrouped(project.id),
    fetchSpineEditContext(supabase, project.id),
  ]);

  const projectMembers = memberRows.map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));

  if (featureMode) {
    const { data: featureRows } = await supabase
      .from("sttns_work_items")
      .select(`
        id,
        title,
        status,
        cycle_id,
        parent_id,
        assignee_id,
        metadata,
        sttns_cycles(id, name)
      `)
      .eq("project_id", project.id)
      .eq("type", "feature")
      .is("archived_at", null)
      .order("sort_order", { ascending: true });

    const { data: epics } = await supabase
      .from("sttns_work_items")
      .select("id, title")
      .eq("project_id", project.id)
      .eq("type", "epic")
      .is("archived_at", null);

    const epicMap = Object.fromEntries(epics?.map((e) => [e.id, e.title]) ?? []);

    const kanbanFeaturesAll =
      featureRows?.map((feature) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const cycleData = (feature as any).sttns_cycles?.[0];
        return {
          id: feature.id,
          title: feature.title,
          status: feature.status as "todo" | "in_progress" | "review" | "done",
          cycle_id: feature.cycle_id,
          cycle_name: cycleData?.name ?? null,
          epic_title: feature.parent_id ? epicMap[feature.parent_id] ?? "Epic inconnu" : "Sans epic",
          assignee_id: feature.assignee_id ?? null,
          impact: readImpact(feature.metadata),
        };
      }) ?? [];

    const kanbanFeatures = cycleId
      ? kanbanFeaturesAll.filter((f) => f.cycle_id === cycleId)
      : kanbanFeaturesAll;

    return (
      <div className="sttns-page-stack">
        <ProjectPageHero
          eyebrow={`Projet · ${project.slug}`}
          title="Exécution Kanban"
          count={kanbanFeatures.length}
          description={`Mode simplifié · features · WIP Limit = ${workflow.wipLimit}.`}
          contextHelp={{
            ...PAGE_CONTEXT_HELP.kanban,
            href: `/projects/${slug}/help/scoring`,
          }}
          actions={
            <>
              <Link
                href={`/projects/${slug}/cycles`}
                className="sttns-btn-secondary sttns-btn-sm"
              >
                <SpineObjectIcon type="cycle" className="h-4 w-4" />
                Cycles
              </Link>
              <Link
                href={`/projects/${slug}/features/new`}
                className="sttns-btn-primary sttns-btn-sm"
              >
                <SpineObjectIcon
                  type="feature"
                  className="h-4 w-4 text-primary-foreground"
                  colored={false}
                />
                Nouvelle Feature
              </Link>
            </>
          }
        />

        <FeatureKanbanBoard
          projectId={project.id}
          projectSlug={slug}
          features={kanbanFeatures}
          wipLimit={workflow.wipLimit}
          cycles={cycles}
          selectedCycleId={cycleId ?? null}
          epics={editContext.epics}
          jtbdOptions={editContext.jtbdOptions}
          featureOptions={editContext.features}
          featureExecutionMode
          epicEqualsCycle={workflow.epicEqualsCycle}
        />
      </div>
    );
  }

  const { data: stories } = await supabase
    .from("sttns_work_items")
    .select(`
      id,
      title,
      status,
      cycle_id,
      parent_id,
      metadata,
      assignee_id,
      sttns_cycles(id, name)
    `)
    .eq("project_id", project.id)
    .eq("type", "story")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  const { data: featuresRows } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id")
    .eq("project_id", project.id)
    .eq("type", "feature")
    .is("archived_at", null);

  const { data: epics } = await supabase
    .from("sttns_work_items")
    .select("id, title")
    .eq("project_id", project.id)
    .eq("type", "epic")
    .is("archived_at", null);

  const storyIds = stories?.map((s) => s.id) ?? [];
  const { data: taskRows } =
    storyIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title, status, assignee_id, metadata, parent_id")
          .in("parent_id", storyIds)
          .eq("type", "task")
          .is("archived_at", null)
          .order("created_at", { ascending: true })
      : { data: [] };

  const tasksByStory = new Map<
    string,
    {
      id: string;
      title: string;
      done: boolean;
      assignee_id: string | null;
      notion_url: string | null;
    }[]
  >();

  for (const row of taskRows ?? []) {
    if (!row.parent_id) continue;
    const preview = {
      id: row.id,
      title: row.title,
      done: row.status === "done",
      assignee_id: row.assignee_id ?? null,
      notion_url: readTaskNotionUrl(row.metadata),
    };
    const list = tasksByStory.get(row.parent_id) ?? [];
    list.push(preview);
    tasksByStory.set(row.parent_id, list);
  }

  const featureMap = Object.fromEntries(
    featuresRows?.map((f) => [f.id, { title: f.title, epicId: f.parent_id }]) ?? []
  );
  const epicMap = Object.fromEntries(epics?.map((e) => [e.id, e.title]) ?? []);

  const kanbanStoriesAll =
    stories?.map((story) => {
      const featureInfo = story.parent_id ? featureMap[story.parent_id] : null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cycleData = (story as any).sttns_cycles?.[0];
      return {
        id: story.id,
        title: story.title,
        status: story.status as "todo" | "in_progress" | "review" | "done",
        description: readMetadataDescription(story.metadata),
        effort_days: readEffortDays(story.metadata) ?? 0,
        complexity: readComplexity(story.metadata),
        cycle_id: story.cycle_id,
        cycle_name: cycleData?.name ?? null,
        feature_id: story.parent_id,
        feature_title: featureInfo?.title ?? "Feature inconnue",
        epic_title: featureInfo?.epicId ? epicMap[featureInfo.epicId] ?? "Epic inconnu" : "Epic inconnu",
        assignee_id: story.assignee_id ?? null,
        tasks: tasksByStory.get(story.id) ?? [],
      };
    }) ?? [];

  const kanbanStories = cycleId
    ? kanbanStoriesAll.filter((s) => s.cycle_id === cycleId)
    : kanbanStoriesAll;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Exécution Kanban"
        count={kanbanStories.length}
        description={`4 colonnes strictes · WIP Limit = ${workflow.wipLimit}.`}
        contextHelp={{
          ...PAGE_CONTEXT_HELP.kanban,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <>
            <Link
              href={`/projects/${slug}/cycles`}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              <SpineObjectIcon type="cycle" className="h-4 w-4" />
              Cycles
            </Link>
            <Link
              href={`/projects/${slug}/user-stories/new`}
              className="sttns-btn-primary sttns-btn-sm"
            >
              <SpineObjectIcon
                type="story"
                className="h-4 w-4 text-primary-foreground"
                colored={false}
              />
              Nouvelle Story
            </Link>
          </>
        }
      />

      <KanbanBoard
        projectId={project.id}
        projectSlug={slug}
        stories={kanbanStories}
        wipLimit={workflow.wipLimit}
        cycles={cycles}
        selectedCycleId={cycleId ?? null}
        features={features}
        projectMembers={projectMembers}
      />
    </div>
  );
}
