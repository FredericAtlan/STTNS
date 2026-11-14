import type { SttnsPersona, SttnsPersonaJob } from "@/types/sttns";

/** Suggestion « Afin de » à partir du JTBD et des frictions résolues. */
export function suggestSprintSoThat(job: SttnsPersonaJob, persona: SttnsPersona): string {
  const pains = persona.pain_points ?? [];
  const resolvedIds = job.resolved_pain_point_ids ?? [];
  const firstPain = pains.find((p) => resolvedIds.includes(p.id));
  if (firstPain?.label.trim()) {
    return `éliminer ${firstPain.label.trim().toLowerCase()}`;
  }
  const desc = job.description.trim();
  if (!desc) return "";
  return desc.endsWith(".") ? desc : `${desc.charAt(0).toLowerCase()}${desc.slice(1)}`;
}

/** Sous-titre de contexte indicatif depuis le persona principal. */
export function suggestStoryContextLabel(persona: SttnsPersona): string {
  const friction = persona.friction_summary?.trim();
  if (friction) return friction;
  const tier = persona.tier_label?.trim();
  if (tier) return `Profil ${tier}`;
  return "";
}
