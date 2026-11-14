import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { featuresPath } from "@/lib/sttns/paths";
import {
  fetchSpineFeatures,
} from "@/lib/sttns/featuresSpine";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { ImpactBadge } from "@/components/ui/ValueEffortBadges";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import Link from "next/link";
import type { ImpactLevel } from "@/lib/sttns/valueEffort";

export default async function FeaturesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);
  const features = await fetchSpineFeatures(supabase, project.id);

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title="Features"
        count={features.length}
        description="Ponts Epic ↔ JTBD — source unique Spine (sttns_work_items)."
        contextHelp={{
          ...PAGE_CONTEXT_HELP.featuresList,
          href: `/projects/${slug}/help/scoring`,
        }}
        actions={
          <Link
            href={featuresPath(slug, "new")}
            className="sttns-btn-primary sttns-btn-sm"
          >
            <SpineObjectIcon
              type="feature"
              className="h-4 w-4 text-primary-foreground"
              colored={false}
            />
            Nouvelle feature
          </Link>
        }
      />

      <div className="space-y-2">
        {features.length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune feature. Créez la première.</p>
        ) : (
          features.map((feature) => (
            <Link
              key={feature.id}
              href={featuresPath(slug, feature.id)}
              className="block rounded border border-zinc-200 bg-white p-4 hover:border-zinc-300"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-zinc-900">
                    {feature.code && (
                      <span className="text-zinc-500">{feature.code} · </span>
                    )}
                    {feature.title}
                  </span>
                  <p className="mt-1 text-xs text-zinc-500">
                    Epic : {feature.epicTitle}
                    {feature.impact != null && (
                      <ImpactBadge
                        impact={feature.impact as ImpactLevel}
                        showLabel
                        className="ml-2"
                      />
                    )}
                  </p>
                </div>
                <StatusBadge status={feature.status} />
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
