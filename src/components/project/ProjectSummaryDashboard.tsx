import Link from "next/link";
import { ArrowDownUp } from "lucide-react";
import { ValueChainMappingView } from "@/components/epics/ValueChainMappingView";
import { ValueChainSummaryKpis } from "@/components/epics/ValueChainSummaryKpis";
import type { ValueChainMap, ValueChainMapSummary } from "@/lib/epics/valueChainMapping";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import { SttnsSectionTitle } from "@/components/ui/SttnsContextHelp";
import { ProjectDangerActions } from "@/components/project/ProjectDangerActions";
import type { SttnsProject } from "@/types/sttns";

type Props = {
  project: SttnsProject;
  valueChainMap: ValueChainMap;
  /** Carte limitée au casting actif (personas actifs) */
  activeCastMap: ValueChainMap;
};

export function ProjectSummaryDashboard({
  project,
  valueChainMap,
  activeCastMap,
}: Props) {
  const slug = project.slug;
  const base = `/projects/${slug}`;

  return (
    <div className="sttns-page-stack">
      <ProjectPageHero
        eyebrow={`Projet · ${project.slug}`}
        title={project.name}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href={`${base}/import-export`}
              className="sttns-btn-secondary sttns-btn-md inline-flex items-center gap-2"
            >
              <ArrowDownUp className="h-4 w-4" />
              Import / Export
            </Link>
            <ProjectDangerActions projectId={project.id} projectSlug={slug} projectName={project.name} />
          </div>
        }
      />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <SttnsSectionTitle as="h2" help={PAGE_CONTEXT_HELP.summaryValueChain}>
            Cartographie valeur
          </SttnsSectionTitle>
        </div>

        <p className="text-[11px] text-slate-500">
          KPI calculés sur le <strong className="font-semibold text-slate-600">casting actif</strong>{" "}
          (personas actifs du casting).
        </p>
        <ValueChainSummaryKpis map={activeCastMap} projectSlug={slug} />
        <ValueChainMappingView map={valueChainMap} projectSlug={slug} compact />
      </section>
    </div>
  );
}
