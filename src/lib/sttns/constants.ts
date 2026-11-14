import type {
  SttnsDecision,
  SttnsInitiativeStatus,
  SttnsInitiativeVersionType,
  SttnsInitiativeExecutionStatus,
  SttnsInitiativeTaskStatus,
  SttnsKanoType,
  SttnsModuleCode,
} from "@/types/sttns";

export {
  computeSttnsScore,
  computeRiceScore,
  STTNS_COMMITTEE_MIN_SCORE,
  STTNS_SCORE_LABEL,
  STTNS_SCORE_MAX,
} from "@/lib/sttns/riceVisual";

export const VERSION_TYPE_LABELS: Record<SttnsInitiativeVersionType, string> = {
  v1_mvp: "V1 — MVP (valeur rapide)",
  v2_consolidation: "V2 — Consolidation (dette / scale)",
};

export const VERSION_TYPE_BADGES: Record<
  SttnsInitiativeVersionType,
  { label: string; className: string; tone: "blue" | "orange" }
> = {
  v1_mvp: {
    label: "V1 MVP",
    className: "border-blue-200/80 bg-blue-50 text-blue-800",
    tone: "blue",
  },
  v2_consolidation: {
    label: "V2 Scale",
    className: "border-orange-200/80 bg-orange-50 text-orange-800",
    tone: "orange",
  },
};

export const EXECUTION_STATUS_LABELS: Record<SttnsInitiativeExecutionStatus, string> = {
  pending: "En attente",
  in_development: "En développement",
  in_test: "En test",
  deployed: "Déployé",
};

export const EXECUTION_STATUS_BADGE_CLASS: Record<SttnsInitiativeExecutionStatus, string> = {
  pending: "border-zinc-200 bg-zinc-50 text-zinc-700",
  in_development: "border-blue-200 bg-blue-100 text-blue-900",
  in_test: "border-violet-200 bg-violet-100 text-violet-900",
  deployed: "border-teal-200 bg-teal-100 text-teal-900",
};

/** Ordre du pipeline d'exécution BUILD (UI). */
export const EXECUTION_STATUS_PIPELINE: SttnsInitiativeExecutionStatus[] = [
  "pending",
  "in_development",
  "in_test",
  "deployed",
];

export const TASK_STATUS_LABELS: Record<SttnsInitiativeTaskStatus, string> = {
  todo: "À faire",
  in_progress: "En cours",
  blocked: "Bloqué",
  done: "Terminé",
};

export const TASK_STATUS_PIPELINE: SttnsInitiativeTaskStatus[] = [
  "todo",
  "in_progress",
  "blocked",
  "done",
];

export const TASK_STATUS_DOT: Record<SttnsInitiativeTaskStatus, string> = {
  todo: "bg-zinc-300",
  in_progress: "bg-orange-400",
  blocked: "bg-red-400",
  done: "bg-emerald-500",
};

export const DECISION_LABELS: Record<SttnsDecision, string> = {
  build: "BUILD — Sprint MVP",
  learn: "LEARN — Test terrain",
  expert_review: "EXPERT REVIEW",
  kill: "KILL — Parking lot",
};

export const DECISION_LABELS_FICHE: Record<SttnsDecision, string> = {
  build: "BUILD: Limited MVP sprint",
  learn: "LEARN: Short field test",
  expert_review: "EXPERT REVIEW: validation before release",
  kill: "KILL: reject / parking lot",
};

export const KANO_LABELS_SHORT: Record<SttnsKanoType, string> = {
  must_be: "Must-be",
  performance: "Performance",
  attractive: "Attractive",
};

export const DECISION_COLORS: Record<SttnsDecision, string> = {
  build: "bg-emerald-100 text-emerald-800 border-emerald-200",
  learn: "bg-violet-100 text-violet-800 border-violet-200",
  expert_review: "bg-violet-50 text-violet-700 border-violet-200",
  kill: "bg-red-100 text-red-800 border-red-200",
};

export const VALIDATION_METHOD_LABELS: Record<
  import("@/types/sttns").SttnsValidationMethod,
  string
> = {
  terrain_signal: "Signal terrain / interview",
  wizard_of_oz: "Wizard of Oz / Concierge",
  mockup: "Mock-up / prototype léger",
  fake_door: "Fake door contextualisé",
};

export const STATUS_LABELS: Record<SttnsInitiativeStatus, string> = {
  draft: "Draft",
  in_review: "In review",
  approved: "Approved",
  parking_lot: "Parking lot",
};

export const MODULE_LABELS: Record<SttnsModuleCode, string> = {
  ingestion: "Mod. 1 — OCR Ingestion",
  accounting: "Mod. 2 — Accounting Engine",
  scoring_web3: "Mod. 3 & 4 — Scoring & Web3",
  platform: "Platform",
};

export const KANO_LABELS: Record<SttnsKanoType, string> = {
  must_be: "Must-be (Blocking)",
  performance: "Performance",
  attractive: "Attractive (Wow)",
};

export const INPUT_METRIC_LABELS = {
  breadth: "Breadth",
  depth: "Depth",
  frequency: "Frequency",
  efficiency: "Efficiency",
} as const;

export const MARKETCHAIN_NSM =
  "Le Volume Total de Financements Débloqués en USD pour les PME de la région.";

export const MARKETCHAIN_NSM_DESCRIPTION =
  "Pour aligner des associés, il faut une boussole mathématique unique, indiscutable et partagée. Pour MarketChain, cette boussole est notre North Star Metric (NSM).";

export const FILTER_STEPS = [
  { id: "pain", label: "Filter 0 — Pain Point", icon: "🎯" },
  { id: "legitimacy", label: "Filter 0 bis — Legitimacy", icon: "🛡️" },
  { id: "nsm", label: "Filter 1 — NSM", icon: "🧭" },
  { id: "jtbd", label: "Filter 2 — JTBD", icon: "👥" },
  { id: "ost", label: "Filter 3 — OST", icon: "🔍" },
  { id: "kano", label: "Filter 4 — KANO", icon: "🎛️" },
  { id: "rice", label: "Filter 5 — Valeur / Effort", icon: "🔢" },
  { id: "empirical", label: "Filter 6 — Validation", icon: "🧪" },
  { id: "decision", label: "Committee decision", icon: "🔒" },
] as const;
