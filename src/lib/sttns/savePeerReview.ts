import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { isPlatformAdmin } from "@/lib/sttns/auth";
import { DRAFT_READONLY_MESSAGE } from "@/lib/sttns/draftOwnership";
import {
  governanceAssetTable,
  usesCommitteeGovernance,
} from "@/lib/sttns/assetGovernance";
import { legacyPersonaWriteForbidden } from "@/lib/sttns/legacyPersonasFreeze";
import {
  cascadeOnFeatureBuildApproved,
  shouldCascadeFeatureToSprint,
  fetchInitiativeCascadeTarget,
} from "@/lib/sttns/agileCascade";
import {
  assertInitiativeCommitteeReady,
  fetchInitiativeLinkedStory,
  fetchInitiativeLinkedPersona,
  fetchInitiativeLinkedEpic,
  type InitiativeCommitteeInput,
} from "@/lib/sttns/initiativeCommitteeReady";
import {
  assertPersonaCommitteeReady,
  fetchPersonaForCommittee,
} from "@/lib/personas/personaCommitteeReady";
import {
  assertEpicCommitteeReady,
  loadEpicCommitteeContext,
} from "@/lib/epics/epicCommitteeReady";
import {
  canUserFinalizeAsCeo,
  committeeConsensusDecision,
  committeePeerUserIds,
  computeFeatureConsensus,
  isProjectCeo,
} from "@/lib/sttns/governance";
import {
  cancelOpenTasksForAsset,
  completeTaskForUser,
  createTasksForUsers,
} from "@/lib/sttns/tasks";
import {
  assertUserStoryComplete,
  type UserStoryCompletenessInput,
} from "@/lib/sttns/userStoryComplete";
import type {
  SttnsAssetType,
  SttnsContentVerdict,
  SttnsDecision,
  SttnsHorizonOpinion,
  SttnsPeerReview,
  SttnsReviewStatus,
} from "@/types/sttns";

async function getProjectMembers(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_project_members")
    .select("user_id, role")
    .eq("project_id", projectId);
  return data ?? [];
}

async function getProjectSettings(projectId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_projects")
    .select("auto_act_on_consensus, ceo_delegate_user_id, slug")
    .eq("id", projectId)
    .single();
  return data;
}

function ceoFinalizerUserIds(
  members: { user_id: string; role: string }[],
  delegateUserId: string | null | undefined
): string[] {
  const ids = new Set<string>();
  for (const member of members) {
    if (member.role === "ceo") ids.add(member.user_id);
  }
  if (delegateUserId) ids.add(delegateUserId);
  return Array.from(ids);
}

async function notifyCeoFinalizers(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string,
  label: string,
  members: { user_id: string; role: string }[],
  delegateUserId: string | null | undefined
) {
  const finalizers = ceoFinalizerUserIds(members, delegateUserId);
  if (!finalizers.length) return;
  await createTasksForUsers(projectId, finalizers, {
    task_type: "ceo_finalize_feature",
    asset_type: assetType,
    asset_id: assetId,
    title: `Trancher : ${label}`,
  });
}

async function fetchReviews(projectId: string, assetType: SttnsAssetType, assetId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_peer_reviews")
    .select("*")
    .eq("project_id", projectId)
    .eq("asset_type", assetType)
    .eq("asset_id", assetId);
  return (data ?? []) as SttnsPeerReview[];
}

async function logInitiativeEvent(
  initiativeId: string,
  actorId: string | null,
  eventType: string,
  payload: Record<string, unknown>
) {
  const supabase = await createClient();
  await supabase.from("sttns_initiative_events").insert({
    initiative_id: initiativeId,
    actor_id: actorId,
    event_type: eventType,
    payload,
  });
}

async function updateAssetReviewStatus(
  assetType: SttnsAssetType,
  assetId: string,
  status: SttnsReviewStatus
) {
  const supabase = await createClient();
  await supabase.from(governanceAssetTable(assetType)).update({ review_status: status }).eq("id", assetId);
}

