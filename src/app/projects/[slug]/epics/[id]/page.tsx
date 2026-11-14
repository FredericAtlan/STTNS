import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { readMetadataDescription, readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import {
  buildEpicFeatureChildren,
  countStoriesInFeatures,
} from "@/lib/sttns/spineChildren";
import { calculateEpicRollup } from "@/lib/sttns/valueEffort";
import type { WorkItemStatus } from "@/lib/sttns/types";
import { EpicInspectorPage } from "@/components/spine/EpicInspectorPage";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditEpicPage({ params }: Props) {
  const { slug, id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  const { data: epic } = await supabase
    .from("sttns_work_items")
    .select("*")
    .eq("id", id)
    .eq("project_id", project.id)
    .eq("type", "epic")
    .single();

  if (!epic) notFound();

  const [{ data: features }, editContext] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, title, status, metadata")
      .eq("project_id", project.id)
      .eq("type", "feature")
      .eq("parent_id", epic.id)
      .is("archived_at", null)
      .order("sort_order", { ascending: true }),
    fetchSpineEditContext(supabase, project.id),
  ]);

  const featureIds = (features ?? []).map((f) => f.id);
  const { data: stories } =
    featureIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title, status, parent_id, metadata, assignee_id")
          .eq("project_id", project.id)
          .eq("type", "story")
          .in("parent_id", featureIds)
          .is("archived_at", null)
          .order("sort_order", { ascending: true })
      : { data: [] };

  const featureChildren = buildEpicFeatureChildren(features ?? [], stories ?? []);
  const { totalImpact, totalDays, ratio } = calculateEpicRollup(
    featureChildren.map((f) => ({ impact: f.impact, calculatedDays: f.effortDays }))
  );

  const status = (["todo", "in_progress", "review", "done"] as const).includes(
    epic.status as WorkItemStatus
  )
    ? (epic.status as WorkItemStatus)
    : "todo";

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title={epic.title}
        description="Inspecteur Epic — structure enfants, édition et santé (même panneau que l'Arbre)."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.epicDetail,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link
            href={`/projects/${slug}/portfolio`}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            Epics/Features
          </Link>
        }
      />

      <EpicInspectorPage
        projectId={project.id}
        projectSlug={slug}
        editContext={editContext}
        featureExecutionMode={isFeatureExecutionMode(workflow)}
        epicEqualsCycle={workflow.epicEqualsCycle === true}
        epic={{
          id: epic.id,
          title: epic.title,
          description: readMetadataDescription(epic.metadata) ?? undefined,
          doc_url: readMetadataDocUrl(epic.metadata),
          status,
          totalImpact,
          totalDays,
          valueEffortRatio: ratio,
          features: featureChildren,
          featureCount: featureChildren.length,
          storyCount: countStoriesInFeatures(featureChildren),
        }}
      />
    </div>
  );
}
