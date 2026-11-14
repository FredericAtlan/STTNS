import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import {
  buildApplicationSection,
  FRAMEWORK_STRATEGIQUE,
} from "@/lib/sttns/frameworkContent";
import { FRAMEWORK_VALUE_EFFORT } from "@/lib/sttns/valueEffortGuide";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { FrameworkViewer } from "@/components/framework/FrameworkViewer";
import { RecommendedFlowPanel } from "@/components/project/RecommendedFlowPanel";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import type { SttnsInitiative } from "@/types/sttns";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectFrameworkPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const [
    { count: personaCount },
    { count: storyCount },
    { data: allStories },
    { data: initiatives },
  ] = await Promise.all([
    supabase
      .from("sttns_work_items")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .eq("type", "persona")
      .is("archived_at", null),
    supabase
      .from("sttns_user_stories")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id),
    supabase
      .from("sttns_user_stories")
      .select("sprint_want, sprint_so_that")
      .eq("project_id", project.id),
    supabase.from("sttns_initiatives").select("persona_id, user_story_id").eq("project_id", project.id),
  ]);

  const rows = (initiatives ?? []) as Pick<SttnsInitiative, "persona_id" | "user_story_id">[];
  const storiesWithSprint = (allStories ?? []).filter(
    (s) => s.sprint_want && s.sprint_so_that
  ).length;
  const initiativesLinked = rows.filter((i) => i.persona_id && i.user_story_id).length;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Framework STTNS"
        description="Playbook métier — scoring V/E, manifeste stratégique et application projet."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.framework,
          href: `/projects/${slug}/help/framework`,
        }}
      />

      <FrameworkViewer
        projectSlug={slug}
        projectName={project.name}
        scoring={FRAMEWORK_VALUE_EFFORT}
        strategique={FRAMEWORK_STRATEGIQUE}
        application={buildApplicationSection(project.name)}
        fluxPanel={
          <RecommendedFlowPanel
            projectSlug={slug}
            personaCount={personaCount ?? 0}
            storyCount={storyCount ?? 0}
            storiesWithSprint={storiesWithSprint}
            initiativesLinked={initiativesLinked}
            initiativeTotal={rows.length}
          />
        }
      />
    </div>
  );
}
