import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { getWorkItem } from "@/lib/sttns/workItems";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import { readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import { readFeatureDescription } from "@/lib/sttns/featuresSpine";
import {
  calculateFeatureDays,
  countRiskyUnits,
  readComplexity,
  readEffortDays,
  readImpact,
} from "@/lib/sttns/valueEffort";
import { mapStoryChild } from "@/lib/sttns/spineChildren";
import type { WorkItemStatus } from "@/lib/sttns/types";
import { FeatureInspectorPage } from "@/components/spine/FeatureInspectorPage";
import { featuresPath } from "@/lib/sttns/paths";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ from?: string }>;
}

export default async function FeatureDetailPage({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { from } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);
  const featureMode = isFeatureExecutionMode(workflow);

  const result = await getWorkItem(id);
  if (!result.ok || !result.item || result.item.type !== "feature") {
    notFound();
  }
  if (result.item.project_id !== project.id) {
    notFound();
  }

  const item = result.item;
  const jobLink = item.context_links?.find((link) => link.type === "job");

  const [{ data: storyRows }, editContext] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, title, status, metadata, assignee_id, parent_id")
      .eq("parent_id", item.id)
      .eq("type", "story")
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
    fetchSpineEditContext(supabase, project.id),
  ]);

  const stories = (storyRows ?? []).map((s) =>
    mapStoryChild({
      id: s.id,
      title: s.title,
      status: s.status,
      parent_id: s.parent_id,
      metadata: s.metadata,
      assignee_id: s.assignee_id,
    })
  );
  const storyMetas = (storyRows ?? []).map((s) => s.metadata);
  const childStoryCount = stories.length;
  const rollupDays = calculateFeatureDays(item.metadata, storyMetas);
  const riskyCount = countRiskyUnits(item.metadata, storyMetas);

  let epicTitle: string | null = null;
  if (item.parent_id) {
    const { data: epicRow } = await supabase
      .from("sttns_work_items")
      .select("title")
      .eq("id", item.parent_id)
      .maybeSingle();
    epicTitle = epicRow?.title ?? null;
  }

  const status = (["todo", "in_progress", "review", "done"] as const).includes(
    item.status as WorkItemStatus
  )
    ? (item.status as WorkItemStatus)
    : "todo";

  const backHref =
    from === "arbitrage" ? featuresPath(slug, "arbitrage") : featuresPath(slug);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title={item.title}
        description="Inspecteur Feature — Stories rattachées, Impact et roll-up (même panneau que l'Arbre)."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.featureDetail,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link href={backHref} className="sttns-btn-secondary sttns-btn-sm">
            Retour
          </Link>
        }
      />

      <FeatureInspectorPage
        projectId={project.id}
        projectSlug={slug}
        editContext={editContext}
        featureExecutionMode={featureMode}
        epicEqualsCycle={workflow.epicEqualsCycle === true}
        feature={{
          id: item.id,
          title: item.title,
          description: readFeatureDescription(item.metadata) ?? undefined,
          doc_url: readMetadataDocUrl(item.metadata),
          status,
          epic_id: item.parent_id,
          epicTitle,
          cycle_id: item.cycle_id,
          linked_jtbd_id: jobLink?.context_id ?? null,
          impact: readImpact(item.metadata),
          effort_days: readEffortDays(item.metadata),
          complexity: readComplexity(item.metadata),
          childStoryCount,
          rollupDays,
          riskyCount,
          stories,
        }}
      />
    </div>
  );
}
