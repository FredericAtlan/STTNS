import type { SttnsStoryActorType, SttnsInitiative, SttnsPersona, SttnsUserStoryAction } from "@/types/sttns";

export const STORY_ACTOR_LABELS: Record<SttnsStoryActorType, string> = {
  persona: "Persona",
  platform: "La Plateforme",
  external: "Tiers externe",
};

export const STORY_ACTOR_COLORS: Record<SttnsStoryActorType, string> = {
  persona: "border-l-blue-500 bg-blue-50/50",
  platform: "border-l-emerald-500 bg-emerald-50/50",
  external: "border-l-amber-500 bg-amber-50/50",
};

export function parseStoryActions(raw: unknown): SttnsUserStoryAction[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((a) => a && typeof a === "object")
    .map((a, i) => ({
      sort_order: typeof a.sort_order === "number" ? a.sort_order : i + 1,
      actor_type: a.actor_type === "platform" || a.actor_type === "external" ? a.actor_type : "persona",
      persona_id: typeof a.persona_id === "string" ? a.persona_id : null,
      external_label: typeof a.external_label === "string" ? a.external_label : null,
      verb: String(a.verb ?? "").trim(),
      object: String(a.object ?? "").trim(),
      note: typeof a.note === "string" ? a.note : null,
      initiative_id: typeof a.initiative_id === "string" ? a.initiative_id : null,
    }))
    .filter((a) => a.verb && a.object)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function emptyStoryAction(sortOrder: number, defaultPersonaId?: string | null): SttnsUserStoryAction {
  return {
    sort_order: sortOrder,
    actor_type: "persona",
    persona_id: defaultPersonaId ?? null,
    external_label: null,
    verb: "",
    object: "",
    note: null,
    initiative_id: null,
  };
}

export function actorDisplayName(
  action: SttnsUserStoryAction,
  personasById: Map<string, SttnsPersona>
): string {
  if (action.actor_type === "platform") return "La Plateforme";
  if (action.actor_type === "external") return action.external_label?.trim() || "External party";
  const persona = action.persona_id ? personasById.get(action.persona_id) : undefined;
  return persona?.name ?? "Persona";
}

export function formatActionLine(
  action: SttnsUserStoryAction,
  personasById: Map<string, SttnsPersona>,
  initiativesById?: Map<string, SttnsInitiative>
): string {
  const subject = actorDisplayName(action, personasById);
  const base = `${subject} ${action.verb} ${action.object}`;
  const initiative =
    action.initiative_id && initiativesById
      ? initiativesById.get(action.initiative_id)
      : undefined;
  const code = initiative?.feature_code;
  if (code && !base.includes(code)) {
    return `${base} (${code})`;
  }
  return base;
}

export function primaryPersonaName(
  story: { primary_persona_id?: string | null; primary_persona?: SttnsPersona | null },
  personas: SttnsPersona[]
): string | null {
  if (story.primary_persona?.name) return story.primary_persona.name;
  if (!story.primary_persona_id) return null;
  return personas.find((p) => p.id === story.primary_persona_id)?.name ?? null;
}

export function sanitizeStoryActions(actions: SttnsUserStoryAction[]): SttnsUserStoryAction[] {
  return actions
    .map((a, i) => ({
      sort_order: i + 1,
      actor_type: a.actor_type,
      persona_id: a.actor_type === "persona" ? a.persona_id || null : null,
      external_label: a.actor_type === "external" ? a.external_label?.trim() || null : null,
      verb: a.verb.trim(),
      object: a.object.trim(),
      note: a.note?.trim() || null,
      initiative_id: a.initiative_id || null,
    }))
    .filter((a) => a.verb && a.object);
}

export function initialActionsFromStory(
  story?: { actions?: unknown },
  defaultPersonaId?: string | null
): SttnsUserStoryAction[] {
  const parsed = parseStoryActions(story?.actions);
  return parsed.length ? parsed : [emptyStoryAction(1, defaultPersonaId)];
}
