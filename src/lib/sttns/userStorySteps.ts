import type { SttnsKanoType, SttnsValidationMethod } from "@/types/sttns";

/** Étapes framework STTNS facultatives sur une user story */
export interface SttnsUserStoryOptionalSteps {
  pain_point_detail?: string;
  market_proof?: string;
  job_functional?: string;
  job_emotional?: string;
  job_social?: string;
  ost_opportunity?: string;
  kano_type?: SttnsKanoType | "";
  kano_justification?: string;
  rice_reach?: number | null;
  rice_impact?: number | null;
  rice_confidence?: number | null;
  rice_effort?: number | null;
  validation_method?: SttnsValidationMethod | "";
  validation_kpi?: string;
}

export function parseOptionalSteps(raw: unknown): SttnsUserStoryOptionalSteps {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
  return raw as SttnsUserStoryOptionalSteps;
}

export function emptyOptionalSteps(): SttnsUserStoryOptionalSteps {
  return {};
}
