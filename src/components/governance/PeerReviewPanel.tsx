"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  saveCeoFinalAction,
  savePeerReviewAction,
  submitForReviewAction,
} from "@/app/projects/[slug]/team/actions";
import {
  CONTENT_VERDICT_LABELS,
  committeePeerUserIds,
  committeeVoteFromBucket,
  computeFeatureConsensus,
  countOpenReviewsPending,
  canUserFinalizeAsCeo,
  governanceVoteBucketLabel,
  isProjectCeo,
  normalizeGovernanceDecision,
  peerReviewVoteBucket,
} from "@/lib/sttns/governance";
import { usesCommitteeGovernance } from "@/lib/sttns/assetGovernance";
import { AssetReopenRevisionButton } from "@/components/governance/AssetReopenRevisionButton";
import type { GovernanceVoteBucket } from "@/lib/sttns/governanceAxes";
import type {
  SttnsAssetType,
  SttnsContentVerdict,
  SttnsDecision,
  SttnsPeerReview,
  SttnsProjectMember,
  SttnsReviewStatus,
} from "@/types/sttns";
import { ReviewStatusBadge } from "@/components/governance/ReviewStatusBadge";
import { MemberNameWithRole } from "@/components/ui/MemberNameWithRole";
import { SttnsContextHelp, SttnsSectionTitle } from "@/components/ui/SttnsContextHelp";
import { FEATURE_DETAIL_HELP, PEER_REVIEW_HELP } from "@/lib/sttns/sttnsContext";
import type { SttnsContextHelpContent } from "@/lib/sttns/sttnsContext";
import { DecisionBadge } from "@/components/ui/DecisionBadge";
import { Loader2, Send, Clock, HandMetal } from "lucide-react";
import { cn } from "@/lib/utils";

function resolveMemberName(
  userId: string,
  members: SttnsProjectMember[],
  reviews: SttnsPeerReview[]
): string {
  const fromReview = reviews.find((r) => r.reviewer_id === userId)?.profile;
  if (fromReview?.full_name?.trim()) return fromReview.full_name.trim();
  if (fromReview?.email) return fromReview.email.split("@")[0] ?? "Membre";
  const fromMember = members.find((m) => m.user_id === userId)?.profile;
  if (fromMember?.full_name?.trim()) return fromMember.full_name.trim();
  if (fromMember?.email) return fromMember.email.split("@")[0] ?? "Membre";
  return "Membre";
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return "l'équipe";
  if (names.length === 1) return names[0]!;
  if (names.length === 2) return `${names[0]} et ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} et ${names[names.length - 1]}`;
}

function countApprovals(
  reviewerIds: string[],
  reviews: SttnsPeerReview[]
): number {
  const byUser = new Map(reviews.map((r) => [r.reviewer_id, r]));
  return reviewerIds.filter((id) => byUser.get(id)?.content_verdict === "approve").length;
}

interface Props {
  projectId: string;
  projectSlug: string;
  assetType: SttnsAssetType;
  assetId: string;
  title: string;
  reviewStatus: SttnsReviewStatus;
  ceoDelegateUserId?: string | null;
  reviews: SttnsPeerReview[];
  members: SttnsProjectMember[];
  authorId: string | null;
  currentUserId: string;
  /** User story : complétude enregistrée (Definition of Done) */
  submitForValidationEnabled?: boolean;
  submitForValidationTooltip?: string;
  /** Feature : check-list comité (Definition of Ready) */
  submitForCommitteeEnabled?: boolean;
  submitForCommitteeTooltip?: string;
  ceoFinal?: {
    phase2: SttnsDecision | null;
    comment: string | null;
  };
  /** Décision proposée par le comité avant validation CEO. */
  committeeDecision?: SttnsDecision | null;
  /** Peut rouvrir en brouillon après validation / KILL. */
  reopenable?: boolean;
}

function ReviewerRow({
  review,
  members,
}: {
  review: SttnsPeerReview;
  members: SttnsProjectMember[];
}) {
  const name =
    review.profile?.full_name?.trim() ||
    review.profile?.email?.split("@")[0] ||
    "Member";
  return (
    <p className="font-semibold">
      <MemberNameWithRole name={name} userId={review.reviewer_id} members={members} />
    </p>
  );
}

