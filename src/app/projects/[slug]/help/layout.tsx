import type { ReactNode } from "react";
import { HelpPlaybookNav } from "@/components/help/HelpPlaybookNav";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { STTNS_APP_VERSION_LABEL } from "@/lib/sttns/productVersion";

interface Props {
  children: ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function HelpPlaybookLayout({ children, params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  return (
    <div className="sttns-page-stack min-h-[70vh]">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Aide STTNS"
        description={
          <>
            Playbook {STTNS_APP_VERSION_LABEL} — alignement Produit · Tech · Système. Téléchargez
            chaque chapitre en Markdown via l&apos;icône{" "}
            <span className="font-medium text-foreground">.md</span>.
          </>
        }
      />

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        <aside className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
          <div className="sttns-card !p-2">
            <HelpPlaybookNav projectSlug={slug} projectName={project.name} />
          </div>
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
