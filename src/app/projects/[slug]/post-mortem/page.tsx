import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { PostMortemLogs } from "@/components/radar/PostMortemLogs";
import type { ArchiveReason } from "@/lib/sttns/postMortem";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function PostMortemPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const { data: archivedItems } = await supabase
    .from("sttns_work_items")
    .select("id, title, type, metadata, archived_at, rice_score")
    .eq("project_id", project.id)
    .not("archived_at", "is", null)
    .order("archived_at", { ascending: false });

  const logs =
    archivedItems
      ?.filter((item) => {
        const meta = (item.metadata as any) || {};
        return meta.archived_reason && meta.archived_at;
      })
      .map((item) => {
        const meta = (item.metadata as any) || {};
        return {
          id: item.id,
          title: item.title,
          type: item.type,
          archivedAt: item.archived_at!,
          reason: meta.archived_reason as ArchiveReason,
          reasonDetails: meta.archived_reason_details as string | null,
          archivedBy: meta.archived_by as string,
          riceScore: item.rice_score ?? 0,
        };
      }) || [];

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Post-Mortem"
        count={logs.length}
        description="Feedback loop — raisons d'archivage pour une stratégie auto-correctrice."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.radar,
          title: "Post-Mortem",
          body:
            "Journal des items archivés avec motif (KILL, pivot, hors scope…). " +
            "Complète le Radar d'Hygiène pour capitaliser sur les échecs.",
          href: `/projects/${slug}/radar`,
          hrefLabel: "Radar d'Hygiène",
        }}
      />

      <PostMortemLogs projectSlug={slug} logs={logs} />
    </div>
  );
}
