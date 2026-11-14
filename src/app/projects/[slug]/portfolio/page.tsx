import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { StrategyPortfolio } from "@/components/portfolio/StrategyPortfolio";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { readMetadataDescription } from "@/lib/sttns/workItems";
import {
  calculateEpicRollup,
  calculateFeatureDays,
  countRiskyUnits,
  readImpact,
  type ImpactLevel,
} from "@/lib/sttns/valueEffort";
import Link from "next/link";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PortfolioPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  const [{ data: workItems }, { data: stories }, editContext] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, type, title, status, metadata, parent_id")
      .eq("project_id", project.id)
      .in("type", ["epic", "feature"])
      .is("archived_at", null)
      .order("title", { ascending: true }),
    supabase
      .from("sttns_work_items")
      .select("id, parent_id, metadata")
      .eq("project_id", project.id)
      .eq("type", "story")
      .is("archived_at", null),
    fetchSpineEditContext(supabase, project.id),
  ]);

  const storiesByFeature = new Map<string, unknown[]>();
  for (const story of stories ?? []) {
    if (!story.parent_id) continue;
    const list = storiesByFeature.get(story.parent_id) ?? [];
    list.push(story.metadata);
    storiesByFeature.set(story.parent_id, list);
  }

  const { data: jobs } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id, type")
    .eq("project_id", project.id)
    .eq("type", "job")
    .is("archived_at", null);

  const { data: personas } = await supabase
    .from("sttns_work_items")
    .select("id, title, type")
    .eq("project_id", project.id)
    .eq("type", "persona")
    .is("archived_at", null);

  const workItemIds = workItems?.map((w) => w.id) ?? [];
  const { data: contextLinks } =
    workItemIds.length > 0
      ? await supabase
          .from("sttns_context_links")
          .select("work_item_id, context_id, context_type")
          .in("work_item_id", workItemIds)
          .eq("context_type", "job")
      : { data: [] };

  const personaMap = Object.fromEntries(
    personas?.map((p) => [p.id, { id: p.id, title: p.title }]) ?? []
  );

  const jtbdMap = Object.fromEntries(
    jobs?.map((j) => [
      j.id,
      {
        id: j.id,
        title: j.title,
        personaName: personaMap[j.parent_id ?? ""]?.title ?? "Inconnu",
      },
    ]) ?? []
  );

  const features = (workItems ?? []).filter((item) => item.type === "feature");
  const featureStatsByEpic = new Map<
    string,
    Array<{ impact: number | null; calculatedDays: number }>
  >();
  const featureCountByEpic = new Map<string, number>();
  const storyCountByEpic = new Map<string, number>();

  const featureRows = features.map((item) => {
    const storyMetas = storiesByFeature.get(item.id) ?? [];
    const impact = readImpact(item.metadata);
    const calculatedDays = calculateFeatureDays(item.metadata, storyMetas);
    const riskyCount = countRiskyUnits(item.metadata, storyMetas);
    if (item.parent_id) {
      const list = featureStatsByEpic.get(item.parent_id) ?? [];
      list.push({ impact, calculatedDays });
      featureStatsByEpic.set(item.parent_id, list);
      featureCountByEpic.set(
        item.parent_id,
        (featureCountByEpic.get(item.parent_id) ?? 0) + 1
      );
      storyCountByEpic.set(
        item.parent_id,
        (storyCountByEpic.get(item.parent_id) ?? 0) + storyMetas.length
      );
    }
    return {
      id: item.id,
      type: "feature" as const,
      title: item.title,
      description: readMetadataDescription(item.metadata),
      impact,
      effortDays: calculatedDays,
      valueEffortRatio:
        calculatedDays > 0 && impact != null ? impact / calculatedDays : null,
      riskyCount,
      status: item.status,
      contextLinks:
        contextLinks
          ?.filter((cl) => cl.work_item_id === item.id)
          .map((cl) => ({
            type: cl.context_type,
            context_id: cl.context_id,
          })) ?? [],
      parentId: item.parent_id,
    };
  });

  const epicRows = (workItems ?? [])
    .filter((item) => item.type === "epic")
    .map((item) => {
      const featureStats = featureStatsByEpic.get(item.id) ?? [];
      const { totalImpact, totalDays, ratio } = calculateEpicRollup(featureStats);
      return {
        id: item.id,
        type: "epic" as const,
        title: item.title,
        description: readMetadataDescription(item.metadata),
        impact: null as ImpactLevel | null,
        totalImpact,
        effortDays: totalDays,
        valueEffortRatio: ratio,
        status: item.status,
        contextLinks: [] as Array<{ type: string; context_id: string }>,
        parentId: item.parent_id,
        featureCount: featureCountByEpic.get(item.id) ?? 0,
        storyCount: storyCountByEpic.get(item.id) ?? 0,
      };
    });

  const portfolioItems = [...epicRows, ...featureRows];

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Epics/Features"
        description="Ambition & Valeur — arbre par Epic · Inspecteur au clic · Scoring V/E."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.portfolio,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <>
            <Link
              href={`/projects/${slug}/epics/new`}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              <SpineObjectIcon type="epic" className="h-4 w-4" />
              Nouvel Epic
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

      <StrategyPortfolio
        projectId={project.id}
        projectSlug={slug}
        items={portfolioItems}
        editContext={editContext}
        jtbdMap={jtbdMap}
        personaMap={personaMap}
        featureExecutionMode={isFeatureExecutionMode(workflow)}
        epicEqualsCycle={workflow.epicEqualsCycle === true}
      />
    </div>
  );
}
