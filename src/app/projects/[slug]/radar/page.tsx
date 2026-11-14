import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { readTaskNotionUrl } from "@/lib/sttns/schema";
import { readMetadataDescription, readMetadataDocUrl } from "@/lib/sttns/workItems";
import { readEffortDays, readImpact } from "@/lib/sttns/valueEffort";
import {
  fetchStoryCycleOptions,
  fetchStoryFeatureOptions,
} from "@/lib/sttns/storiesSpine";
import { HygieneRadar } from "@/components/radar/HygieneRadar";
import { splitWhyJobs } from "@/lib/sttns/whySpine";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { collectPainPointJobIds } from "@/lib/sttns/radarAnomalies";

interface Props {
  params: Promise<{ slug: string }>;
}

// Helper: calculate days between two dates
function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}

export default async function RadarPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  const [features, cycles] = await Promise.all([
    fetchStoryFeatureOptions(supabase, project.id),
    fetchStoryCycleOptions(supabase, project.id),
  ]);

  // ─────────────────────────────────────────────────────────────────────────
  // WIDGET 1: ORPHELINS - Features sans lien JTBD (context_links.type = 'job')
  // ─────────────────────────────────────────────────────────────────────────
  
  // Fetch all features
  const { data: allFeatures } = await supabase
    .from("sttns_work_items")
    .select("id, title, created_at, parent_id, metadata")
    .eq("project_id", project.id)
    .eq("type", "feature")
    .is("archived_at", null);

  const featureIds = allFeatures?.map((f) => f.id) ?? [];
  const { data: jobContextLinks } =
    featureIds.length > 0
      ? await supabase
          .from("sttns_context_links")
          .select("work_item_id, context_id")
          .in("work_item_id", featureIds)
          .eq("context_type", "job")
      : { data: [] };

  // Fetch epics for parent names
  const { data: epics } = await supabase
    .from("sttns_work_items")
    .select("id, title")
    .eq("project_id", project.id)
    .eq("type", "epic")
    .is("archived_at", null);

  const epicMap = Object.fromEntries(
    epics?.map((e) => [e.id, e.title]) ?? []
  );

  // Récupère tous les jobs pour identifier les Pain Points à exclure de la
  // détection d'orphelins (un lien Feature → Pain Point ne prouve PAS une
  // couverture JTBD au sens Constitution Spine).
  const { data: allJobs } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id, metadata")
    .eq("project_id", project.id)
    .eq("type", "job")
    .is("archived_at", null);

  const painPointJobIds = collectPainPointJobIds(
    (allJobs ?? []).map((j) => ({
      id: j.id,
      title: j.title,
      type: "job" as const,
      metadata: j.metadata,
    }))
  );

  // Feature couverte = au moins un context_links(type=job) qui pointe vers
  // un JTBD RÉEL (pas un Pain Point).
  const featureIdsWithJobLink = new Set<string>();
  for (const link of jobContextLinks ?? []) {
    if (painPointJobIds.has(link.context_id)) continue;
    featureIdsWithJobLink.add(link.work_item_id);
  }

  const orphans =
    allFeatures
      ?.filter((f) => !featureIdsWithJobLink.has(f.id))
      .map((f) => ({
        id: f.id,
        title: f.title,
        epicTitle: f.parent_id ? epicMap[f.parent_id] ?? "Epic inconnu" : "Sans Epic",
        createdAt: f.created_at,
      })) ?? [];

  // WIDGET 2: STAGNATION — stories in_progress/review sans mouvement > stagnationDays
  const stagnationCutoff = new Date();
  stagnationCutoff.setDate(stagnationCutoff.getDate() - workflow.stagnationDays);

  const { data: stagnantStories } = await supabase
    .from("sttns_work_items")
    .select("id, title, status, updated_at, parent_id, metadata")
    .eq("project_id", project.id)
    .eq("type", "story")
    .in("status", ["in_progress", "review"])
    .is("archived_at", null)
    .lt("updated_at", stagnationCutoff.toISOString());

  // Fetch features and epics for parent chain
  const { data: featureRows } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id")
    .eq("project_id", project.id)
    .eq("type", "feature")
    .is("archived_at", null);

  const featureMap = Object.fromEntries(
    featureRows?.map((f) => [
      f.id,
      { title: f.title, epicId: f.parent_id },
    ]) ?? []
  );

  const stagnants =
    stagnantStories?.map((story) => {
      const featureInfo = story.parent_id ? featureMap[story.parent_id] : null;
      const daysInStatus = daysBetween(
        new Date(story.updated_at),
        new Date()
      );

      return {
        id: story.id,
        title: story.title,
        status: story.status as "in_progress" | "review",
        daysInStatus,
        effortDays: readEffortDays(story.metadata) ?? 0,
        featureTitle: featureInfo?.title ?? "Feature inconnue",
        epicTitle: featureInfo?.epicId
          ? epicMap[featureInfo.epicId] ?? "Epic inconnu"
          : "Epic inconnu",
        lastUpdated: story.updated_at,
      };
    }) ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // WIDGET 3: Features Impact 0 (Gaspillage) — hard block in_progress
  // ─────────────────────────────────────────────────────────────────────────

  const wasteFeatures =
    allFeatures
      ?.filter((f) => readImpact(f.metadata) === 0)
      .map((f) => ({
        id: f.id,
        title: f.title,
        epicTitle: f.parent_id ? epicMap[f.parent_id] ?? "Epic inconnu" : "Sans Epic",
        impact: 0 as const,
      })) ?? [];

  // ─────────────────────────────────────────────────────────────────────────
  // WIDGET 4: JTBD sans Pain Point — aucun lien solves dans work_item_links
  // (jobs déjà récupérés plus haut pour la détection d'orphelins)
  // ─────────────────────────────────────────────────────────────────────────

  const { jtbds: realJtbds } = splitWhyJobs(allJobs ?? []);

  const jtbdIds = realJtbds.map((j) => j.id);
  const { data: solveLinks } =
    jtbdIds.length > 0
      ? await supabase
          .from("sttns_work_item_links")
          .select("source_id")
          .in("source_id", jtbdIds)
          .eq("type", "solves")
      : { data: [] };

  const jtbdsWithPpLink = new Set(solveLinks?.map((l) => l.source_id) ?? []);

  const { data: personas } = await supabase
    .from("sttns_work_items")
    .select("id, title")
    .eq("project_id", project.id)
    .eq("type", "persona")
    .is("archived_at", null);

  const personaMap = Object.fromEntries(personas?.map((p) => [p.id, p.title]) ?? []);

  const ghostJtbds = realJtbds
    .filter((j) => !jtbdsWithPpLink.has(j.id))
    .map((j) => ({
      id: j.id,
      title: j.title,
      personaId: j.parent_id ?? "",
      personaTitle: j.parent_id ? personaMap[j.parent_id] ?? "Persona inconnu" : "Sans persona",
    }));

  // WIDGET 5: Tâches done sans documentation Notion
  const { data: doneTasks } = await supabase
    .from("sttns_work_items")
    .select("id, title, metadata, parent_id")
    .eq("project_id", project.id)
    .eq("type", "task")
    .eq("status", "done")
    .is("archived_at", null);

  const undocumentedRaw =
    doneTasks?.filter((task) => !readTaskNotionUrl(task.metadata)) ?? [];

  const parentStoryIds = Array.from(
    new Set(undocumentedRaw.map((t) => t.parent_id).filter(Boolean) as string[])
  );

  const { data: parentStories } =
    parentStoryIds.length > 0
      ? await supabase
          .from("sttns_work_items")
          .select("id, title, parent_id, cycle_id, status, metadata")
          .eq("project_id", project.id)
          .eq("type", "story")
          .in("id", parentStoryIds)
      : { data: [] };

  const storyMap = Object.fromEntries(
    (parentStories ?? []).map((s) => [s.id, s])
  );

  const undocumentedTasks = undocumentedRaw
    .filter((task) => task.parent_id && storyMap[task.parent_id])
    .map((task) => {
      const story = storyMap[task.parent_id!];
      return {
        id: task.id,
        title: task.title,
        storyId: story.id,
        storyTitle: story.title,
        story: {
          id: story.id,
          title: story.title,
          description: readMetadataDescription(story.metadata),
          doc_url: readMetadataDocUrl(story.metadata),
          feature_id: story.parent_id,
          cycle_id: story.cycle_id,
          effort_days: readEffortDays(story.metadata) ?? undefined,
          status: story.status,
        },
      };
    });

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Radar d'Hygiène"
        description="Surveillance des ruptures de chaîne de valeur et des goulots d'étranglement."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.radar,
          href: `/projects/${slug}/help/parcours`,
        }}
      />

      <HygieneRadar
        projectSlug={slug}
        projectId={project.id}
        orphans={orphans}
        stagnants={stagnants}
        wasteFeatures={wasteFeatures}
        ghostJtbds={ghostJtbds}
        undocumentedTasks={undocumentedTasks}
        features={features}
        cycles={cycles}
        stagnationDays={workflow.stagnationDays}
      />
    </div>
  );
}
