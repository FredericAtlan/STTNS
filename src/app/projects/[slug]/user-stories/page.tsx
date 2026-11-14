import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { fetchProjectMembersGrouped } from "@/lib/sttns/projectMembers";
import { enrichCycleRow, type CycleRow } from "@/lib/sttns/cycles";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { SpineStoriesCatalog } from "@/components/userStories/SpineStoriesCatalog";
import { ExecutionBacklogKpis } from "@/components/execution/ExecutionBacklogKpis";
import {
  fetchSpineStories,
  computeExecutionBacklogMetrics,
  fetchStoryFeatureOptions,
  fetchStoryCycleOptions,
} from "@/lib/sttns/storiesSpine";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { CsvSectionActions } from "@/components/csv/CsvSectionActions";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ cycle_id?: string }>;
}

export default async function UserStoriesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { cycle_id: cycleId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  if (isFeatureExecutionMode(workflow)) {
    const target = cycleId
      ? `/projects/${slug}/kanban?cycle_id=${cycleId}`
      : `/projects/${slug}/kanban`;
    redirect(target);
  }

  let activeCycle: CycleRow | null = null;
  if (cycleId) {
    const { data: cycleRaw, error } = await supabase
      .from("sttns_cycles")
      .select("id, name, start_date, end_date, is_active, capacity_points")
      .eq("id", cycleId)
      .eq("project_id", project.id)
      .maybeSingle();

    if (error || !cycleRaw) {
      notFound();
    }

    activeCycle = enrichCycleRow({
      id: cycleRaw.id,
      name: cycleRaw.name,
      start_date: cycleRaw.start_date,
      end_date: cycleRaw.end_date,
      is_active: cycleRaw.is_active ?? false,
      capacity_points: cycleRaw.capacity_points ?? 0,
    });
  }

  const [stories, features, cycles, memberRows] = await Promise.all([
    fetchSpineStories(supabase, project.id),
    fetchStoryFeatureOptions(supabase, project.id),
    fetchStoryCycleOptions(supabase, project.id),
    fetchProjectMembersGrouped(project.id),
  ]);

  const projectMembers = memberRows.map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));

  const metrics = computeExecutionBacklogMetrics(stories);
  const base = `/projects/${slug}`;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title={activeCycle ? activeCycle.name : "Stories Backlogs"}
        count={activeCycle ? stories.filter((s) => s.cycleId === activeCycle.id).length : stories.length}
        description={
          activeCycle
            ? `Cycle actif — planification et charge d'exécution.`
            : "Exécution Spine — vélocité en jours, Risque (R:1–3) et hygiène du backlog."
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.userStories,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <>
            <CsvSectionActions
              projectId={project.id}
              entity="user_stories"
              entityName="User Stories"
            />
            <Link
              href={`${base}/user-stories/new`}
              className="sttns-btn-primary sttns-btn-sm"
            >
              <SpineObjectIcon
                type="story"
                className="h-4 w-4 text-primary-foreground"
                colored={false}
              />
              Nouvelle story
            </Link>
          </>
        }
      />

      <ExecutionBacklogKpis metrics={metrics} />

      <SpineStoriesCatalog
        projectId={project.id}
        projectSlug={slug}
        rows={stories}
        features={features}
        cycles={cycles}
        projectMembers={projectMembers}
        initialCycleId={cycleId ?? null}
        activeCycle={activeCycle}
      />
    </div>
  );
}
