import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { fetchSpineEpics, fetchJtbdOptions } from "@/lib/sttns/featuresSpine";
import { DiscoveryMatrix } from "@/components/discovery/DiscoveryMatrix";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function DiscoveryPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const [epics, jtbdOptions, { data: featureRows }, { data: storyRows }, { data: profile }] =
    await Promise.all([
      fetchSpineEpics(supabase, project.id),
      fetchJtbdOptions(supabase, project.id),
      supabase
        .from("sttns_work_items")
        .select("id, title, parent_id")
        .eq("project_id", project.id)
        .eq("type", "feature")
        .is("archived_at", null)
        .order("title", { ascending: true }),
      supabase
        .from("sttns_work_items")
        .select("id, title, parent_id")
        .eq("project_id", project.id)
        .eq("type", "story")
        .is("archived_at", null)
        .order("title", { ascending: true }),
      supabase
        .from("sttns_profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .maybeSingle(),
    ]);

  const defaultAuthor =
    (profile?.full_name ?? "").trim() ||
    (profile?.email ?? "").trim() ||
    (user.email ?? "").trim();

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Brouillons Epic→Feature→Story"
        description={
          <>
            Tableau de réunion pour créer des brouillons Epic / Feature / Story — démarrage
            projet ou ajouts — entre{" "}
            <Link
              href={`/projects/${slug}/why`}
              className="text-primary underline underline-offset-2"
            >
              Matrice Besoins
            </Link>{" "}
            et{" "}
            <Link
              href={`/projects/${slug}/portfolio`}
              className="text-primary underline underline-offset-2"
            >
              Portfolio
            </Link>
            . Créer au Spine = statut{" "}
            <span className="font-medium text-foreground">todo</span>.
          </>
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.discovery,
          href: `/projects/${slug}/help/scoring`,
        }}
      />

      <DiscoveryMatrix
        projectId={project.id}
        projectSlug={slug}
        spineEpics={epics.map((e) => ({ id: e.id, title: e.title }))}
        spineFeatures={(featureRows ?? []).map((f) => ({
          id: f.id,
          title: f.title,
          epic_id: f.parent_id,
        }))}
        spineStories={(storyRows ?? []).map((s) => ({
          id: s.id,
          title: s.title,
          feature_id: s.parent_id,
        }))}
        jtbdOptions={jtbdOptions}
        defaultAuthor={defaultAuthor}
      />
    </div>
  );
}
