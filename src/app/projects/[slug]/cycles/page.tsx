import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { CycleManager } from "@/components/cycles/CycleManager";
import { enrichCycleRow } from "@/lib/sttns/cycles";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { executionBacklogHref } from "@/lib/sttns/executionNav";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import Link from "next/link";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function CyclesPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);
  const featureMode = isFeatureExecutionMode(workflow);

  const { data: cyclesRaw } = await supabase
    .from("sttns_cycles")
    .select("id, name, start_date, end_date, is_active, capacity_points")
    .eq("project_id", project.id)
    .order("start_date", { ascending: false });

  const cycles =
    cyclesRaw?.map((c) =>
      enrichCycleRow({
        id: c.id,
        name: c.name,
        start_date: c.start_date,
        end_date: c.end_date,
        is_active: c.is_active ?? false,
        capacity_points: c.capacity_points ?? 0,
      })
    ) ?? [];

  const executionHref = executionBacklogHref(slug, workflow);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Cycles"
        count={cycles.length}
        description={
          featureMode
            ? "Planifiez les itérations et assignez les features depuis le Kanban."
            : "Planifiez les itérations d'exécution et assignez-les aux stories du backlog."
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.cycles,
          href: `/projects/${slug}/help/parcours`,
        }}
        actions={
          <Link
            href={executionHref}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            <SpineObjectIcon type={featureMode ? "feature" : "story"} className="h-4 w-4" />
            {featureMode ? "Kanban Features" : "Stories Backlogs"}
          </Link>
        }
      />

      <CycleManager
        projectId={project.id}
        projectSlug={slug}
        cycles={cycles}
        defaultCycleWeeks={workflow.defaultCycleWeeks}
        featureExecutionMode={featureMode}
        epicEqualsCycle={workflow.epicEqualsCycle}
      />
    </div>
  );
}
