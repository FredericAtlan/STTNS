import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { fetchSpineTree, getSpineRootNodes, SPINE_UNASSIGNED_CYCLE_ID } from "@/lib/sttns/spineTree";
import { fetchSpineEditContext } from "@/lib/sttns/spineEditContext";
import { MindMapExplorer } from "@/components/mindmap/MindMapExplorer";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function MindMapPage({ params }: Props) {
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
  const productRoots = getSpineRootNodes(dataset, "product");
  const executionRoots = getSpineRootNodes(dataset, "execution");
  const strategyRoots = getSpineRootNodes(dataset, "strategy");

  const epicCount = productRoots.filter((n) => n.kind === "epic").length;
  const personaCount = strategyRoots.filter((n) => n.kind === "persona").length;
  const cycleCount = executionRoots.filter((n) => n.id !== SPINE_UNASSIGNED_CYCLE_ID).length;
  const featureCount = dataset.product.reduce((acc, n) => {
    function countFeatures(node: typeof n): number {
      let c = node.kind === "feature" ? 1 : 0;
      for (const child of node.children) c += countFeatures(child);
      return c;
    }
    return acc + countFeatures(n);
  }, 0);

  const countsLine =
    `${personaCount} persona${personaCount !== 1 ? "s" : ""} · ` +
    `${epicCount} epic${epicCount !== 1 ? "s" : ""} · ` +
    `${featureCount} feature${featureCount !== 1 ? "s" : ""} · ` +
    `${cycleCount} cycle${cycleCount !== 1 ? "s" : ""}`;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Arbre de Relations"
        description={`Trois perspectives — Stratégie (Persona → JTBD), Produit (Epic → Story) ou Exécution (cycles + traçabilité). ${countsLine}.`}
        contextHelp={{
          ...PAGE_CONTEXT_HELP.mindmap,
          href: `/projects/${slug}/help/framework`,
        }}
      />

      <MindMapExplorer
        projectId={project.id}
        projectSlug={slug}
        executionUnit={workflow.executionUnit}
        epicEqualsCycle={workflow.epicEqualsCycle}
        initialStrategyRoots={strategyRoots}
        initialProductRoots={productRoots}
        initialExecutionRoots={executionRoots}
        members={dataset.members}
        editContext={editContext}
      />
    </div>
  );
}
