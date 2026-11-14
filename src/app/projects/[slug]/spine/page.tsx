import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { countSpineNodes, fetchSpineTree } from "@/lib/sttns/spineTree";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { SpineTreeExplorer } from "@/components/spine/SpineTreeExplorer";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function SpineTreePage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);
  const [dataset, editContext] = await Promise.all([
    fetchSpineTree(supabase, project.id),
    fetchSpineEditContext(supabase, project.id),
  ]);

  const counts = countSpineNodes(dataset);

  const countsLine =
    `${counts.personas} persona${counts.personas !== 1 ? "s" : ""} · ` +
    `${counts.epics} epic${counts.epics !== 1 ? "s" : ""} · ` +
    `${counts.features} feature${counts.features !== 1 ? "s" : ""} · ` +
    `${counts.cycles} cycle${counts.cycles !== 1 ? "s" : ""} · ` +
    `${counts.stories} story${counts.stories !== 1 ? "s" : ""} · ` +
    `${counts.tasks} task${counts.tasks !== 1 ? "s" : ""}`;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Arbre de Traçabilité"
        description={`Explorez la chaîne de valeur sous trois angles — Stratégie, Produit et Exécution. ${countsLine}.`}
        contextHelp={{
          ...PAGE_CONTEXT_HELP.spine,
          href: `/projects/${slug}/help/framework`,
        }}
      />

      <SpineTreeExplorer
        projectId={project.id}
        projectSlug={slug}
        initialDataset={dataset}
        editContext={editContext}
        featureExecutionMode={isFeatureExecutionMode(workflow)}
        epicEqualsCycle={workflow.epicEqualsCycle === true}
      />
    </div>
  );
}
