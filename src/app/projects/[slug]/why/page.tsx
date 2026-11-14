import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import { PersonaWorkspace } from "@/components/why/PersonaWorkspace";
import { parsePainPointFields, splitWhyJobs } from "@/lib/sttns/whySpine";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    tab?: string;
    persona?: string;
    /** Deep-link EDIT — ouvre le Slide-over JTBD en édition (Radar). */
    jtbd?: string;
  }>;
}

export default async function WhyPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { tab, persona, jtbd } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  // A2 — Spine only. Segment lu depuis metadata Spine ; plus de SELECT sttns_personas.
  const { data: personasData } = await supabase
    .from("sttns_work_items")
    .select("id, title, code, status, metadata, archived_at")
    .eq("project_id", project.id)
    .eq("type", "persona")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  const { data: jtbsData } = await supabase
    .from("sttns_work_items")
    .select("id, title, parent_id, status, metadata, archived_at")
    .eq("project_id", project.id)
    .eq("type", "job")
    .is("archived_at", null)
    .order("sort_order", { ascending: true });

  const personas =
    personasData?.map((p) => {
      const meta = (p.metadata ?? {}) as {
        segment?: string;
        description?: string;
        avatar_url?: string;
        doc_url?: string;
      };
      const segment = typeof meta.segment === "string" ? meta.segment.trim() : "";
      return {
        id: p.id,
        title: p.title,
        code: p.code,
        status: p.status,
        description: meta.description,
        avatar_url: meta.avatar_url ?? null,
        doc_url: readMetadataDocUrl(meta),
        segment: segment.length > 0 ? segment : undefined,
      };
    }) ?? [];

  const { painPoints: ppJobs, jtbds: jtbdJobs } = splitWhyJobs(jtbsData ?? []);

  const painPoints = ppJobs
    .map((j) => {
      const parsed = parsePainPointFields(j.title, j.metadata);
      return {
        id: j.id,
        title: parsed.label,
        severity: parsed.severity,
        persona_id: j.parent_id ?? "",
      };
    })
    .filter((pp) => pp.persona_id);

  const loadedPainPointIds = new Set(painPoints.map((pp) => pp.id));

  const jtbdIds = jtbdJobs.map((j) => j.id);

  const { data: solveLinks } =
    jtbdIds.length > 0
      ? await supabase
          .from("sttns_work_item_links")
          .select("source_id, target_id")
          .in("source_id", jtbdIds)
          .eq("type", "solves")
      : { data: [] };

  // Prune : ignore les targets qui ne sont plus dans le set PP chargé (archivés / hors périmètre).
  const solvedByJtbd = new Map<string, string[]>();
  for (const link of solveLinks ?? []) {
    if (!loadedPainPointIds.has(link.target_id)) continue;
    const list = solvedByJtbd.get(link.source_id) ?? [];
    list.push(link.target_id);
    solvedByJtbd.set(link.source_id, list);
  }

  const jtbs = jtbdJobs.map((j) => ({
    id: j.id,
    title: j.title,
    parent_id: j.parent_id,
    status: j.status,
    solved_pain_point_ids: solvedByJtbd.get(j.id) ?? [],
  }));

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Matrice Besoins"
        description="Ancrage Persona / Pain Point / JTBD — fondation Shape Up avant Brouillons et Portfolio."
        count={personas.length}
        contextHelp={{
          ...PAGE_CONTEXT_HELP.why,
          href: `/projects/${slug}/help/framework`,
        }}
      />

      <PersonaWorkspace
        projectId={project.id}
        projectSlug={slug}
        personas={personas}
        jtbs={jtbs}
        painPoints={painPoints}
        defaultTab={
          tab === "persona" || tab === "pp" || tab === "jtbd" ? tab : "matrix"
        }
        preselectedPersonaId={persona}
        preselectedJtbdEditId={jtbd}
      />
    </div>
  );
}
