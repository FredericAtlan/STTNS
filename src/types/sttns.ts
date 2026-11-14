export type SttnsKanoType = "must_be" | "performance" | "attractive";
export type SttnsProjectedSatisfaction =
  | "dissatisfied"
  | "neutral"
  | "satisfied"
  | "delighted";
export type SttnsProjectedFunctionality = "none" | "some" | "basic" | "good" | "best";
export type SttnsValidationMethod =
  | "terrain_signal"
  | "wizard_of_oz"
  | "mockup"
  | "fake_door";
export type SttnsDecision = "build" | "learn" | "expert_review" | "kill";
export type SttnsInitiativeStatus = "draft" | "in_review" | "approved" | "parking_lot";
export type SttnsModuleCode = "ingestion" | "accounting" | "scoring_web3" | "platform";
export type SttnsProjectRole = "ceo" | "cto" | "expert" | "pm" | "dev";
/** Squad transverse — accès projet (viewer / editor / ceo_admin) */
export type SttnsSquadProjectRole = "viewer" | "editor" | "ceo_admin";
/** @deprecated migrated to expert — kept for legacy row reads */
export type SttnsLegacyProjectRole = "specialist" | "developer";
export type SttnsPlatformRole = "admin" | "user";
/** @deprecated only peer_ceo is active — hierarchical removed in step 0 */
export type SttnsValidationMode = "peer_ceo" | "hierarchical";
export type SttnsEpicStatus = "draft" | "ready" | "in_progress" | "done";
export type SttnsReviewStatus =
  | "draft"
  | "in_review"
  | "validated"
  | "changes_requested"
  | "aligned"
  | "needs_ceo_decision";
export type SttnsAssetType = "persona" | "user_story" | "epic" | "initiative";
export type SttnsContentVerdict = "approve" | "request_changes";
export type SttnsHorizonOpinion = "mvp_now" | "post_mvp" | "scale" | "not_now";
export type SttnsTaskType =
  | "review_persona"
  | "review_user_story"
  | "feature_opinion"
  | "ceo_finalize_feature"
  | "ceo_approve_execution_order"
  | "hierarchical_review";

export type SttnsExecutionProposalStatus = "pending" | "approved" | "rejected" | "cancelled";

export type SttnsExecutionHistoryEventKind = "initial" | "applied" | "rejected";
export type SttnsValidationStep = "tier1" | "cto" | "ceo";
export type SttnsWorkflowStatus =
  | "draft"
  | "tier1_pending"
  | "tier1_complete"
  | "cto_pending"
  | "ceo_pending"
  | "approved"
  | "parking_lot"
  | "killed";

export interface SttnsProject {
  id: string;
  slug: string;
  name: string;
  nsm_label: string;
  nsm_description: string | null;
  description: string | null;
  is_active: boolean;
  validation_mode: SttnsValidationMode;
  /** @deprecated fixed at 100% — committee unanimity */
  consensus_percent: number;
  auto_act_on_consensus: boolean;
  ceo_delegate_user_id: string | null;
  personas_cast_locked_at: string | null;
  personas_cast_locked_by: string | null;
  /** Gouvernance workflow JSONB — voir projectSettingsSchema */
  settings?: Record<string, unknown> | null;
  created_at: string;
}

export interface SttnsModule {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
}

export interface SttnsEpic {
  id: string;
  project_id: string;
  title: string;
  objective: string | null;
  primary_persona_id: string | null;
  target_tier_codes: string[];
  impact_metric_root: string | null;
  success_kpi_target: string | null;
  delivery_horizon: string | null;
  status: SttnsEpicStatus;
  sort_order: number;
  archived_at: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  review_status?: SttnsReviewStatus;
  final_decision?: SttnsDecision | null;
  ceo_final_phase2?: SttnsDecision | null;
  ceo_final_comment?: string | null;
  ceo_final_by?: string | null;
  ceo_final_at?: string | null;
  primary_persona?: SttnsPersona | null;
}

export interface SttnsProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: SttnsProjectRole;
  project_role: SttnsSquadProjectRole;
  created_at: string;
  profile?: SttnsProfile;
}

export interface SttnsInitiativeReview {
  id: string;
  initiative_id: string;
  project_id: string;
  reviewer_id: string;
  reviewer_role: SttnsProjectRole;
  validation_step: SttnsValidationStep;
  decision: SttnsDecision;
  comment: string | null;
  created_at: string;
  profile?: SttnsProfile;
}

export type SttnsInitiativeVersionType = "v1_mvp" | "v2_consolidation";

export type SttnsReleaseStatus = "draft" | "active" | "shipped";

export type SttnsFeatureLifecycleStatus = "planned" | "live" | "deprecated";

