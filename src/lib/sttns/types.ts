import type { ZodIssue } from "zod";
import type { ExecutionUnit } from "@/lib/sttns/projectSettingsSchema";
import type {
  painPointInputSchema,
  personaInputSchema,
  jtbdInputSchema,
  saveWorkItemSchema,
} from "@/lib/sttns/schema";

/** Entrée validée par Zod avant persistance Supabase. */
export type SaveWorkItemInput = import("zod").infer<typeof saveWorkItemSchema>;

export type WorkItemStatus = "todo" | "in_progress" | "review" | "done";
/** @deprecated Remplacé par EffortDays (valueEffort). */
export type FibonacciEffort = 1 | 2 | 3 | 5 | 8 | 13;
/** @deprecated Remplacé par le ratio Valeur/Effort. */
export type RiceMetadata = {
  reach: number;
  impact: number;
  confidence: number;
  effort: number;
};
export type ContextLinkType = "persona" | "pain_point" | "job" | "metric";
export type WorkItemContextLink = {
  type: ContextLinkType;
  context_id: string;
};

/** Types persistés en base (enum Postgres). */
export type DbWorkItemType =
  | "persona"
  | "job"
  | "epic"
  | "feature"
  | "story"
  | "task";

export type SaveWorkItemType = SaveWorkItemInput["type"];

export type PersonaMetadata = {
  segment?: string;
  description?: string;
  avatar_url?: string;
  doc_url?: string | null;
};

export type PainPointMetadata = {
  severity: "low" | "medium" | "high" | "critical";
  label: string;
};

export type JobMetadata = {
  situation?: string;
  motivation?: string;
  outcome?: string;
};

export type EpicMetadata = {
  persona_id?: string;
  cycle_id?: string;
  description?: string | null;
  doc_url?: string | null;
  archived_reason?: string;
  archived_reason_details?: string | null;
  archived_at?: string;
  archived_by?: string;
};

export type FeatureMetadata = {
  impact?: 0 | 1 | 2 | 3;
  effort_days?: 0.5 | 1 | 2 | 3 | 5;
  complexity?: 1 | 2 | 3;
  description?: string | null;
  doc_url?: string | null;
  archived_reason?: string;
  archived_reason_details?: string | null;
  archived_at?: string;
  archived_by?: string;
};

export type StoryMetadata = {
  effort_days?: 0.5 | 1 | 2 | 3 | 5;
  complexity?: 1 | 2 | 3;
  description?: string | null;
  doc_url?: string | null;
  archived_reason?: string;
  archived_reason_details?: string | null;
  archived_at?: string;
  archived_by?: string;
};

export type TaskMetadata = {
  notion_url?: string | null;
};

export type PersonaSaveInput = Extract<SaveWorkItemInput, { type: "persona" }>;
export type PainPointSaveInput = Extract<SaveWorkItemInput, { type: "pain_point" }>;
export type JobSaveInput = Extract<SaveWorkItemInput, { type: "job" }>;
export type EpicSaveInput = Extract<SaveWorkItemInput, { type: "epic" }>;
export type FeatureSaveInput = Extract<SaveWorkItemInput, { type: "feature" }>;
export type StorySaveInput = Extract<SaveWorkItemInput, { type: "story" }>;
export type TaskSaveInput = Extract<SaveWorkItemInput, { type: "task" }>;

export type StoredWorkItemBase = {
  id: string;
  project_id: string;
  parent_id: string | null;
  status: WorkItemStatus;
  assignee_id: string | null;
  priority: number;
  title: string;
  code: string | null;
  sort_order: number;
  tree_path: string;
  created_at: string;
  updated_at: string;
  archived_at: string | null;
  created_by: string | null;
  updated_by: string | null;
  cycle_id: string | null;
  effort_points: number;
  rice_reach: number;
  rice_impact: number;
  rice_confidence: number;
  rice_effort: number;
  rice_score: number;
  context_links: WorkItemContextLink[];
};

export type StoredPersonaWorkItem = StoredWorkItemBase & {
  type: "persona";
  metadata: PersonaMetadata;
};

