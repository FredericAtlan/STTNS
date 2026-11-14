import type { SupabaseClient } from "@supabase/supabase-js";
import {
  fetchPersonaVocabulary,
  resolveTierCode,
  resolveTierDisplay,
  type PersonaVocabulary,
} from "@/lib/personas/personaVocabulary";
import { LEGACY_PERSONAS_WRITE_FROZEN } from "@/lib/sttns/legacyPersonasFreeze";
import type { PersonaMetadata } from "@/lib/sttns/types";

type LegacyPersonaRow = {
  name: string;
  persona_code: string | null;
  tier_label: string | null;
};

type SpinePersonaRow = {
  id: string;
  title: string;
  code: string | null;
  metadata?: PersonaMetadata | null;
};

function normalizeName(value: string): string {
  return value.trim().toLowerCase();
}

export function findLegacyPersonaForSpine(
  spine: Pick<SpinePersonaRow, "title" | "code">,
  legacyPersonas: LegacyPersonaRow[]
): LegacyPersonaRow | undefined {
  const spineCode = spine.code?.trim().toUpperCase();
  if (spineCode) {
    const byCode = legacyPersonas.find(
      (p) => p.persona_code?.trim().toUpperCase() === spineCode
    );
    if (byCode) return byCode;
  }

  const spineName = normalizeName(spine.title);
  return legacyPersonas.find((p) => normalizeName(p.name) === spineName);
}

export function resolvePersonaSegmentLabel(
  spineSegment: string | null | undefined,
  legacyTierLabel: string | null | undefined,
  vocabulary: PersonaVocabulary
): string | null {
  if (spineSegment?.trim()) return spineSegment.trim();
  if (!legacyTierLabel?.trim()) return null;
  return resolveTierDisplay(legacyTierLabel, vocabulary) ?? legacyTierLabel.trim();
}

export function enrichSpinePersonasWithSegment<T extends SpinePersonaRow>(
  spinePersonas: T[],
  legacyPersonas: LegacyPersonaRow[],
  vocabulary: PersonaVocabulary
): (T & { segment: string | null })[] {
  return spinePersonas.map((persona) => {
    const legacy = findLegacyPersonaForSpine(persona, legacyPersonas);
    const meta = persona.metadata ?? {};
    return {
      ...persona,
      segment: resolvePersonaSegmentLabel(meta.segment, legacy?.tier_label ?? null, vocabulary),
    };
  });
}

async function findSpinePersonaWorkItem(
  supabase: SupabaseClient,
  projectId: string,
  personaName: string,
  personaCode: string
): Promise<SpinePersonaRow | null> {
  const { data: items, error } = await supabase
    .from("sttns_work_items")
    .select("id, title, code, metadata")
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null);

  if (error || !items?.length) return null;

  const codeKey = personaCode.trim().toUpperCase();
  const nameKey = normalizeName(personaName);

  const match = items.find((item) => {
    const itemCode = item.code?.trim().toUpperCase();
    if (codeKey && itemCode === codeKey) return true;
    return normalizeName(item.title ?? "") === nameKey;
  });

  return match ?? null;
}

/** Propagate legacy catalogue segment (tier) → Spine metadata.segment (matrice Why). */
export async function syncSpinePersonaSegmentFromLegacy(
  supabase: SupabaseClient,
  projectId: string,
  personaName: string,
  personaCode: string,
  tierLabel: string | null | undefined,
  vocabulary?: PersonaVocabulary
): Promise<void> {
  const vocab = vocabulary ?? (await fetchPersonaVocabulary(supabase, projectId));
  const segment = resolvePersonaSegmentLabel(null, tierLabel, vocab);
  if (!segment) return;

  const spine = await findSpinePersonaWorkItem(supabase, projectId, personaName, personaCode);
  if (!spine) return;

  const metadata: PersonaMetadata = {
    ...((spine.metadata as PersonaMetadata | null) ?? {}),
    segment,
  };

  await supabase
    .from("sttns_work_items")
    .update({ metadata })
    .eq("id", spine.id)
    .eq("project_id", projectId);
}

/** Propagate Spine metadata.segment → legacy tier_label when recognizable. */
export async function syncLegacyTierFromSpineSegment(
  supabase: SupabaseClient,
  projectId: string,
  personaName: string,
  personaCode: string | null | undefined,
  segment: string | null | undefined,
  vocabulary?: PersonaVocabulary
): Promise<void> {
  if (LEGACY_PERSONAS_WRITE_FROZEN) return;
  if (!segment?.trim()) return;

  const vocab = vocabulary ?? (await fetchPersonaVocabulary(supabase, projectId));
  const tierCode = resolveTierCode(segment, vocab.tiers.map((t) => t.code));

  const { data: legacyRows } = await supabase
    .from("sttns_personas")
    .select("id, name, persona_code")
    .eq("project_id", projectId)
    .is("archived_at", null);

  if (!legacyRows?.length) return;

  const codeKey = personaCode?.trim().toUpperCase();
  const match = legacyRows.find((persona) => {
    if (codeKey && persona.persona_code?.trim().toUpperCase() === codeKey) return true;
    return normalizeName(persona.name) === normalizeName(personaName);
  });

  if (!match) return;

  await supabase.from("sttns_personas").update({ tier_label: tierCode }).eq("id", match.id);
}
