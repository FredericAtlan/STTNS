import type { SttnsPersona } from "@/types/sttns";

/** Personas pilotes pour les user stories (démo IA MarketChain). */
export const STORY_PILOT_PERSONA_CODES = new Set(["P1", "P6", "P7"]);

const STORY_PILOT_NAMES = new Set(["Adja Cissé", "Laura Schneider", "Yao Koffi"]);

export function isStoryPilotPersona(persona: SttnsPersona): boolean {
  if (persona.project_scope === "reference") return false;
  const code = persona.persona_code?.trim().toUpperCase();
  if (code && STORY_PILOT_PERSONA_CODES.has(code)) return true;
  return STORY_PILOT_NAMES.has(persona.name);
}

export function filterStoryPilotPersonas(personas: SttnsPersona[]): SttnsPersona[] {
  return personas.filter(isStoryPilotPersona);
}
