"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectCeoAdmin, requireProjectMember } from "@/lib/sttns/access";
import { countPendingReviews, saveCeoFinalDecision, savePeerReview, submitAssetForReview } from "@/lib/sttns/savePeerReview";
import { reopenAssetForRevision } from "@/lib/sttns/reopenAsset";
import {
  canUserFinalizeAsCeo,
  ceoDecisionFromBucket,
  committeePeerUserIds,
  committeeVoteFromBucket,
  isInitiativeOpenForCeoFinalize,
  isInitiativeOpenForCommitteeVote,
} from "@/lib/sttns/governance";
import type { GovernanceVoteBucket } from "@/lib/sttns/governanceAxes";
import type {
  SttnsAssetType,
  SttnsContentVerdict,
  SttnsDecision,
  SttnsHorizonOpinion,
} from "@/types/sttns";

function revalidateAll(slug: string) {
  revalidatePath(`/projects/${slug}/team`);
  revalidatePath(`/projects/${slug}/personas`);
  revalidatePath(`/projects/${slug}/user-stories`);
  revalidatePath(`/projects/${slug}/epics`);
  revalidatePath(`/projects/${slug}/features`);
  revalidatePath(`/projects/${slug}/features/arbitrage`);
  revalidatePath("/me/tasks");
}

export async function reopenAssetForRevisionAction(
  projectId: string,
  projectSlug: string,
  assetType: SttnsAssetType,
  assetId: string
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const result = await reopenAssetForRevision(supabase, {
    projectId,
    assetType,
    assetId,
  });
  if (result.ok) revalidateAll(projectSlug);
  return result;
}

export async function submitForReviewAction(
  projectId: string,
  projectSlug: string,
  assetType: SttnsAssetType,
  assetId: string,
  title: string,
  authorId: string | null,
  submitComment?: string | null
) {
  const result = await submitAssetForReview(
    projectId,
    assetType,
    assetId,
    title,
    authorId,
    assetType === "initiative" ? { submitComment } : undefined
  );
  if (result.ok) revalidateAll(projectSlug);
  return result;
}

export async function savePeerReviewAction(
  projectId: string,
  projectSlug: string,
  assetType: SttnsAssetType,
  assetId: string,
  data: {
    content_verdict: SttnsContentVerdict;
    horizon?: SttnsHorizonOpinion | null;
    phase1_suggestion?: string | null;
    comment?: string | null;
  },
  authorId?: string | null
) {
  const result = await savePeerReview(projectId, assetType, assetId, data, authorId);
  if (result.ok) revalidateAll(projectSlug);
  return result;
}

export async function saveCeoFinalAction(
  projectId: string,
  projectSlug: string,
  assetType: SttnsAssetType,
  assetId: string,
  data: { decision: SttnsDecision | null; comment: string }
) {
  const result = await saveCeoFinalDecision(projectId, assetType, assetId, data);
  if (result.ok) revalidateAll(projectSlug);
  return result;
}

export async function kanbanGovernanceDropAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  targetBucket: GovernanceVoteBucket,
  authorId: string | null
) {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { data: initiative } = await supabase
    .from("sttns_initiatives")
    .select("review_status, created_by")
    .eq("id", initiativeId)
    .eq("project_id", projectId)
    .single();

  if (!initiative) {
    return { ok: false as const, error: "Feature introuvable." };
  }

  const reviewStatus = initiative.review_status;

  if (isInitiativeOpenForCommitteeVote(reviewStatus)) {
    const { data: members } = await supabase
      .from("sttns_project_members")
      .select("user_id, role")
      .eq("project_id", projectId);
    const peerIds = committeePeerUserIds(members ?? []);
    if (!peerIds.includes(access.userId)) {
      return { ok: false as const, error: "Seuls les membres du comité peuvent voter." };
    }

    const vote = committeeVoteFromBucket(targetBucket);
    const result = await savePeerReview(
      projectId,
      "initiative",
      initiativeId,
      vote,
      initiative.created_by ?? authorId
    );
    if (result.ok) revalidateAll(projectSlug);
    return result;
  }

  if (isInitiativeOpenForCeoFinalize(reviewStatus)) {
    const [{ data: profile }, { data: members }, { data: settings }] = await Promise.all([
      supabase.from("sttns_profiles").select("platform_role").eq("id", access.userId).single(),
      supabase.from("sttns_project_members").select("user_id, role").eq("project_id", projectId),
      supabase.from("sttns_projects").select("ceo_delegate_user_id").eq("id", projectId).single(),
    ]);

    const { isPlatformAdmin } = await import("@/lib/sttns/auth");
    const canFinalize =
      isPlatformAdmin(profile) ||
      canUserFinalizeAsCeo(members ?? [], access.userId, settings?.ceo_delegate_user_id);

    if (!canFinalize) {
      return { ok: false as const, error: "Seul le CEO (ou délégué) peut confirmer." };
    }

    const result = await saveCeoFinalDecision(projectId, "initiative", initiativeId, {
      decision: ceoDecisionFromBucket(targetBucket),
      comment: "",
    });
    if (result.ok) revalidateAll(projectSlug);
    return result;
  }

  return { ok: false as const, error: "Glisser-déposer non disponible pour cet état." };
}