export interface SttnsRelease {
  id: string;
  project_id: string;
  label: string;
  status: SttnsReleaseStatus;
  target_date: string | null;
  notes: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export type SttnsInitiativeExecutionStatus =
  | "pending"
  | "in_development"
  | "in_test"
  | "deployed";

export type SttnsPlacementReasonType =
  | "tech_dependency"
  | "resource_availability"
  | "strategic_priority"
  | "other";

export interface SttnsInitiative {
  id: string;
  project_id: string;
  epic_id: string | null;
  release_id: string | null;
  lifecycle_status: SttnsFeatureLifecycleStatus;
  replaces_initiative_id: string | null;
  /** @deprecated préférer release_id — conservé pour migration */
  version_type: SttnsInitiativeVersionType;
  execution_status: SttnsInitiativeExecutionStatus;
  execution_sort_order: number;
  placement_reason_type: SttnsPlacementReasonType | null;
  placement_comment: string | null;
  execution_assignee_id: string | null;
  execution_start_date: string | null;
  execution_due_date: string | null;
  execution_auto_deploy?: boolean;
  execution_doc_url?: string | null;
  execution_delivery_doc_url?: string | null;
  execution_git_url?: string | null;
  feature_code: string | null;
  feature_name: string;
  module: SttnsModuleCode;
  module_id: string | null;
  workflow_status: SttnsWorkflowStatus;
  final_decision: SttnsDecision | null;
  archived_at: string | null;
  pain_point: string | null;
  market_signal: string | null;
  pain_clear: boolean;
  nsm_link_clear: boolean;
  sensitive_domain: boolean;
  expert_required: boolean;
  phase1_status: string | null;
  review_status?: SttnsReviewStatus;
  ceo_final_phase1: string | null;
  ceo_final_phase2: SttnsDecision | null;
  ceo_final_comment: string | null;
  ceo_final_by: string | null;
  ceo_final_at: string | null;
  metric_id: string | null;
  metric_description: string | null;
  persona: string | null;
  persona_id: string | null;
  user_story_id: string | null;
  pain_point_detail: string | null;
  market_proof: string | null;
  job_functional: string | null;
  job_emotional: string | null;
  job_social: string | null;
  user_story_persona: string | null;
  user_story_want: string | null;
  user_story_so_that: string | null;
  ost_opportunity: string | null;
  technical_solution: string | null;
  kano_type: SttnsKanoType | null;
  kano_justification: string | null;
  projected_satisfaction_level: SttnsProjectedSatisfaction | null;
  projected_functionality_level: SttnsProjectedFunctionality | null;
  rice_reach: number | null;
  rice_impact: number | null;
  rice_confidence: number | null;
  rice_effort: number | null;
  rice_score: number | null;
  validation_method: SttnsValidationMethod | null;
  validation_kpi: string | null;
  empirical_test: string | null;
  decision: SttnsDecision | null;
  status: SttnsInitiativeStatus;
  committee_notes: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface SttnsInitiativeEventChange {
  field: string;
  label: string;
  before: string | number | boolean | null;
  after: string | number | boolean | null;
}

export interface SttnsInitiativeEvent {
  id: string;
  initiative_id: string;
  actor_id: string | null;
  event_type: string;
  payload: {
    title?: string;
    note?: string | null;
    changes?: SttnsInitiativeEventChange[];
  } & Record<string, unknown>;
  created_at: string;
  profile?: SttnsProfile;
}

export type SttnsUserStoryStatus = "proposed" | "validated" | "in_sprint" | "delivered";

export type SttnsStoryActorType = "persona" | "platform" | "external";

export interface SttnsUserStoryAction {
  sort_order: number;
  actor_type: SttnsStoryActorType;
  persona_id?: string | null;
  external_label?: string | null;
  verb: string;
  object: string;
  note?: string | null;
  initiative_id?: string | null;
}

/** Job type code — project vocabulary (functional, social, emotional, custom…). */
export type SttnsJobType = string;

export interface SttnsPersonaTierDef {
  id: string;
  project_id: string;
  code: string;
  title: string;
  description: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SttnsPersonaJobTypeDef {
  id: string;
  project_id: string;
  code: string;
  title: string;
  hint: string | null;
  sort_order: number;
  archived_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SttnsPersonaPainPoint {
  id: string;
  persona_id: string;
  label: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  client_key?: string | null;
}

export interface SttnsPersonaJob {
  id: string;
  persona_id: string;
  job_type: SttnsJobType;
  description: string;
  sort_order: number;
  created_at: string;
  client_key?: string | null;
  resolved_pain_point_ids?: string[];
}

export interface SttnsPersona {
  id: string;
  project_id: string;
  name: string;
  persona_code?: string | null;
  project_scope?: "active" | "reference" | null;
  tier_label: string | null;
  profile_summary: string | null;
  avatar_url?: string | null;
  persona_status?: "DRAFT" | "READY" | null;
  archived_at: string | null;
  /** @deprecated use pain_points */
  friction_summary: string | null;
  /** @deprecated use pain_points */
  pain_point_detail: string | null;
  /** @deprecated use jobs */
  job_functional: string | null;
  /** @deprecated use jobs */
  job_emotional: string | null;
  /** @deprecated use jobs */
  job_social: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  review_status?: SttnsReviewStatus;
  created_by?: string | null;
  final_decision?: SttnsDecision | null;
  ceo_final_phase2?: SttnsDecision | null;
  ceo_final_comment?: string | null;
  ceo_final_by?: string | null;
  ceo_final_at?: string | null;
  pain_points?: SttnsPersonaPainPoint[];
  jobs?: SttnsPersonaJob[];
}

export interface SttnsProjectMetric {
  id: string;
  project_id: string;
  parent_id: string | null;
  name: string;
  description: string | null;
  sort_order: number;
  legacy_key: string | null;
  created_at: string;
  updated_at: string;
  children?: SttnsProjectMetric[];
}

export interface SttnsUserStory {
  id: string;
  project_id: string;
  epic_id: string | null;
  title: string;
  context_label: string | null;
  primary_persona_id: string | null;
  target_persona_job_id?: string | null;
  archived_at: string | null;
  actions: SttnsUserStoryAction[];
  impact_metric_id: string | null;
  impacts_north_star: boolean;
  impact_description: string | null;
  status: SttnsUserStoryStatus;
  initiative_id: string | null;
  notes: string | null;
  sprint_want: string | null;
  sprint_so_that: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  review_status?: SttnsReviewStatus;
  created_by?: string | null;
  final_decision?: SttnsDecision | null;
  ceo_final_phase2?: SttnsDecision | null;
  ceo_final_comment?: string | null;
  ceo_final_by?: string | null;
  ceo_final_at?: string | null;
  personas?: SttnsPersona[];
  primary_persona?: SttnsPersona | null;
}

export interface SttnsProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  platform_role: SttnsPlatformRole;
}

export interface SttnsProjectInvite {
  id: string;
  project_id: string;
  email: string;
  roles: string[];
  squad_role?: SttnsSquadProjectRole;
  invited_by: string | null;
  user_id: string | null;
  status: "pending" | "accepted" | "cancelled";
  created_at: string;
  accepted_at: string | null;
}

export interface SttnsPeerReview {
  id: string;
  project_id: string;
  asset_type: SttnsAssetType;
  asset_id: string;
  reviewer_id: string;
  content_verdict: SttnsContentVerdict | null;
  horizon: SttnsHorizonOpinion | null;
  phase1_suggestion: string | null;
  comment: string | null;
  created_at: string;
  updated_at: string;
  profile?: SttnsProfile;
}

export interface SttnsUserTask {
  id: string;
  project_id: string;
  user_id: string;
  task_type: SttnsTaskType;
  asset_type: SttnsAssetType | null;
  asset_id: string | null;
  title: string;
  status: "open" | "done" | "cancelled";
  created_at: string;
  completed_at: string | null;
  project?: Pick<SttnsProject, "slug" | "name">;
}

export interface Phase1Stats {
  total: number;
  kill: number;
  ok_phase2: number;
  expert_review: number;
  pending: number;
}

export interface InitiativeStats {
  total: number;
  build: number;
  learn: number;
  expert: number;
  kill: number;
}

export type SttnsInitiativeTaskStatus = "todo" | "in_progress" | "blocked" | "done";

export interface SttnsInitiativeTask {
  id: string;
  project_id: string;
  initiative_id: string;
  title: string;
  sort_order: number;
  status: SttnsInitiativeTaskStatus;
  assignee_id: string | null;
  start_date: string | null;
  due_date: string | null;
  doc_url?: string | null;
  delivery_doc_url?: string | null;
  git_url?: string | null;
  created_at: string;
  updated_at: string;
  assignee?: SttnsProfile | null;
}

export interface SttnsFeatureLink {
  id: string;
  project_id: string;
  initiative_id: string;
  title: string;
  url: string;
  created_at: string;
}

export interface SttnsInitiativePlanningHistory {
  id: string;
  project_id: string;
  initiative_id: string;
  task_id: string | null;
  changed_by: string | null;
  field_key: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  profile?: SttnsProfile;
  task_title?: string | null;
}

export interface SttnsInitiativeExecutionHistory {
  id: string;
  initiative_id: string;
  changed_by: string;
  old_sort_order: number;
  new_sort_order: number;
  reason_type: SttnsPlacementReasonType;
  comment: string;
  event_kind: SttnsExecutionHistoryEventKind;
  reviewed_by: string | null;
  ceo_comment: string | null;
  proposal_id: string | null;
  created_at: string;
  profile?: SttnsProfile;
  reviewer?: SttnsProfile;
}

export interface SttnsInitiativeExecutionProposal {
  id: string;
  project_id: string;
  initiative_id: string;
  proposed_by: string;
  reviewed_by: string | null;
  old_sort_order: number;
  new_sort_order: number;
  target_index: number;
  reason_type: SttnsPlacementReasonType;
  comment: string;
  ceo_comment: string | null;
  status: SttnsExecutionProposalStatus;
  created_at: string;
  reviewed_at: string | null;
  proposer?: SttnsProfile;
  reviewer?: SttnsProfile;
}

export type SttnsInitiativeInsert = Omit<
  SttnsInitiative,
  "id" | "rice_score" | "created_at" | "updated_at" | "workflow_status" | "final_decision"
> & { id?: string };
