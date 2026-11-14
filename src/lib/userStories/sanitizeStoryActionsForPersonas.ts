import type { SttnsUserStoryAction } from "@/types/sttns";

/** Garde persona + plateforme ; réaligne les persona_id sur la sélection courante. */
export function sanitizeStoryActionsForPersonas(
  actions: SttnsUserStoryAction[],
  linkedPersonaIds: string[]
): SttnsUserStoryAction[] {
  const linked = new Set(linkedPersonaIds);
  const fallbackPersona = linkedPersonaIds[0] ?? null;

  return actions.map((action) => {
    if (action.actor_type === "external") {
      return {
        ...action,
        actor_type: "platform" as const,
        persona_id: null,
        external_label: null,
      };
    }
    if (action.actor_type === "persona") {
      const personaId = action.persona_id && linked.has(action.persona_id)
        ? action.persona_id
        : fallbackPersona;
      return { ...action, persona_id: personaId };
    }
    return { ...action, persona_id: null, external_label: null };
  });
}