export function PeerReviewPanel({
  projectId,
  projectSlug,
  assetType,
  assetId,
  title,
  reviewStatus,
  ceoDelegateUserId,
  reviews,
  members,
  authorId,
  currentUserId,
  submitForValidationEnabled = true,
  submitForValidationTooltip,
  submitForCommitteeEnabled = true,
  submitForCommitteeTooltip,
  ceoFinal,
  committeeDecision,
  reopenable = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberIds = useMemo(
    () => Array.from(new Set(members.map((m) => m.user_id))),
    [members]
  );
  const peerIds = useMemo(() => committeePeerUserIds(members), [members]);
  const isCeo = isProjectCeo(members, currentUserId);
  const canFinalize = canUserFinalizeAsCeo(members, currentUserId, ceoDelegateUserId);
  const myReview = reviews.find((r) => r.reviewer_id === currentUserId);

  const isCommittee = usesCommitteeGovernance(assetType);

  const reviewersForConsensus = isCommittee
    ? peerIds
    : memberIds.filter((id) => id !== authorId);

  const committeeConsensus = isCommittee
    ? computeFeatureConsensus(reviews, peerIds)
    : null;

  const pendingReviewerIds = isCommittee
    ? peerIds.filter((id) => id !== authorId)
    : reviewersForConsensus;
  const pendingReviewers = countOpenReviewsPending(pendingReviewerIds, reviews);

  const voterIds = isCommittee ? peerIds : reviewersForConsensus;
  const approvalCount = countApprovals(voterIds, reviews);
  const voterTotal = voterIds.length;

  const isAuthor = authorId === currentUserId;
  const hasVoted = !!myReview?.content_verdict;
  const mustGiveOpinion =
    reviewStatus === "in_review" &&
    pendingReviewers.includes(currentUserId) &&
    !hasVoted;
  const waitingOnOthers =
    reviewStatus === "in_review" &&
    pendingReviewers.length > 0 &&
    (isAuthor || hasVoted);
  const pendingNames = pendingReviewers.map((id) =>
    resolveMemberName(id, members, reviews)
  );

  const canSubmitForReview =
    (reviewStatus === "draft" || reviewStatus === "changes_requested") &&
    (!authorId || currentUserId === authorId);

  const submitBlocked =
    (assetType === "user_story" && canSubmitForReview && !submitForValidationEnabled) ||
    ((assetType === "initiative" || assetType === "persona" || assetType === "epic") &&
      canSubmitForReview &&
      !submitForCommitteeEnabled);
  const submitLabel =
    assetType === "user_story"
      ? "Soumettre pour validation"
      : assetType === "persona"
        ? "Soumettre la validation persona"
        : assetType === "epic"
          ? "Soumettre la validation epic"
          : assetType === "initiative"
            ? "Soumettre au comité"
            : "Soumettre en revue";

  const submitBlockedHelp: SttnsContextHelpContent | null = submitBlocked
    ? assetType === "initiative" || assetType === "persona" || assetType === "epic"
      ? {
          ...FEATURE_DETAIL_HELP.committeeSubmit,
          body: submitForCommitteeTooltip ?? FEATURE_DETAIL_HELP.committeeSubmit.body,
        }
      : submitForValidationTooltip
        ? { kind: "alerte", title: "Soumission", body: submitForValidationTooltip }
        : null
    : null;

  const peerReviewHelp =
    assetType in PEER_REVIEW_HELP
      ? PEER_REVIEW_HELP[assetType as keyof typeof PEER_REVIEW_HELP]
      : null;

  const canGiveOpinion = !myReview?.content_verdict;

  const showCeoFinalize =
    isCommittee &&
    canFinalize &&
    (reviewStatus === "aligned" || reviewStatus === "needs_ceo_decision");

  const [contentVerdict, setContentVerdict] = useState<SttnsContentVerdict>("approve");
  const [committeeVote, setCommitteeVote] = useState<GovernanceVoteBucket>(
    () => peerReviewVoteBucket(myReview) ?? "build"
  );
  const [comment, setComment] = useState("");

  const [ceoDecision, setCeoDecision] = useState<GovernanceVoteBucket>(() => {
    const fromFinal = normalizeGovernanceDecision(ceoFinal?.phase2 ?? committeeDecision ?? null);
    if (fromFinal === "kill") return "killed";
    if (fromFinal === "learn") return "learn";
    return "build";
  });
  const [ceoComment, setCeoComment] = useState(ceoFinal?.comment ?? "");

  async function handleSubmitForReview() {
    setLoading(true);
    setError(null);
    const res = await submitForReviewAction(
      projectId,
      projectSlug,
      assetType,
      assetId,
      title,
      authorId
    );
    if (!res.ok) setError(res.error);
    else router.refresh();
    setLoading(false);
  }

  async function handleSaveReview() {
    if (contentVerdict === "request_changes" && !comment.trim()) {
      setError("Commentaire obligatoire pour demander des modifications.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await savePeerReviewAction(
      projectId,
      projectSlug,
      assetType,
      assetId,
      {
        content_verdict: contentVerdict,
        horizon:
          isCommittee && contentVerdict === "approve"
            ? committeeVoteFromBucket(committeeVote).horizon
            : null,
        phase1_suggestion: null,
        comment,
      },
      authorId
    );
    if (!res.ok) setError(res.error);
    else router.refresh();
    setLoading(false);
  }

  async function handleCeoFinalize() {
    setLoading(true);
    setError(null);
    const res = await saveCeoFinalAction(projectId, projectSlug, assetType, assetId, {
      decision: ceoDecision === "killed" ? "kill" : ceoDecision,
      comment: ceoComment,
    });
    if (!res.ok) setError(res.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="sttns-card space-y-5 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {peerReviewHelp ? (
            <SttnsSectionTitle as="h3" help={peerReviewHelp}>
              Avis
            </SttnsSectionTitle>
          ) : (
            <h3 className="font-display text-lg font-bold">Avis</h3>
          )}
        </div>
        <ReviewStatusBadge status={reviewStatus} />
      </div>

      {reviewStatus === "in_review" && voterTotal > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-sm">
          <p>
            Approbations :{" "}
            <strong>
              {approvalCount} / {voterTotal}
            </strong>
            {isCommittee && committeeConsensus?.consensus && (
              <span className="text-emerald-800"> — unanimité atteinte</span>
            )}
          </p>
        </div>
      )}

      {mustGiveOpinion && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-950"
        >
          <HandMetal className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden />
          <p className="font-semibold">
            {isCommittee
              ? "Votre recommandation BUILD / LEARN / KILL est requise."
              : "Votre avis est requis pour valider ce document."}
          </p>
        </div>
      )}

      {waitingOnOthers && !mustGiveOpinion && (
        <div className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-zinc-500" aria-hidden />
          <p>
            En attente de l&apos;avis de{" "}
            <strong>{formatNameList(pendingNames)}</strong>.
          </p>
        </div>
      )}

      {isCommittee && committeeConsensus?.allResponded && !committeeConsensus.consensus && (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-3 text-sm">
          <p>
            Contenu :{" "}
            <strong>{committeeConsensus.contentConsensus ? "Aligné" : "Désaccord"}</strong>
            {" · "}
            Recommandation :{" "}
            <strong>
              {committeeConsensus.horizonConsensus && committeeConsensus.dominantHorizon
                ? governanceVoteBucketLabel(
                    peerReviewVoteBucket({
                      content_verdict: "approve",
                      horizon: committeeConsensus.dominantHorizon,
                    }) ?? "build"
                  )
                : "Désaccord"}
            </strong>
          </p>
        </div>
      )}

      {isCommittee && isCeo && reviewStatus === "in_review" && mustGiveOpinion && (
        <p className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-sm text-sky-900">
          En tant que CEO, votre vote BUILD / LEARN / KILL compte comme celui des autres membres
          du comité. Une confirmation CEO pourra être demandée ensuite selon le mode gouvernance.
        </p>
      )}

      {isCommittee && isCeo && reviewStatus === "in_review" && !mustGiveOpinion && hasVoted && (
        <p className="rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700">
          Votre vote comité est enregistré. En cas d&apos;unanimité, une validation CEO pourra vous
          être demandée selon les paramètres projet.
        </p>
      )}

      {reviews.length > 0 && (
        <ul className="space-y-3">
          {reviews.map((r) => (
            <li key={r.id} className="rounded-xl border border-zinc-200 bg-white p-3 text-sm">
              <ReviewerRow review={r} members={members} />
              <div className="mt-1 flex flex-wrap gap-2">
                {r.content_verdict === "request_changes" && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                    {CONTENT_VERDICT_LABELS[r.content_verdict]}
                  </span>
                )}
                {r.content_verdict === "approve" && isCommittee && (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-bold",
                      peerReviewVoteBucket(r) === "build" && "bg-emerald-100 text-emerald-800",
                      peerReviewVoteBucket(r) === "learn" && "bg-violet-100 text-violet-800",
                      peerReviewVoteBucket(r) === "killed" && "bg-rose-100 text-rose-800"
                    )}
                  >
                    {peerReviewVoteBucket(r)
                      ? governanceVoteBucketLabel(peerReviewVoteBucket(r)!)
                      : "BUILD"}
                  </span>
                )}
              </div>
              {r.comment && <p className="mt-2 text-xs text-slate-600">{r.comment}</p>}
            </li>
          ))}
        </ul>
      )}

      {ceoFinal?.phase2 && reviewStatus === "validated" && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4">
          <p className="text-xs font-bold uppercase text-emerald-800">Validation CEO</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <DecisionBadge decision={normalizeGovernanceDecision(ceoFinal.phase2)} />
          </div>
          {ceoFinal.comment && (
            <p className="mt-2 text-sm text-slate-700">{ceoFinal.comment}</p>
          )}
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {isCommittee && authorId === currentUserId && reviewStatus === "in_review" && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-900">
          Vous avez validé en soumettant — votre voix compte dans l&apos;unanimité du comité.
        </p>
      )}

      {canSubmitForReview && (
        <div className="space-y-2">
          {assetType === "user_story" && submitForValidationEnabled && (
            <p className="text-xs text-zinc-600">
              La fiche est enregistrée — cette action lance la validation comité (BUILD / LEARN /
              KILL).
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleSubmitForReview}
            disabled={loading || memberIds.length === 0 || submitBlocked}
            className={cn(
              "sttns-btn-primary",
              submitBlocked && "cursor-not-allowed opacity-60"
            )}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            {submitLabel}
          </button>
          {submitBlockedHelp && <SttnsContextHelp {...submitBlockedHelp} />}
          </div>
        </div>
      )}

      {canGiveOpinion && reviewStatus === "in_review" && (
        <div
          className={cn(
            "rounded-xl border p-4",
            mustGiveOpinion
              ? "border-amber-300 bg-amber-50/80"
              : "border-amber-200 bg-amber-50/50"
          )}
        >
          <p className="text-sm font-bold text-amber-900">Votre avis</p>
          {isCommittee && (
            <p className="mt-1 text-xs text-amber-800">
              Choisissez BUILD, LEARN ou KILL — ou demandez des modifications au dossier.
            </p>
          )}

          {isCommittee ? (
            <>
              <p className="sttns-label mt-4">Recommandation</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(["build", "learn", "killed"] as GovernanceVoteBucket[]).map((vote) => (
                  <label
                    key={vote}
                    className={cn(
                      "flex cursor-pointer flex-col items-center justify-center rounded-xl border px-2 py-3 text-center text-xs font-bold transition",
                      contentVerdict === "approve" && committeeVote === vote
                        ? vote === "build"
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-200"
                          : vote === "learn"
                            ? "border-violet-500 bg-violet-50 text-violet-900 ring-2 ring-violet-200"
                            : "border-rose-500 bg-rose-50 text-rose-900 ring-2 ring-rose-200"
                        : vote === "build"
                          ? "border-emerald-200 bg-white text-emerald-800 hover:bg-emerald-50"
                          : vote === "learn"
                            ? "border-violet-200 bg-white text-violet-800 hover:bg-violet-50"
                            : "border-rose-200 bg-white text-rose-800 hover:bg-rose-50",
                      contentVerdict === "request_changes" && "opacity-40"
                    )}
                  >
                    <input
                      type="radio"
                      name="committee-vote"
                      className="sr-only"
                      checked={contentVerdict === "approve" && committeeVote === vote}
                      onChange={() => {
                        setContentVerdict("approve");
                        setCommitteeVote(vote);
                      }}
                    />
                    {governanceVoteBucketLabel(vote)}
                  </label>
                ))}
              </div>

              <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-amber-200 bg-white px-3 py-2.5 text-xs">
                <input
                  type="radio"
                  name="committee-vote"
                  checked={contentVerdict === "request_changes"}
                  onChange={() => setContentVerdict("request_changes")}
                />
                {CONTENT_VERDICT_LABELS.request_changes}
              </label>
            </>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {(["approve", "request_changes"] as SttnsContentVerdict[]).map((v) => (
                <label
                  key={v}
                  className="flex cursor-pointer items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs"
                >
                  <input
                    type="radio"
                    name="verdict"
                    checked={contentVerdict === v}
                    onChange={() => setContentVerdict(v)}
                  />
                  {CONTENT_VERDICT_LABELS[v]}
                </label>
              ))}
            </div>
          )}

          <textarea
            className="sttns-input mt-3 min-h-[60px]"
            placeholder="Commentaire (optionnel)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />

          <button
            type="button"
            onClick={handleSaveReview}
            disabled={loading}
            className="sttns-btn-primary mt-3"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer mon avis
          </button>
        </div>
      )}

      {showCeoFinalize && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/50 p-4">
          <p className="text-sm font-bold text-orange-900">
            {isCeo ? "CEO — confirmation finale" : "Délégation CEO — confirmation finale"}
          </p>
          <p className="mt-1 text-xs text-orange-800">
            Le comité s&apos;est prononcé
            {committeeDecision
              ? ` (${governanceVoteBucketLabel(
                  committeeDecision === "kill"
                    ? "killed"
                    : committeeDecision === "learn"
                      ? "learn"
                      : "build"
                )})`
              : ""}
            . Confirmez ou ajustez BUILD · LEARN · KILL.
          </p>

          <div className="mt-4 grid grid-cols-3 gap-2">
            {(["build", "learn", "killed"] as GovernanceVoteBucket[]).map((vote) => (
              <label
                key={vote}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-lg border px-3 py-2.5 text-xs font-bold",
                  ceoDecision === vote
                    ? vote === "build"
                      ? "border-emerald-500 bg-emerald-50 text-emerald-900"
                      : vote === "learn"
                        ? "border-violet-500 bg-violet-50 text-violet-900"
                        : "border-rose-500 bg-rose-50 text-rose-900"
                    : "border-slate-200 bg-white text-slate-700"
                )}
              >
                <input
                  type="radio"
                  name="ceo-decision"
                  className="sr-only"
                  checked={ceoDecision === vote}
                  onChange={() => setCeoDecision(vote)}
                />
                {governanceVoteBucketLabel(vote)}
              </label>
            ))}
          </div>

          <textarea
            className="sttns-input mt-3 min-h-[60px]"
            placeholder="Commentaire (optionnel)"
            value={ceoComment}
            onChange={(e) => setCeoComment(e.target.value)}
          />

          <button
            type="button"
            onClick={handleCeoFinalize}
            disabled={loading}
            className="sttns-btn-primary mt-3"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirmer la décision
          </button>
        </div>
      )}

      {reopenable && isAuthor && (
        <AssetReopenRevisionButton
          projectId={projectId}
          projectSlug={projectSlug}
          assetType={assetType}
          assetId={assetId}
          assetLabel={title}
        />
      )}
    </div>
  );
}
