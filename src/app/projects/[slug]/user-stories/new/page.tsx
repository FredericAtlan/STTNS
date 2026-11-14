import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import { fetchProjectMembersGrouped } from "@/lib/sttns/projectMembers";
import {
  fetchStoryFeatureOptions,
  fetchStoryCycleOptions,
} from "@/lib/sttns/storiesSpine";
import { UserStoryForm } from "@/components/execution/UserStoryForm";
import { SpineBreadcrumb } from "@/components/spine/SpineBreadcrumb";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { AlertCircle } from "lucide-react";

interface Props {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ feature_id?: string }>;
}

export default async function NewUserStoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { feature_id: featureIdPrefill } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);

  if (isFeatureExecutionMode(workflow)) {
    redirect(`/projects/${slug}/kanban`);
  }

  const [featureOptions, cycleOptions, memberRows] = await Promise.all([
    fetchStoryFeatureOptions(supabase, project.id),
    fetchStoryCycleOptions(supabase, project.id),
    fetchProjectMembersGrouped(project.id),
  ]);

  const projectMembers = memberRows.map((row) => ({
    user_id: row.user_id,
    full_name: row.profile.full_name,
    email: row.profile.email,
    avatar_url: row.profile.avatar_url,
  }));

  const prefillFeature =
    featureIdPrefill && featureOptions.some((f) => f.id === featureIdPrefill)
      ? featureIdPrefill
      : undefined;
  const featureTitle = prefillFeature
    ? featureOptions.find((f) => f.id === prefillFeature)?.title
    : undefined;

  return (
    <div className="sttns-page-stack">
      <SpineBreadcrumb
        items={[
          { id: "stories", label: "Stories", kind: "label" },
          ...(featureTitle
            ? [{ id: prefillFeature!, label: featureTitle, kind: "feature" as const }]
            : []),
          { id: "new", label: "Nouvelle Story", kind: "label" },
        ]}
      />

      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Nouvelle User Story"
        description={
          featureTitle
            ? `Jours (0.5–5) · Risque (1–3) · pré-liée à « ${featureTitle} ».`
            : "Jours (0.5–5) · Risque (1–3) · héritage obligatoire vers une Feature."
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.userStoryNew,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link
            href={`/projects/${slug}/user-stories`}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            Annuler
          </Link>
        }
      />

      {featureOptions.length === 0 ? (
        <div className="rounded-md border border-warning/20 bg-warning/10 p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <h3 className="font-medium text-warning">Aucune Feature disponible</h3>
              <p className="mt-1 text-sm text-warning/90">
                Créez d&apos;abord une Feature dans{" "}
                <Link
                  href={`/projects/${slug}/features/new`}
                  className="font-medium underline underline-offset-2"
                >
                  Features
                </Link>{" "}
                avant de créer des User Stories.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="max-w-2xl">
          <UserStoryForm
            projectId={project.id}
            projectSlug={slug}
            features={featureOptions}
            cycles={cycleOptions}
            projectMembers={projectMembers}
            initial={prefillFeature ? { feature_id: prefillFeature } : undefined}
          />
        </div>
      )}
    </div>
  );
}
