import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import {
  fetchSpineEpics,
  fetchJtbdOptions,
} from "@/lib/sttns/featuresSpine";
import { fetchStoryCycleOptions } from "@/lib/sttns/storiesSpine";
import { FeatureForm } from "@/components/features/FeatureForm";
import { featuresPath } from "@/lib/sttns/paths";
import { SpineBreadcrumb } from "@/components/spine/SpineBreadcrumb";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

export default async function NewFeaturePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ epic_id?: string }>;
}) {
  const { slug } = await params;
  const { epic_id: epicIdPrefill } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const workflow = parseProjectWorkflowSettings(project.settings);
  const featureMode = isFeatureExecutionMode(workflow);

  const [epics, jtbdOptions, cycleOptions] = await Promise.all([
    fetchSpineEpics(supabase, project.id),
    fetchJtbdOptions(supabase, project.id),
    featureMode ? fetchStoryCycleOptions(supabase, project.id) : Promise.resolve([]),
  ]);

  const prefillEpic =
    epicIdPrefill && epics.some((e) => e.id === epicIdPrefill) ? epicIdPrefill : undefined;
  const epicTitle = prefillEpic
    ? epics.find((e) => e.id === prefillEpic)?.title
    : undefined;

  return (
    <div className="sttns-page-stack">
      <SpineBreadcrumb
        items={[
          { id: "portfolio", label: "Epics/Features", kind: "label" },
          ...(epicTitle
            ? [{ id: prefillEpic!, label: epicTitle, kind: "epic" as const }]
            : []),
          { id: "new", label: "Nouvelle Feature", kind: "label" },
        ]}
      />

      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Nouvelle Feature"
        description={
          epicTitle
            ? `Pont Epic ↔ JTBD — pré-rattachée à « ${epicTitle} ».`
            : "Pont Epic ↔ JTBD — Impact obligatoire (Constitution Spine)."
        }
        contextHelp={{
          ...PAGE_CONTEXT_HELP.newFeature,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link href={featuresPath(slug)} className="sttns-btn-secondary sttns-btn-sm">
            Annuler
          </Link>
        }
      />

      <div className="max-w-2xl">
        {jtbdOptions.length === 0 ? (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
            <strong>Constitution Spine :</strong> Aucun JTBD disponible. Créez d&apos;abord des
            Personas et JTBD dans la{" "}
            <Link href={`/projects/${slug}/why`} className="underline underline-offset-2">
              Matrice Besoins
            </Link>{" "}
            avant de pouvoir créer une Feature.
          </div>
        ) : epics.length === 0 ? (
          <div className="rounded-md border border-warning/20 bg-warning/10 p-4 text-sm text-warning">
            <strong>Constitution Spine :</strong> Aucun Epic disponible. Créez d&apos;abord un Epic
            dans{" "}
            <Link href={`/projects/${slug}/epics/new`} className="underline underline-offset-2">
              Epics
            </Link>{" "}
            ou le{" "}
            <Link href={`/projects/${slug}/portfolio`} className="underline underline-offset-2">
              Epics/Features
            </Link>
            .
          </div>
        ) : (
          <FeatureForm
            projectId={project.id}
            projectSlug={slug}
            epics={epics}
            jtbdOptions={jtbdOptions}
            cycleOptions={cycleOptions}
            featureExecutionMode={featureMode}
            epicEqualsCycle={workflow.epicEqualsCycle}
            initial={prefillEpic ? { epic_id: prefillEpic } : undefined}
          />
        )}
      </div>
    </div>
  );
}
