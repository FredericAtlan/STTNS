import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { EpicForm } from "@/components/epics/EpicForm";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NewEpicPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Nouvel Epic"
        description="Focus Vision — ambition stratégique avant Features et Stories."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.epicNew,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link
            href={`/projects/${slug}/portfolio`}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            Annuler
          </Link>
        }
      />

      <div className="max-w-2xl">
        <EpicForm projectId={project.id} projectSlug={slug} />
      </div>
    </div>
  );
}
