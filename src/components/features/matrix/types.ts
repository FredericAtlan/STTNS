import type { SttnsInitiative } from "@/types/sttns";

export type MatrixView = "kano" | "rice" | "god_view";

type MatrixFeatureCore = Pick<
  SttnsInitiative,
  | "id"
  | "feature_code"
  | "feature_name"
  | "kano_type"
  | "projected_satisfaction_level"
  | "projected_functionality_level"
  | "rice_reach"
  | "rice_impact"
  | "rice_confidence"
  | "rice_effort"
  | "rice_score"
>;

type MatrixFeatureGovernance = Partial<
  Pick<
    SttnsInitiative,
    | "status"
    | "workflow_status"
    | "review_status"
    | "phase1_status"
    | "final_decision"
    | "decision"
    | "ceo_final_phase2"
  >
>;

/** Core + gouvernance optionnelle (preview formulaire Kano sans statut). */
export type MatrixFeature = MatrixFeatureCore & MatrixFeatureGovernance;

export const MATRIX_VIEW_OPTIONS: {
  id: MatrixView;
  label: string;
  subtitle: string;
}[] = [
  { id: "god_view", label: "God View", subtitle: "Synthèse" },
  { id: "kano", label: "Kano", subtitle: "Stratégie" },
  { id: "rice", label: "RICE (legacy)", subtitle: "Déprécié" },
];
