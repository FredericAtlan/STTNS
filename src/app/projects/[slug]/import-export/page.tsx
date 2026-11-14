import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { getProjectSquadRole, isProjectMember } from "@/lib/sttns/access";
import { projectHomePath } from "@/lib/sttns/paths";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { ImportExportHub } from "@/components/import-export/ImportExportHub";
import { fetchImportExportStatsAction } from "@/app/projects/[slug]/import-export/actions";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectImportExportPage({ params }: Props) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const isMember = await isProjectMember(project.id, user.id);
  if (!isMember) {
    redirect(projectHomePath(slug));
  }

  const squadRole = await getProjectSquadRole(project.id, user.id);
  const canEdit = squadRole != null && squadRole !== "viewer";

  const stats = await fetchImportExportStatsAction(project.id);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Import / Export"
        description="Hub Spine v2 — archives ZIP par objet, UUID stables pour les liaisons entre Matrice Besoins, portfolio et exécution."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.importExport,
          href: `/projects/${slug}/help/application`,
        }}
      />

      <ImportExportHub
        projectId={project.id}
        projectSlug={slug}
        projectName={project.name}
        canEdit={canEdit}
        initialCounts={stats.ok ? stats.counts : {}}
      />
    </div>
  );
}
