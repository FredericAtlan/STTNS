import type { GovernanceVoteBucket } from "@/lib/sttns/governanceAxes";
import type {
  SttnsContentVerdict,
  SttnsDecision,
  SttnsHorizonOpinion,
  SttnsPeerReview,
  SttnsProjectMember,
  SttnsReviewStatus,
} from "@/types/sttns";

export const REVIEW_STATUS_LABELS: Record<SttnsReviewStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  validated: "Validated",
  changes_requested: "Changes requested",
  aligned: "Aligned",
  needs_ceo_decision: "Needs CEO decision",
};

export const HORIZON_LABELS: Record<SttnsHorizonOpinion, string> = {
  mvp_now: "MVP now",
  post_mvp: "Post-MVP",
  scale: "Scale",
  not_now: "Not now",
};

export const CONTENT_VERDICT_LABELS: Record<SttnsContentVerdict, string> = {
  approve: "Approve",
  request_changes: "Request changes",
};

export const COMMITTEE_ROLES = ["ceo", "cto", "expert"] as const;
export type CommitteeRole = (typeof COMMITTEE_ROLES)[number];

export const PROJECT_ROLES_UI = ["ceo", "pm", "cto", "expert", "dev"] as const;
export type SttnsProjectRoleUi = (typeof PROJECT_ROLES_UI)[number];

export const PROJECT_ROLE_LABELS: Record<string, string> = {
  ceo: "CEO",
  pm: "PM",
  expert: "Expert",
  cto: "CTO",
  dev: "Dev",
  specialist: "Expert",
  developer: "Dev",
};

export const AUTO_ACT_LABELS = {
  false: "CEO final required",
  true: "Auto-act on unanimous consensus",
} as const;

export function normalizeProjectRole(role: string): CommitteeRole | "unknown" {
  if (role === "specialist") return "expert";
  if (role === "developer" || role === "dev" || role === "pm") return "unknown";
  if (role === "ceo" || role === "cto" || role === "expert") return role;
  return "unknown";
}

export function primaryRoleForMember(roles: string[]): string {
  if (roles.includes("ceo")) return "CEO";
  if (roles.includes("cto")) return "CTO";
  if (roles.includes("pm")) return "PM";
  if (roles.includes("expert") || roles.includes("specialist")) return "Expert";
  if (roles.includes("dev") || roles.includes("developer")) return "Dev";
  return roles[0] ?? "Member";
}

/** Unique users with a committee role (ceo, cto, expert) — 1 user = 1 voix. */
export function committeePeerUserIds(
  members: Pick<SttnsProjectMember, "user_id" | "role">[]
): string[] {
  const ids = new Set<string>();
  for (const member of members) {
    const role = normalizeProjectRole(member.role);
    if (role !== "unknown") ids.add(member.user_id);
  }
  return Array.from(ids);
}

export function isProjectCeo(
  members: Pick<SttnsProjectMember, "user_id" | "role">[],
  userId: string
): boolean {
  return members.some((m) => m.user_id === userId && normalizeProjectRole(m.role) === "ceo");
}

export function canUserFinalizeAsCeo(
  members: Pick<SttnsProjectMember, "user_id" | "role">[],
  userId: string,
  delegateUserId: string | null | undefined
): boolean {
  if (isProjectCeo(members, userId)) return true;
  return !!delegateUserId && delegateUserId === userId;
}

export function countPeerReviewsResponded(
  reviews: SttnsPeerReview[],
  peerUserIds: string[]
): number {
  const done = new Set(reviews.map((r) => r.reviewer_id));
  return peerUserIds.filter((id) => done.has(id)).length;
}

export interface ConsensusResult {
  allResponded: boolean;
  contentConsensus: boolean;
  horizonConsensus: boolean;
  consensus: boolean;
  dominantHorizon: SttnsHorizonOpinion | null;
  approveCount: number;
  memberCount: number;
  horizonPercent: number;
}

/** Unanimity = 100% of unique committee voters approved (content + aligned horizon). */
export function computeFeatureConsensus(
  reviews: SttnsPeerReview[],
  memberUserIds: string[]
): ConsensusResult {
  const memberCount = memberUserIds.length;
  const byUser = new Map(reviews.map((r) => [r.reviewer_id, r]));
  const allResponded = memberCount === 0 || memberUserIds.every((id) => byUser.has(id));

  const opinions = memberUserIds.map((id) => byUser.get(id)).filter(Boolean) as SttnsPeerReview[];
  const approveCount = opinions.filter((o) => o.content_verdict === "approve").length;
  const contentConsensus =
    memberCount > 0 &&
    opinions.length === memberCount &&
    opinions.every((o) => o.content_verdict === "approve");

  const horizons = opinions.map((o) => o.horizon).filter(Boolean) as SttnsHorizonOpinion[];
  let dominantHorizon: SttnsHorizonOpinion | null = null;
  let horizonPercent = 0;

  if (horizons.length) {
    const counts = new Map<SttnsHorizonOpinion, number>();
    for (const h of horizons) counts.set(h, (counts.get(h) ?? 0) + 1);
    let max = 0;
    for (const [h, c] of Array.from(counts.entries())) {
      if (c > max) {
        max = c;
        dominantHorizon = h;
        horizonPercent = memberCount > 0 ? Math.round((c / memberCount) * 100) : 0;
      }
    }
  }

  const horizonConsensus =
    memberCount === 0 ||
    (contentConsensus &&
      allResponded &&
      (horizons.length === 0 ||
        (dominantHorizon !== null &&
          horizons.length === memberCount &&
          horizons.every((h) => h === dominantHorizon))));

  const consensus = allResponded && contentConsensus && horizonConsensus;

  return {
    allResponded,
    contentConsensus,
    horizonConsensus,
    consensus,
    dominantHorizon,
    approveCount,
    memberCount,
    horizonPercent,
  };
}

