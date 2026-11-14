import type { SupabaseClient } from "@supabase/supabase-js";
import { isExecutionGovernanceFeature } from "@/lib/sttns/governanceAxes";
import { canUserFinalizeAsCeo } from "@/lib/sttns/governance";
import { insertExecutionHistoryEntry } from "@/lib/sttns/executionHistory";
import { applyExecutionQueueReorder } from "@/lib/sttns/executionBacklog";
import { createTasksForUsers, cancelOpenTasksForAsset } from "@/lib/sttns/tasks";
import type {
  SttnsExecutionProposalStatus,
  SttnsInitiativeExecutionProposal,
  SttnsPlacementReasonType,
  SttnsProfile,
  SttnsProjectMember,
} from "@/types/sttns";

type Supabase = SupabaseClient;

export async function getProjectExecutionSettings(supabase: Supabase, projectId: string) {
  const { data } = await supabase
    .from("sttns_projects")
    .select("auto_act_on_consensus, ceo_delegate_user_id")
    .eq("id", projectId)
    .single();

  return data;
}

export async function fetchPendingExecutionProposal(
  supabase: Supabase,
  projectId: string
): Promise<SttnsInitiativeExecutionProposal | null> {
  const { data } = await supabase
    .from("sttns_initiative_execution_proposals")
    .select("*")
    .eq("project_id", projectId)
    .eq("status", "pending")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data as SttnsInitiativeExecutionProposal | null) ?? null;
}

async function cancelPendingProposalsForProject(
  supabase: Supabase,
  projectId: string,
  exceptId?: string
) {
  let query = supabase
    .from("sttns_initiative_execution_proposals")
    .update({ status: "cancelled" satisfies SttnsExecutionProposalStatus })
    .eq("project_id", projectId)
    .eq("status", "pending");

  if (exceptId) query = query.neq("id", exceptId);
  await query;
}

async function getCeoTaskRecipientIds(
  supabase: Supabase,
  projectId: string
): Promise<string[]> {
  const settings = await getProjectExecutionSettings(supabase, projectId);
  const { data: members } = await supabase
    .from("sttns_project_members")
    .select("user_id, role")
    .eq("project_id", projectId);

  const ids = new Set<string>();
  for (const member of members ?? []) {
    if (member.role === "ceo") ids.add(member.user_id);
  }
  if (settings?.ceo_delegate_user_id) ids.add(settings.ceo_delegate_user_id);
  return Array.from(ids);
}

export async function createExecutionOrderProposal(
  supabase: Supabase,
  input: {
    projectId: string;
    initiativeId: string;
    proposedBy: string;
    targetIndex: number;
    reasonType: SttnsPlacementReasonType;
    comment: string;
    featureLabel: string;
  }
): Promise<{ ok: true; proposalId: string } | { ok: false; error: string }> {
  const { data: initiatives } = await supabase
    .from("sttns_initiatives")
    .select("id, execution_sort_order, status, review_status, phase1_status, final_decision, decision, ceo_final_phase2, workflow_status, execution_status")
    .eq("project_id", input.projectId)
    .in("execution_status", ["pending", "in_development"])
    .is("archived_at", null)
    .order("execution_sort_order");

  const reorderable = (initiatives ?? []).filter((row) =>
    isExecutionGovernanceFeature(row as Parameters<typeof isExecutionGovernanceFeature>[0])
  );

  const fromIndex = reorderable.findIndex((row) => row.id === input.initiativeId);
  if (fromIndex < 0) return { ok: false, error: "Feature introuvable dans la file d'exécution." };

  const clampedIndex = Math.max(0, Math.min(input.targetIndex, reorderable.length - 1));
  if (fromIndex === clampedIndex) return { ok: false, error: "Position inchangée." };

  const oldSortOrder = (reorderable[fromIndex].execution_sort_order as number) ?? 0;
  const newSortOrder = (clampedIndex + 1) * 10;

  await cancelPendingProposalsForProject(supabase, input.projectId);
  await cancelOpenTasksForAsset(input.projectId, "initiative", input.initiativeId);

  const { data: proposal, error } = await supabase
    .from("sttns_initiative_execution_proposals")
    .insert({
      project_id: input.projectId,
      initiative_id: input.initiativeId,
      proposed_by: input.proposedBy,
      old_sort_order: oldSortOrder,
      new_sort_order: newSortOrder,
      target_index: clampedIndex,
      reason_type: input.reasonType,
      comment: input.comment,
      status: "pending",
    })
    .select("id")
    .single();

  if (error || !proposal) return { ok: false, error: error?.message ?? "Erreur création proposition." };

  const recipientIds = await getCeoTaskRecipientIds(supabase, input.projectId);
  await createTasksForUsers(input.projectId, recipientIds, {
    task_type: "ceo_approve_execution_order",
    asset_type: "initiative",
    asset_id: input.initiativeId,
    title: `Valider ordre exécution — ${input.featureLabel}`,
  });

  return { ok: true, proposalId: proposal.id as string };
}

