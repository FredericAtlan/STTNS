import type { SupabaseClient } from "@supabase/supabase-js";
import {
  cascadeOnFeatureDevDone,
  fetchInitiativeCascadeTarget,
} from "@/lib/sttns/agileCascade";
import { isBuildGovernanceFeature } from "@/lib/sttns/governanceAxes";
import type { SttnsInitiativeExecutionStatus } from "@/types/sttns";

/**
 * Livraison auto : ne dépend pas des parties (checklist indicative).
 * Déclenchée quand la feature passe en test avec l'option activée
 * (= signal « prête après revue / livraison »).
 */
export async function tryAutoDeployOnReview(
  supabase: SupabaseClient,
  projectId: string,
  initiativeId: string
): Promise<{ deployed: boolean }> {
  const { data: initiative } = await supabase
    .from("sttns_initiatives")
    .select(
      "execution_status, execution_auto_deploy, status, review_status, phase1_status, final_decision, decision, ceo_final_phase2, workflow_status"
    )
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .single();

  if (!initiative) return { deployed: false };
  if (!initiative.execution_auto_deploy) return { deployed: false };
  if (!isBuildGovernanceFeature(initiative)) return { deployed: false };

  const executionStatus = (initiative.execution_status ??
    "pending") as SttnsInitiativeExecutionStatus;
  if (executionStatus !== "in_test") return { deployed: false };

  const target = await fetchInitiativeCascadeTarget(supabase, projectId, initiativeId);
  if (!target) return { deployed: false };

  await cascadeOnFeatureDevDone(supabase, projectId, target);
  return { deployed: true };
}
