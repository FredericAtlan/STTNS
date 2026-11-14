import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import type { ProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";

/** Lien backlog / kanban filtré par cycle selon le mode d'exécution du projet. */
export function executionCycleHref(
  projectSlug: string,
  cycleId: string,
  settings: Pick<ProjectWorkflowSettings, "executionUnit">
): string {
  const base = `/projects/${projectSlug}`;
  if (isFeatureExecutionMode(settings)) {
    return `${base}/kanban?cycle_id=${cycleId}`;
  }
  return `${base}/user-stories?cycle_id=${cycleId}`;
}

/** Surface d'exécution principale (sans filtre cycle). */
export function executionBacklogHref(
  projectSlug: string,
  settings: Pick<ProjectWorkflowSettings, "executionUnit">
): string {
  const base = `/projects/${projectSlug}`;
  return isFeatureExecutionMode(settings) ? `${base}/kanban` : `${base}/user-stories`;
}
