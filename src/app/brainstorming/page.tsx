import { redirect } from "next/navigation";
import { STTNS_BRAINSTORMING_ENABLED } from "@/lib/sttns/productFlags";
import { createClient } from "@/lib/supabase/server";
import { getProfileForUser } from "@/lib/sttns/auth";
import { getAllProjects } from "@/lib/sttns/projects";
import { BrainstormingWorkspace } from "@/components/brainstorm/BrainstormingWorkspace";

interface Props {
  searchParams: Promise<{ project?: string }>;
}

export default async function BrainstormingPage({ searchParams }: Props) {
  if (!STTNS_BRAINSTORMING_ENABLED) redirect("/projects");

  const { project: projectSlug } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [projects, profile] = await Promise.all([
    getAllProjects(),
    getProfileForUser(user.id),
  ]);

  const authorName =
    profile?.full_name?.trim() ||
    profile?.email?.split("@")[0] ||
    user.email?.split("@")[0] ||
    "User";

  const projectOptions = projects.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
  }));

  const contextProject = projectSlug ? projects.find((p) => p.slug === projectSlug) : null;

  return (
    <BrainstormingWorkspace
      projects={projectOptions}
      authorName={authorName}
      contextProjectSlug={contextProject?.slug}
      contextProjectName={contextProject?.name}
      eyebrow={contextProject ? `Project · ${contextProject.slug}` : "Portfolio"}
      title="Idea board & brainstorming"
      description={
        contextProject
          ? "Cross-project space, filtered by default to this project. Optional assignment."
          : "Capture cross-project ideas. Assign them to an existing project or keep them at portfolio level."
      }
    />
  );
}