async function fetchAssetLabel(
  assetType: SttnsAssetType,
  assetId: string,
  projectId: string
): Promise<string> {
  const supabase = await createClient();
  const table = governanceAssetTable(assetType);
  if (assetType === "initiative") {
    const { data } = await supabase
      .from(table)
      .select("feature_name, feature_code")
      .eq("id", assetId)
      .eq("project_id", projectId)
      .single();
    return data?.feature_code
      ? `${data.feature_code} — ${data.feature_name}`
      : data?.feature_name ?? "Feature";
  }
  if (assetType === "persona") {
    const { data } = await supabase
      .from(table)
      .select("name, persona_code")
      .eq("id", assetId)
      .eq("project_id", projectId)
      .single();
    return data?.persona_code ? `${data.persona_code} — ${data.name}` : data?.name ?? "Persona";
  }
  if (assetType === "epic") {
    const { data } = await supabase
      .from(table)
      .select("title")
      .eq("id", assetId)
      .eq("project_id", projectId)
      .single();
    return data?.title ?? "Epic";
  }
  const { data } = await supabase
    .from(table)
    .select("title, context_label")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();
  const title = data?.title ?? "User story";
  return data?.context_label ? `${title} (${data.context_label})` : title;
}

async function applyValidatedDecision(
  assetType: SttnsAssetType,
  assetId: string,
  projectId: string,
  decision: SttnsDecision,
  actorId: string | null
) {
  const supabase = await createClient();
  const table = governanceAssetTable(assetType);
  const now = new Date().toISOString();

  if (assetType === "initiative") {
    const finalStatus = decision === "kill" ? "parking_lot" : "approved";
    await supabase
      .from(table)
      .update({
        review_status: "validated",
        status: finalStatus,
        final_decision: decision,
      })
      .eq("id", assetId);
    if (finalStatus === "approved" && shouldCascadeFeatureToSprint(decision)) {
      const target = await fetchInitiativeCascadeTarget(supabase, projectId, assetId);
      if (target) await cascadeOnFeatureBuildApproved(supabase, projectId, target, actorId);
    }
    return;
  }

  if (assetType === "user_story") {
    const patch: Record<string, unknown> = {
      review_status: "validated",
      final_decision: decision,
    };
    if (decision === "kill") {
      patch.archived_at = now;
    } else {
      patch.status = "validated";
    }
    await supabase.from(table).update(patch).eq("id", assetId);
    return;
  }

  if (assetType === "epic") {
    const patch: Record<string, unknown> = {
      review_status: "validated",
      final_decision: decision,
    };
    if (decision === "kill") {
      patch.archived_at = now;
    } else {
      patch.status = "ready";
    }
    await supabase.from(table).update(patch).eq("id", assetId);
    return;
  }

  const patch: Record<string, unknown> = {
    review_status: "validated",
    final_decision: decision,
    persona_status: "READY",
  };
  if (decision === "kill") {
    patch.archived_at = now;
  }
  await supabase.from(table).update(patch).eq("id", assetId);
}