export async function kanbanSubmitForReviewAction(
  projectId: string,
  projectSlug: string,
  initiativeId: string,
  title: string,
  authorId: string | null
) {
  const result = await submitAssetForReview(
    projectId,
    "initiative",
    initiativeId,
    title,
    authorId
  );
  if (result.ok) revalidateAll(projectSlug);
  return result;
}

export async function updateProjectGovernanceAction(
  projectId: string,
  projectSlug: string,
  data: {
    auto_act_on_consensus: boolean;
    ceo_delegate_user_id: string | null;
    force?: boolean;
  }
) {
  const admin = await requireProjectCeoAdmin(projectId);
  if (!admin.ok) {
    return { ok: false as const, error: admin.error };
  }

  const supabase = await createClient();
  const pending = await countPendingReviews(projectId);
  if (pending > 0 && !data.force) {
    return {
      ok: false as const,
      error: `${pending} élément(s) encore en revue. Clôturez-les ou cochez « forcer ».`,
      pending,
    };
  }

  if (data.ceo_delegate_user_id) {
    const { data: delegateMember } = await supabase
      .from("sttns_project_members")
      .select("id")
      .eq("project_id", projectId)
      .eq("user_id", data.ceo_delegate_user_id)
      .limit(1)
      .maybeSingle();
    if (!delegateMember) {
      return {
        ok: false as const,
        error: "Le délégué doit être membre du projet.",
      };
    }
  }

  const { data: current } = await supabase
    .from("sttns_projects")
    .select("auto_act_on_consensus, ceo_delegate_user_id")
    .eq("id", projectId)
    .single();

  const { error } = await supabase
    .from("sttns_projects")
    .update({
      auto_act_on_consensus: data.auto_act_on_consensus,
      ceo_delegate_user_id: data.ceo_delegate_user_id,
      validation_mode: "peer_ceo",
      consensus_percent: 100,
    })
    .eq("id", projectId);

  if (error) return { ok: false as const, error: error.message };

  if (current) {
    await supabase.from("sttns_project_settings_audit").insert({
      project_id: projectId,
      changed_by: admin.userId,
      field_name: "governance",
      old_value: JSON.stringify(current),
      new_value: JSON.stringify({
        auto_act_on_consensus: data.auto_act_on_consensus,
        ceo_delegate_user_id: data.ceo_delegate_user_id,
      }),
      forced: !!data.force,
    });
  }

  revalidatePath(`/projects/${projectSlug}/team`);
  return { ok: true as const };
}

export async function removeProjectMemberAction(
  projectId: string,
  projectSlug: string,
  userId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = await requireProjectCeoAdmin(projectId);
  if (!admin.ok) return { ok: false, error: admin.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_project_members")
    .delete()
    .eq("project_id", projectId)
    .eq("user_id", userId);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/projects/${projectSlug}/team`);
  return { ok: true };
}

export async function toggleMemberRoleAction(
  projectId: string,
  projectSlug: string,
  userId: string,
  role: string,
  assign: boolean
) {
  const admin = await requireProjectCeoAdmin(projectId);
  if (!admin.ok) return { ok: false as const, error: admin.error };

  const supabase = await createClient();

  if (assign) {
    const { error } = await supabase.from("sttns_project_members").insert({
      project_id: projectId,
      user_id: userId,
      role,
    });
    if (error) {
      return {
        ok: false as const,
        error: error.message.includes("duplicate") ? "Rôle déjà assigné." : error.message,
      };
    }
  } else {
    const { error } = await supabase
      .from("sttns_project_members")
      .delete()
      .eq("project_id", projectId)
      .eq("user_id", userId)
      .eq("role", role);
    if (error) return { ok: false as const, error: error.message };
  }

  revalidatePath(`/projects/${projectSlug}/team`);
  return { ok: true as const };
}
