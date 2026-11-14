import {
  computeExecutionStats,
  computeGovernanceStats,
} from "@/lib/sttns/governanceAxes";
import type { SttnsEpic, SttnsInitiative, SttnsUserStory } from "@/types/sttns";

export function computeProjectDashboardStats(
  initiatives: SttnsInitiative[],
  stories: Pick<SttnsUserStory, "status">[],
  epics: Pick<SttnsEpic, "status">[]
) {
  const governance = computeGovernanceStats(initiatives);
  const execution = computeExecutionStats(initiatives, stories, epics);

  return {
    governance,
    execution,
  };
}

/** @deprecated Utiliser computeProjectDashboardStats */
export function computeProjectPortfolioStats(initiatives: SttnsInitiative[]) {
  const governance = computeGovernanceStats(initiatives);
  return {
    governance,
    phase1: { total: governance.total, ok_phase2: 0, expert_review: 0, kill: governance.killed, pending: governance.draft },
    phase2: { total: 0, build: 0, learn: 0, expert: 0, kill: 0 },
    activeFeatures: governance.build + governance.learn + governance.in_review + governance.draft,
    killRate: governance.killRate,
    pendingCeo: governance.pendingCeo,
    openReview: governance.openReview,
    recent7d: governance.recent7d,
    phase1OkRate: 0,
    phase2BuildShare: 0,
    phase2LearnShare: 0,
  };
}
