import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { fetchProjectEpics } from "@/lib/sttns/epics";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { NorthStarMetricsSection } from "@/components/project/NorthStarMetricsSection";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import type { SttnsProjectMetric, SttnsUserStory } from "@/types/sttns";
import Link from "next/link";

import { CsvSectionActions } from "@/components/csv/CsvSectionActions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectNsmPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const [{ data: metrics }, { data: storiesRaw }, epics] = await Promise.all([
    supabase
      .from("sttns_project_metrics")
      .select("id, parent_id, name, description, sort_order, legacy_key, project_id, created_at, updated_at")
      .eq("project_id", project.id)
      .order("sort_order"),
    supabase
      .from("sttns_user_stories")
      .select("id, title, context_label, epic_id, impacts_north_star, impact_metric_id, status")
      .eq("project_id", project.id)
      .is("archived_at", null)
      .order("sort_order"),
    fetchProjectEpics(supabase, project.id),
  ]);

  const stories = (storiesRaw ?? []) as Pick<
    SttnsUserStory,
    | "id"
    | "title"
    | "context_label"
    | "epic_id"
    | "impacts_north_star"
    | "impact_metric_id"
    | "status"
  >[];

  const storiesForCoverage = stories.map((s) => ({
    id: s.id,
    title: s.title,
    context_label: s.context_label,
    epic_id: s.epic_id,
    impacts_north_star: s.impacts_north_star,
    impact_metric_id: s.impact_metric_id,
    status: s.status,
  }));

  const epicsForCoverage = epics
    .filter((e) => !e.archived_at)
    .map((e) => ({ id: e.id, title: e.title }));

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="North Star Metric"
        description="Boussole produit — arbre NSM et couverture par les stories validées."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.nsm,
          href: `/projects/${slug}/help/framework`,
        }}
        actions={
          <>
            <CsvSectionActions projectId={project.id} entity="nsm" entityName="NSM" />
            <Link
              href={`/projects/${slug}/north-star/edit`}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              Modifier
            </Link>
          </>
        }
      />

      <NorthStarMetricsSection
        project={project}
        metrics={(metrics ?? []) as SttnsProjectMetric[]}
        projectSlug={slug}
        embedded
        storiesForCoverage={storiesForCoverage}
        epicsForCoverage={epicsForCoverage}
      />
    </div>
  );
}
