import { redirect } from "next/navigation";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function CycleDetailRedirectPage({ params }: Props) {
  const { slug, id } = await params;
  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  if (isFeatureExecutionMode(workflow)) {
    redirect(`/projects/${slug}/kanban?cycle_id=${id}`);
  }

  redirect(`/projects/${slug}/user-stories?cycle_id=${id}`);
}