export async function approveExecutionOrderProposal(
  supabase: Supabase,
  input: {
    projectId: string;
    proposalId: string;
    reviewerId: string;
    members: Pick<SttnsProjectMember, "user_id" | "role">[];
    delegateUserId?: string | null;
    ceoComment?: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canUserFinalizeAsCeo(input.members, input.reviewerId, input.delegateUserId)) {
    return { ok: false, error: "Seul le CEO, le délégué D1 ou l'admin plateforme peut valider." };
  }

  const { data: proposal } = await supabase
    .from("sttns_initiative_execution_proposals")
    .select("*")
    .eq("id", input.proposalId)
    .eq("project_id", input.projectId)
    .eq("status", "pending")
    .maybeSingle();

  if (!proposal) return { ok: false, error: "Proposition introuvable ou déjà traitée." };

  const row = proposal as SttnsInitiativeExecutionProposal;
  const applied = await applyExecutionQueueReorder(
    supabase,
    input.projectId,
    row.initiative_id,
    row.target_index
  );
  if (!applied.ok) return applied;

  await supabase
    .from("sttns_initiatives")
    .update({
      placement_reason_type: row.reason_type,
      placement_comment: row.comment,
    })
    .eq("id", row.initiative_id)
    .eq("project_id", input.projectId);

  await supabase
    .from("sttns_initiative_execution_proposals")
    .update({
      status: "approved",
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
      ceo_comment: input.ceoComment?.trim() || null,
      new_sort_order: applied.newSortOrder,
    })
    .eq("id", input.proposalId);

  const historyResult = await insertExecutionHistoryEntry(supabase, {
    initiativeId: row.initiative_id,
    changedBy: row.proposed_by,
    oldSortOrder: applied.oldSortOrder,
    newSortOrder: applied.newSortOrder,
    reasonType: row.reason_type,
    comment: row.comment,
    eventKind: "applied",
    reviewedBy: input.reviewerId,
    ceoComment: input.ceoComment?.trim() || null,
    proposalId: row.id,
  });
  if (!historyResult.ok) return historyResult;

  await cancelOpenTasksForAsset(input.projectId, "initiative", row.initiative_id);

  return { ok: true };
}

export async function rejectExecutionOrderProposal(
  supabase: Supabase,
  input: {
    projectId: string;
    proposalId: string;
    reviewerId: string;
    members: Pick<SttnsProjectMember, "user_id" | "role">[];
    delegateUserId?: string | null;
    ceoComment: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!canUserFinalizeAsCeo(input.members, input.reviewerId, input.delegateUserId)) {
    return { ok: false, error: "Seul le CEO, le délégué D1 ou l'admin plateforme peut rejeter." };
  }

  const trimmed = input.ceoComment.trim();
  if (!trimmed) return { ok: false, error: "Un motif de rejet est obligatoire." };

  const { data: proposal } = await supabase
    .from("sttns_initiative_execution_proposals")
    .select("*")
    .eq("id", input.proposalId)
    .eq("project_id", input.projectId)
    .eq("status", "pending")
    .maybeSingle();

  if (!proposal) return { ok: false, error: "Proposition introuvable ou déjà traitée." };

  const row = proposal as SttnsInitiativeExecutionProposal;

  await supabase
    .from("sttns_initiative_execution_proposals")
    .update({
      status: "rejected",
      reviewed_by: input.reviewerId,
      reviewed_at: new Date().toISOString(),
      ceo_comment: trimmed,
    })
    .eq("id", input.proposalId);

  const historyResult = await insertExecutionHistoryEntry(supabase, {
    initiativeId: row.initiative_id,
    changedBy: row.proposed_by,
    oldSortOrder: row.old_sort_order,
    newSortOrder: row.new_sort_order,
    reasonType: row.reason_type,
    comment: row.comment,
    eventKind: "rejected",
    reviewedBy: input.reviewerId,
    ceoComment: trimmed,
    proposalId: row.id,
  });
  if (!historyResult.ok) return historyResult;

  await cancelOpenTasksForAsset(input.projectId, "initiative", row.initiative_id);

  return { ok: true };
}

export async function enrichProposalWithProfiles(
  supabase: Supabase,
  proposal: SttnsInitiativeExecutionProposal | null
): Promise<SttnsInitiativeExecutionProposal | null> {
  if (!proposal) return null;

  const ids = [proposal.proposed_by, proposal.reviewed_by].filter(Boolean) as string[];
  if (ids.length === 0) return proposal;

  const { data: profiles } = await supabase
    .from("sttns_profiles")
    .select("id, full_name, email")
    .in("id", ids);

  const byId = Object.fromEntries(((profiles ?? []) as SttnsProfile[]).map((p) => [p.id, p]));

  return {
    ...proposal,
    proposer: byId[proposal.proposed_by],
    reviewer: proposal.reviewed_by ? byId[proposal.reviewed_by] : undefined,
  };
}
