import { computeGovernanceStats } from "@/lib/sttns/governanceAxes";
import type { SttnsInitiative, SttnsProject } from "@/types/sttns";

/** Features des projets actifs uniquement (hors archivés projet + feature). */
export function initiativesForActiveProjects(
  initiatives: SttnsInitiative[],
  activeProjects: SttnsProject[]
): SttnsInitiative[] {
  const activeIds = new Set(activeProjects.map((p) => p.id));
  return initiatives.filter((i) => activeIds.has(i.project_id) && !i.archived_at);
}

export type ProjectPortfolioRow = {
  project: SttnsProject;
  governance: ReturnType<typeof computeGovernanceStats>;
};

export function buildActiveProjectPortfolio(
  projects: SttnsProject[],
  initiatives: SttnsInitiative[]
): ProjectPortfolioRow[] {
  return projects.map((project) => {
    const list = initiatives.filter((i) => i.project_id === project.id && !i.archived_at);
    return {
      project,
      governance: computeGovernanceStats(list),
    };
  });
}