/** Décision BUILD / LEARN / KILL dérivée d'un horizon comité. */
export function horizonToGovernanceDecision(horizon: SttnsHorizonOpinion): SttnsDecision {
  const bucket = peerReviewVoteBucket({ content_verdict: "approve", horizon });
  if (bucket === "killed") return "kill";
  if (bucket === "learn") return "learn";
  return "build";
}

/** Décision unanime du comité (null si pas de consensus). */
export function committeeConsensusDecision(
  reviews: SttnsPeerReview[],
  memberUserIds: string[]
): SttnsDecision | null {
  const result = computeFeatureConsensus(reviews, memberUserIds);
  if (!result.consensus || !result.dominantHorizon) return null;
  return horizonToGovernanceDecision(result.dominantHorizon);
}

/** Legacy DB value — expert review n'est plus un état gouvernance. */
export function normalizeGovernanceDecision(decision: SttnsDecision | null | undefined): SttnsDecision | null {
  if (!decision) return null;
  if (decision === "expert_review") return "learn";
  return decision;
}

export function computePersonaStoryConsensus(
  reviews: SttnsPeerReview[],
  reviewerUserIds: string[]
): { consensus: boolean; allResponded: boolean; approvePercent: number } {
  const memberCount = reviewerUserIds.length;
  if (memberCount === 0) return { consensus: true, allResponded: true, approvePercent: 100 };

  const byUser = new Map(reviews.map((r) => [r.reviewer_id, r]));
  const allResponded = reviewerUserIds.every((id) => byUser.has(id));
  const approvals = reviewerUserIds.filter(
    (id) => byUser.get(id)?.content_verdict === "approve"
  ).length;
  const approvePercent = Math.round((approvals / memberCount) * 100);

  return {
    allResponded,
    approvePercent,
    consensus: allResponded && approvePercent === 100,
  };
}

export function countOpenReviewsPending(
  reviewerUserIds: string[],
  reviews: SttnsPeerReview[]
): string[] {
  const done = new Set(reviews.map((r) => r.reviewer_id));
  return reviewerUserIds.filter((id) => !done.has(id));
}

/** Vote comité depuis une colonne kanban BUILD / LEARN / KILL. */
export function committeeVoteFromBucket(bucket: GovernanceVoteBucket): {
  content_verdict: SttnsContentVerdict;
  horizon: SttnsHorizonOpinion;
} {
  switch (bucket) {
    case "build":
      return { content_verdict: "approve", horizon: "mvp_now" };
    case "learn":
      return { content_verdict: "approve", horizon: "post_mvp" };
    case "killed":
      return { content_verdict: "approve", horizon: "not_now" };
  }
}

/** Décision CEO finale depuis une colonne kanban. */
export function ceoDecisionFromBucket(bucket: GovernanceVoteBucket): SttnsDecision {
  switch (bucket) {
    case "build":
      return "build";
    case "learn":
      return "learn";
    case "killed":
      return "kill";
  }
}

export function governanceVoteBucketLabel(bucket: GovernanceVoteBucket): string {
  switch (bucket) {
    case "build":
      return "BUILD";
    case "learn":
      return "LEARN";
    case "killed":
      return "KILL";
  }
}

export const GOVERNANCE_VOTE_BUCKET_STYLES: Record<
  GovernanceVoteBucket,
  { active: string; idle: string }
> = {
  build: {
    active: "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200",
    idle: "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50",
  },
  learn: {
    active: "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200",
    idle: "border-violet-200 bg-white text-violet-800 hover:bg-violet-50",
  },
  killed: {
    active: "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200",
    idle: "border-rose-200 bg-white text-rose-800 hover:bg-rose-50",
  },
};

export function peerReviewVoteBucket(
  review: Pick<SttnsPeerReview, "content_verdict" | "horizon"> | undefined
): GovernanceVoteBucket | null {
  if (!review || review.content_verdict !== "approve" || !review.horizon) return null;
  if (review.horizon === "mvp_now" || review.horizon === "scale") return "build";
  if (review.horizon === "post_mvp") return "learn";
  if (review.horizon === "not_now") return "killed";
  return null;
}

export function isInitiativeOpenForCommitteeVote(reviewStatus: SttnsReviewStatus | null | undefined): boolean {
  return (reviewStatus ?? "draft") === "in_review";
}

export function isInitiativeOpenForCeoFinalize(reviewStatus: SttnsReviewStatus | null | undefined): boolean {
  const status = reviewStatus ?? "draft";
  return status === "aligned" || status === "needs_ceo_decision";
}