export async function submitAssetForReview(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string,
  title: string,
  authorId: string | null,
  options?: { submitComment?: string | null }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // Étape A3 — peer-review persona (catalogue legacy) gelé.
  // La table `sttns_personas` est en lecture seule (Étape C) et le peer-review
  // écrit `review_status` / `persona_status` sur cette table : on bloque l'entrée.
  if (assetType === "persona") {
    const frozen = legacyPersonaWriteForbidden();
    if (frozen) return { ok: false, error: frozen.error };
  }

  const supabase = await createClient();
  const members = await getProjectMembers(projectId);
  const memberIds = Array.from(new Set(members.map((m) => m.user_id)));
  if (memberIds.length === 0) {
    return { ok: false, error: "Add team members before submitting for review." };
  }

  if (usesCommitteeGovernance(assetType) && !members.some((m) => m.role === "ceo")) {
    return {
      ok: false,
      error: "Assign a CEO to this project before submitting for committee review.",
    };
  }

  const table = governanceAssetTable(assetType);

  const selectFields =
    assetType === "persona"
      ? "review_status, created_by, name, persona_code, tier_label, profile_summary, persona_status"
      : assetType === "user_story"
        ? "review_status, created_by, status, epic_id, initiative_id, primary_persona_id, target_persona_job_id, sprint_want, sprint_so_that, impact_metric_id, impacts_north_star, actions"
        : assetType === "epic"
          ? "review_status, created_by, title, objective, status"
          : "review_status, created_by, feature_name, feature_code, status, epic_id, persona_id, metric_id, nsm_link_clear, technical_solution, rice_reach, rice_impact, rice_confidence, rice_effort, user_story_id";

  const { data: asset, error: assetErr } = await supabase
    .from(table)
    .select(selectFields)
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();

  if (assetErr || !asset) {
    return { ok: false, error: assetErr?.message ?? "Asset not found." };
  }

  type SubmitAssetRow = {
    review_status: SttnsReviewStatus;
    created_by?: string | null;
  };

  const assetRow = asset as unknown as SubmitAssetRow;
  const createdBy = assetRow.created_by;

  const { data: submitProfile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", access.userId)
    .single();
  const platformAdmin = isPlatformAdmin(submitProfile);

  if (usesCommitteeGovernance(assetType)) {
    const submitter = createdBy ?? authorId ?? access.userId;
    if (!platformAdmin && createdBy && createdBy !== access.userId) {
      return { ok: false, error: DRAFT_READONLY_MESSAGE };
    }
    authorId = submitter;
  } else if (!platformAdmin && createdBy && createdBy !== access.userId) {
    return { ok: false, error: DRAFT_READONLY_MESSAGE };
  }

  const status = assetRow.review_status;
  if (status !== "draft" && status !== "changes_requested") {
    return { ok: false, error: "Asset is not in a submittable state." };
  }

  if (assetType === "user_story") {
    const storyRow = asset as UserStoryCompletenessInput & {
      status?: string;
    };
    if (storyRow.status !== "proposed") {
      return {
        ok: false,
        error: "Seules les stories au statut Proposed peuvent être soumises pour validation.",
      };
    }
    const completeness = assertUserStoryComplete(storyRow);
    if (!completeness.ok) return completeness;
  }

  if (assetType === "persona") {
    const personaFull = await fetchPersonaForCommittee(supabase, projectId, assetId);
    if (!personaFull) return { ok: false, error: "Persona introuvable." };
    const readiness = assertPersonaCommitteeReady(personaFull);
    if (!readiness.ok) return readiness;
  }

  if (assetType === "epic") {
    const { epic, linkedStories } = await loadEpicCommitteeContext(supabase, projectId, assetId);
    if (!epic) return { ok: false, error: "Epic introuvable." };
    const readiness = assertEpicCommitteeReady(epic, linkedStories);
    if (!readiness.ok) return readiness;
  }

  if (assetType === "initiative") {
    const initiativeRow = asset as unknown as InitiativeCommitteeInput;
    const linkedStory = await fetchInitiativeLinkedStory(
      supabase,
      projectId,
      initiativeRow.user_story_id
    );
    const linkedPersona = await fetchInitiativeLinkedPersona(
      supabase,
      projectId,
      initiativeRow.persona_id
    );
    const linkedEpic = await fetchInitiativeLinkedEpic(
      supabase,
      projectId,
      initiativeRow.epic_id
    );
    const readiness = assertInitiativeCommitteeReady(
      initiativeRow,
      linkedStory,
      linkedPersona,
      linkedEpic
    );
    if (!readiness.ok) return readiness;
  }

  await cancelOpenTasksForAsset(projectId, assetType, assetId);
  await supabase
    .from("sttns_peer_reviews")
    .delete()
    .eq("project_id", projectId)
    .eq("asset_type", assetType)
    .eq("asset_id", assetId);

  await updateAssetReviewStatus(assetType, assetId, "in_review");

  if (usesCommitteeGovernance(assetType)) {
    const creatorId = authorId ?? access.userId;
    await supabase.from("sttns_peer_reviews").insert({
      project_id: projectId,
      asset_type: assetType,
      asset_id: assetId,
      reviewer_id: creatorId,
      content_verdict: "approve",
      horizon: "mvp_now",
      comment: options?.submitComment?.trim() || "Validé par soumission.",
    });

    const peerIds = committeePeerUserIds(members);
    const reviewers = peerIds.filter((id) => id !== creatorId);
    if (reviewers.length) {
      await createTasksForUsers(projectId, reviewers, {
        task_type: "feature_opinion",
        asset_type: assetType,
        asset_id: assetId,
        title: `Vote BUILD · LEARN · KILL : ${title}`,
      });
    }

    await evaluateConsensus(projectId, assetType, assetId, creatorId);
  }

  return { ok: true };
}

export async function savePeerReview(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string,
  data: {
    content_verdict: SttnsContentVerdict;
    horizon?: SttnsHorizonOpinion | null;
    phase1_suggestion?: string | null;
    comment?: string | null;
  },
  authorId?: string | null
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const user = { id: access.userId };

  if (authorId && user.id === authorId && usesCommitteeGovernance(assetType)) {
    return {
      ok: false,
      error: "Le créateur a validé en soumettant — modification via une nouvelle soumission.",
    };
  }

  if (data.content_verdict === "request_changes" && !data.comment?.trim()) {
    return { ok: false, error: "Commentaire obligatoire pour demander des modifications." };
  }

  const table = governanceAssetTable(assetType);
  const { data: assetRow } = await supabase
    .from(table)
    .select("review_status")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();

  if (!assetRow || assetRow.review_status !== "in_review") {
    return { ok: false, error: "This item is not open for review." };
  }

  const { error } = await supabase.from("sttns_peer_reviews").upsert(
    {
      project_id: projectId,
      asset_type: assetType,
      asset_id: assetId,
      reviewer_id: user.id,
      content_verdict: data.content_verdict,
      horizon: usesCommitteeGovernance(assetType) ? data.horizon ?? "mvp_now" : null,
      phase1_suggestion: data.phase1_suggestion ?? null,
      comment: data.comment?.trim() || null,
    },
    { onConflict: "project_id,asset_type,asset_id,reviewer_id" }
  );

  if (error) return { ok: false, error: error.message };

  await completeTaskForUser(user.id, assetType, assetId, ["feature_opinion"]);

  await evaluateConsensus(projectId, assetType, assetId, authorId ?? null);
  return { ok: true };
}

export async function reconcileFeatureCommittee(
  projectId: string,
  assetId: string,
  authorId: string | null
): Promise<void> {
  const supabase = await createClient();
  await supabase
    .from("sttns_peer_reviews")
    .update({ horizon: "mvp_now" })
    .eq("project_id", projectId)
    .eq("asset_type", "initiative")
    .eq("asset_id", assetId)
    .is("horizon", null)
    .eq("content_verdict", "approve");

  await evaluateConsensus(projectId, "initiative", assetId, authorId);
}

async function evaluateConsensus(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string,
  authorId: string | null
) {
  const settings = await getProjectSettings(projectId);
  if (!settings) return;

  const members = await getProjectMembers(projectId);
  const reviews = await fetchReviews(projectId, assetType, assetId);
  const peerIds = committeePeerUserIds(members);
  const result = computeFeatureConsensus(reviews, peerIds);
  const label = await fetchAssetLabel(assetType, assetId, projectId);
  const supabase = await createClient();
  const table = governanceAssetTable(assetType);

  if (reviews.some((r) => r.content_verdict === "request_changes")) {
    await updateAssetReviewStatus(assetType, assetId, "changes_requested");
    await cancelOpenTasksForAsset(projectId, assetType, assetId);
    if (authorId) {
      await createTasksForUsers(projectId, [authorId], {
        task_type: "feature_opinion",
        asset_type: assetType,
        asset_id: assetId,
        title: `Modifications demandées : ${label}`,
      });
    }
    return;
  }

  if (!result.allResponded) return;

  const { data: assetBefore } = await supabase
    .from(table)
    .select("review_status, status, final_decision")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();

  const committeeDecision = committeeConsensusDecision(reviews, peerIds);

  if (result.consensus && committeeDecision) {
    if (settings.auto_act_on_consensus) {
      await applyValidatedDecision(assetType, assetId, projectId, committeeDecision, null);
      if (assetType === "initiative") {
        await logInitiativeEvent(assetId, null, "feature_consensus_acted", {
          title: "Décision actée (unanimité)",
          note: `Unanimité du comité — ${committeeDecision.toUpperCase()} acté automatiquement.`,
          changes: [
            {
              field: "review_status",
              label: "Review status",
              before: assetBefore?.review_status ?? null,
              after: "validated",
            },
            {
              field: "final_decision",
              label: "Final decision",
              before: assetBefore?.final_decision ?? null,
              after: committeeDecision,
            },
          ],
        });
      }
      await cancelOpenTasksForAsset(projectId, assetType, assetId);
      return;
    }

    await supabase
      .from(table)
      .update({
        review_status: "aligned",
        final_decision: committeeDecision,
      })
      .eq("id", assetId);

    if (assetType === "initiative") {
      await logInitiativeEvent(assetId, null, "feature_consensus_acted", {
        title: "Comité aligné",
        note: "Unanimité atteinte — validation CEO requise.",
        changes: [
          {
            field: "review_status",
            label: "Review status",
            before: assetBefore?.review_status ?? null,
            after: "aligned",
          },
          {
            field: "final_decision",
            label: "Final decision",
            before: assetBefore?.final_decision ?? null,
            after: committeeDecision,
          },
        ],
      });
    }

    await cancelOpenTasksForAsset(projectId, assetType, assetId);
    await notifyCeoFinalizers(
      projectId,
      assetType,
      assetId,
      label,
      members,
      settings.ceo_delegate_user_id
    );
    return;
  }

  await updateAssetReviewStatus(assetType, assetId, "needs_ceo_decision");
  await cancelOpenTasksForAsset(projectId, assetType, assetId);
  await notifyCeoFinalizers(
    projectId,
    assetType,
    assetId,
    label,
    members,
    settings.ceo_delegate_user_id
  );
}

export async function saveCeoFinalDecision(
  projectId: string,
  assetType: SttnsAssetType,
  assetId: string,
  data: {
    decision: SttnsDecision | null;
    comment: string;
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  // Étape A3 — CEO finalize sur persona (catalogue legacy) gelé.
  // Voir `submitAssetForReview` — sttns_personas est en lecture seule.
  if (assetType === "persona") {
    const frozen = legacyPersonaWriteForbidden();
    if (frozen) return { ok: false, error: frozen.error };
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", access.userId)
    .single();

  const members = await getProjectMembers(projectId);
  const settings = await getProjectSettings(projectId);
  const platformAdmin = isPlatformAdmin(profile);
  const canFinalize =
    platformAdmin ||
    canUserFinalizeAsCeo(members, access.userId, settings?.ceo_delegate_user_id);

  if (!canFinalize) {
    return { ok: false, error: "Only the CEO, delegate, or platform admin can finalize." };
  }

  const user = { id: access.userId };
  const table = governanceAssetTable(assetType);

  const { data: asset } = await supabase
    .from(table)
    .select("review_status, status, final_decision, ceo_final_phase2, ceo_final_comment")
    .eq("id", assetId)
    .eq("project_id", projectId)
    .single();

  if (
    !asset ||
    (asset.review_status !== "aligned" && asset.review_status !== "needs_ceo_decision")
  ) {
    return { ok: false, error: "This item does not require CEO finalization." };
  }

  const finalDecision = data.decision;
  if (!finalDecision) {
    return { ok: false, error: "Une décision BUILD, LEARN ou KILL est requise." };
  }

  const patch: Record<string, unknown> = {
    review_status: "validated",
    ceo_final_phase2: finalDecision,
    ceo_final_comment: data.comment.trim() || null,
    ceo_final_by: user.id,
    ceo_final_at: new Date().toISOString(),
    final_decision: finalDecision,
  };

  if (assetType === "initiative") {
    patch.status = finalDecision === "kill" ? "parking_lot" : "approved";
  } else if (assetType === "user_story") {
    if (finalDecision === "kill") {
      patch.archived_at = new Date().toISOString();
    } else {
      patch.status = "validated";
    }
  } else if (assetType === "persona") {
    patch.persona_status = "READY";
    if (finalDecision === "kill") {
      patch.archived_at = new Date().toISOString();
    }
  } else if (assetType === "epic") {
    if (finalDecision === "kill") {
      patch.archived_at = new Date().toISOString();
    } else {
      patch.status = "ready";
    }
  }

  const { error } = await supabase.from(table).update(patch).eq("id", assetId);
  if (error) return { ok: false, error: error.message };

  if (assetType === "initiative") {
    await logInitiativeEvent(assetId, user.id, "ceo_finalized_feature", {
      title: finalDecision === "kill" ? "CEO a mis la feature en KILL" : "CEO a finalisé la feature",
      note:
        data.comment.trim() ||
        (platformAdmin && !isProjectCeo(members, user.id)
          ? "Validation finale (admin plateforme)."
          : settings?.ceo_delegate_user_id === user.id
            ? "Validation finale (délégation CEO)."
            : finalDecision === "kill"
              ? "Décision finale en parking lot."
              : null),
      changes: [
        {
          field: "status",
          label: "Status",
          before: asset?.status ?? null,
          after: patch.status,
        },
        {
          field: "final_decision",
          label: "Final decision",
          before: asset?.final_decision ?? null,
          after: finalDecision,
        },
        {
          field: "ceo_final_phase2",
          label: "CEO decision",
          before: asset?.ceo_final_phase2 ?? null,
          after: finalDecision,
        },
        {
          field: "review_status",
          label: "Review status",
          before: asset?.review_status ?? null,
          after: "validated",
        },
      ],
    });

    if (patch.status === "approved" && shouldCascadeFeatureToSprint(finalDecision)) {
      const target = await fetchInitiativeCascadeTarget(supabase, projectId, assetId);
      if (target) await cascadeOnFeatureBuildApproved(supabase, projectId, target, user.id);
    }
  }

  await completeTaskForUser(user.id, assetType, assetId, ["ceo_finalize_feature"]);
  await cancelOpenTasksForAsset(projectId, assetType, assetId);

  return { ok: true };
}

/** @deprecated Préférer saveCeoFinalDecision avec assetType explicite. */
export async function saveCeoFinalDecisionLegacy(
  projectId: string,
  initiativeId: string,
  data: { decision: SttnsDecision | null; comment: string }
) {
  return saveCeoFinalDecision(projectId, "initiative", initiativeId, data);
}

export async function countPendingReviews(projectId: string): Promise<number> {
  const supabase = await createClient();
  // Catalogue legacy `sttns_personas` exclu (A3/C) — peer-review persona gelé.
  const tables = [
    { table: "sttns_user_stories", type: "user_story" as const },
    { table: "sttns_epics", type: "epic" as const },
    { table: "sttns_initiatives", type: "initiative" as const },
  ];
  let total = 0;
  for (const { table } of tables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .eq("review_status", "in_review");
    total += count ?? 0;
  }
  for (const { table } of tables) {
    const { count } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("project_id", projectId)
      .in("review_status", ["needs_ceo_decision", "aligned"]);
    total += count ?? 0;
  }
  return total;
}
