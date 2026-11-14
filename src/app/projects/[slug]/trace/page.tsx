import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { splitWhyJobs } from "@/lib/sttns/whySpine";
import { readImpact, type ImpactLevel } from "@/lib/sttns/valueEffort";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { DependencyGraphView } from "@/components/trace/DependencyGraphView";
import type { DependencyGraphInput } from "@/lib/sttns/dependencyGraph";

interface Props {
  params: Promise<{ slug: string }>;
}

/**
 * KF3 — Dependency Graph JTBD → Feature.
 *
 * Vue React Flow filtrée sur les seuls liens `sttns_context_links`
 * (`context_type: job`). Réutilise les patterns Mind Map (dagre LR) et la
 * même source que le Radar d'Hygiène.
 */
export default async function TracePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const [personasRes, jobsRes, featuresRes, epicsRes] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("id, title")
      .eq("project_id", project.id)
      .eq("type", "persona")
      .is("archived_at", null)
      .order("title"),
    supabase
      .from("sttns_work_items")
      .select("id, title, parent_id, metadata")
      .eq("project_id", project.id)
      .eq("type", "job")
      .is("archived_at", null),
    supabase
      .from("sttns_work_items")
      .select("id, title, parent_id, metadata")
      .eq("project_id", project.id)
      .eq("type", "feature")
      .is("archived_at", null)
      .order("title"),
    supabase
      .from("sttns_work_items")
      .select("id, title")
      .eq("project_id", project.id)
      .eq("type", "epic")
      .is("archived_at", null)
      .order("title"),
  ]);

  const personas = personasRes.data ?? [];
  const features = featuresRes.data ?? [];
  const epics = epicsRes.data ?? [];

  const { jtbds } = splitWhyJobs(jobsRes.data ?? []);
  const jtbdIds = jtbds.map((j) => j.id);
  const featureIds = features.map((f) => f.id);

  const { data: linksRaw } =
    featureIds.length > 0
      ? await supabase
          .from("sttns_context_links")
          .select("work_item_id, context_id, context_type")
          .in("work_item_id", featureIds)
          .eq("context_type", "job")
      : { data: [] };

  const jtbdIdSet = new Set(jtbdIds);
  const contextLinks = (linksRaw ?? [])
    .filter((row) => jtbdIdSet.has(row.context_id))
    .map((row) => ({
      featureId: row.work_item_id as string,
      jtbdId: row.context_id as string,
    }));

  const input: DependencyGraphInput = {
    personas: personas.map((p) => ({ id: p.id, title: p.title })),
    jtbds: jtbds.map((j) => ({
      id: j.id,
      title: j.title,
      personaId: j.parent_id ?? null,
    })),
    features: features.map((f) => ({
      id: f.id,
      title: f.title,
      epicId: f.parent_id ?? null,
      impact: (readImpact(f.metadata) as ImpactLevel | null) ?? null,
    })),
    epics: epics.map((e) => ({ id: e.id, title: e.title })),
    contextLinks,
  };

  const countsLine =
    `${input.jtbds.length} JTBD · ${input.features.length} Feature · ` +
    `${contextLinks.length} lien${contextLinks.length > 1 ? "s" : ""}`;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Graphe de Dépendances"
        description={`Vue React Flow filtrée JTBD ↔ Feature — pont Matrice Besoins × Portfolio. ${countsLine}.`}
        contextHelp={{
          ...PAGE_CONTEXT_HELP.trace,
          href: `/projects/${slug}/help/framework`,
        }}
      />

      <DependencyGraphView projectSlug={slug} input={input} />
    </div>
  );
}
