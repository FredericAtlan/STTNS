import Link from "next/link";
import { redirect } from "next/navigation";
import { StatusPill, type StatusType } from "@/components/ui/StatusPill";
import { SpineRichText } from "@/components/ui/SpineRichText";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { fetchProjectSpineEpics } from "@/lib/sttns/epics";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

function epicStatusPill(status: string): StatusType {
  if (status === "in_progress" || status === "review") return "in_progress";
  if (status === "done") return "done";
  return "todo";
}

export default async function EpicsPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const epics = await fetchProjectSpineEpics(supabase, project.id);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Epics"
        count={epics.length}
        description="Liste Spine — alignée avec Epics/Features et l'Arbre de Traçabilité."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.portfolio,
          href: `/projects/${slug}/help/scoring`,
          title: "Epics",
        }}
        actions={
          <>
            <Link
              href={`/projects/${slug}/portfolio`}
              className="sttns-btn-secondary sttns-btn-sm"
            >
              <SpineObjectIcon type="epic" className="h-4 w-4" />
              Epics/Features
            </Link>
            <Link
              href={`/projects/${slug}/epics/new`}
              className="sttns-btn-primary sttns-btn-sm"
            >
              <SpineObjectIcon
                type="epic"
                className="h-4 w-4 text-primary-foreground"
                colored={false}
              />
              Nouvel Epic
            </Link>
          </>
        }
      />

      <div className="space-y-2">
        {epics.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun epic Spine. Créez-en un ou consultez le{" "}
            <Link
              href={`/projects/${slug}/portfolio`}
              className="font-medium text-primary underline underline-offset-2"
            >
              Epics/Features
            </Link>
            .
          </p>
        ) : (
          epics.map((epic) => (
            <Link
              key={epic.id}
              href={`/projects/${slug}/epics/${epic.id}`}
              className="block rounded-md border border-border bg-card p-4 hover:border-primary/30"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">{epic.title}</span>
                <StatusPill status={epicStatusPill(epic.status)} />
              </div>
              {epic.description && (
                <SpineRichText
                  content={epic.description}
                  className="mt-1 line-clamp-2 text-muted-foreground [&_p]:text-sm [&_p]:leading-snug"
                />
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
