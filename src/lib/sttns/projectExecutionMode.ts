import type { ProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";

export type ExecutionUnit = ProjectWorkflowSettings["executionUnit"];

/** Stories + tasks en exécution (défaut, rétrocompatible). */
export function isStoryExecutionMode(
  settings: Pick<ProjectWorkflowSettings, "executionUnit">
): boolean {
  return settings.executionUnit !== "feature";
}

/** Features directement en exécution (pas de stories/tasks côté UI). */
export function isFeatureExecutionMode(
  settings: Pick<ProjectWorkflowSettings, "executionUnit">
): boolean {
  return settings.executionUnit === "feature";
}

/** Création de cycle ↔ epic lié automatiquement. */
export function isEpicEqualsCycle(
  settings: Pick<ProjectWorkflowSettings, "epicEqualsCycle">
): boolean {
  return settings.epicEqualsCycle;
}

/** Les deux options simplifiées actives → modèle Shape Up (Minimal). */
export function isShapeUpMode(
  settings: Pick<ProjectWorkflowSettings, "executionUnit" | "epicEqualsCycle">
): boolean {
  return isFeatureExecutionMode(settings) && isEpicEqualsCycle(settings);
}

/** Variante de badge affichée selon les options simplifiées actives. */
export type SimplifiedModeVariant = "shape_up" | "feature_only" | "epic_cycle";

/**
 * Détermine le badge à afficher :
 * - les deux options → Shape Up
 * - une seule option → libellé spécifique
 * - aucune → null (pas de badge)
 */
export function getSimplifiedModeVariant(
  settings: Pick<ProjectWorkflowSettings, "executionUnit" | "epicEqualsCycle">
): SimplifiedModeVariant | null {
  const feature = isFeatureExecutionMode(settings);
  const epicCycle = isEpicEqualsCycle(settings);

  if (feature && epicCycle) return "shape_up";
  if (feature) return "feature_only";
  if (epicCycle) return "epic_cycle";
  return null;
}