export type StoredPainPointWorkItem = StoredWorkItemBase & {
  type: "pain_point";
  parent_id: string;
  metadata: PainPointMetadata;
};

export type StoredJobWorkItem = StoredWorkItemBase & {
  type: "job";
  parent_id: string;
  metadata: JobMetadata;
  solved_pain_points?: string[];
};

export type StoredEpicWorkItem = StoredWorkItemBase & {
  type: "epic";
  metadata: EpicMetadata;
};

export type StoredFeatureWorkItem = StoredWorkItemBase & {
  type: "feature";
  parent_id: string;
  metadata: FeatureMetadata;
};

export type StoredStoryWorkItem = StoredWorkItemBase & {
  type: "story";
  parent_id: string;
  metadata: StoryMetadata;
};

export type StoredTaskWorkItem = StoredWorkItemBase & {
  type: "task";
  parent_id: string;
  metadata: TaskMetadata;
};

export type StoredWorkItem =
  | StoredPersonaWorkItem
  | StoredPainPointWorkItem
  | StoredJobWorkItem
  | StoredEpicWorkItem
  | StoredFeatureWorkItem
  | StoredStoryWorkItem
  | StoredTaskWorkItem;

/** @deprecated Utiliser StoredWorkItem */
export type WorkItemWithContext = StoredWorkItem;

export type SaveWorkItemResult =
  | { ok: true; id: string }
  | { ok: false; error: string; issues?: ZodIssue[] };

export type GetWorkItemResult =
  | { ok: true; item: StoredWorkItem | null }
  | { ok: false; error: string };

/** Entrées formulaires « Pourquoi » (inférées des schémas Zod). */
export type PersonaInput = import("zod").infer<typeof personaInputSchema>;
export type JTBDInput = import("zod").infer<typeof jtbdInputSchema>;
export type PainPointInput = import("zod").infer<typeof painPointInputSchema>;

/** Entrées server actions (hors Spine save). */
export type EpicSaveData = {
  id?: string;
  title: string;
  description?: string;
  doc_url?: string | null;
  status?: WorkItemStatus;
  assignee_id?: string | null;
  priority?: number;
  sort_order?: number;
  archived_at?: string | null;
  context_links?: WorkItemContextLink[];
  persona_id?: string;
};

export type InitiativeFormPayload = {
  feature_name: string;
  project_id: string;
  epic_id?: string | null;
  description?: string | null;
  doc_url?: string | null;
  impact?: 0 | 1 | 2 | 3;
  effort_days?: 0.5 | 1 | 2 | 3 | 5;
  complexity?: 1 | 2 | 3;
  context_links?: WorkItemContextLink[];
  [key: string]: unknown;
};

export type SaveUserStoryInput = {
  id?: string;
  title: string;
  feature_id: string;
  cycle_id?: string | null;
  effort_days: 0.5 | 1 | 2 | 3 | 5;
  complexity: 1 | 2 | 3;
  status?: WorkItemStatus;
  description?: string | null;
  doc_url?: string | null;
  assignee_id?: string | null;
};

export type CommandPaletteContext = {
  projectId: string;
  executionUnit: ExecutionUnit;
  epicEqualsCycle: boolean;
  personas: Array<{ id: string; title: string; code: string | null }>;
  /** Pain Points Spine — injectés dans JTBDForm (lien solves). */
  painPoints: Array<{
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    persona_id: string;
  }>;
  epics: Array<{ id: string; title: string; cycle_id?: string | null }>;
  jtbdOptions: Array<{ id: string; title: string; personaName: string }>;
  featureOptions: Array<{ id: string; title: string; epicTitle?: string }>;
  cycleOptions: Array<{ id: string; name: string }>;
};

export type ImportMode = "replace" | "merge" | "append";

export type PersonaTierDefInput = {
  id?: string;
  code: string;
  title: string;
  description: string | null;
  sort_order: number;
  archived?: boolean;
};

export type PersonaJobTypeDefInput = {
  id?: string;
  code: string;
  title: string;
  hint: string | null;
  sort_order: number;
  archived?: boolean;
};
