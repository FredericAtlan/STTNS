"use server";

/**
 * @deprecated Catalogue Personas DRAFT/READY — Étape B redirect `/why` · Étape C lecture seule.
 * Toute écriture renvoie `LEGACY_READ_ONLY` (403).
 */

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import {
  deletePersona,
  duplicatePersona,
  savePersonaWithRelations,
  type PersonaJobInput,
  type PersonaPainPointInput,
} from "@/lib/sttns/savePersona";
import {
  isPersonaPhotoMimeType,
  PERSONA_PHOTO_MAX_BYTES,
} from "@/lib/sttns/personaPhoto";
import {
  clearLegacyPersonaAvatarInDb,
  removePersonaPhotoFromStorage,
  updateLegacyPersonaAvatarInDb,
  uploadPersonaPhotoToStorage,
} from "@/lib/sttns/personaPhotoStorage";
import { legacyPersonaWriteForbidden } from "@/lib/sttns/legacyPersonasFreeze";

function revalidatePersonaPaths(projectSlug: string, personaId?: string) {
  revalidatePath(`/projects/${projectSlug}/personas`);
  revalidatePath(`/projects/${projectSlug}/features/new`);
  revalidatePath(`/projects/${projectSlug}/features/arbitrage`);
  revalidatePath(`/projects/${projectSlug}/summary`);
  revalidatePath(`/projects/${projectSlug}/why`);
  if (personaId) {
    revalidatePath(`/projects/${projectSlug}/personas/${personaId}`);
  }
}

export async function savePersonaAction(
  projectId: string,
  projectSlug: string,
  data: {
    id?: string;
    persona_code: string;
    project_scope: "active" | "reference";
    name: string;
    tier_label: string;
    profile_summary: string;
    persona_status: "DRAFT" | "READY";
    pain_points: PersonaPainPointInput[];
    jobs: PersonaJobInput[];
  }
) {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;
  const result = await savePersonaWithRelations(projectId, data);
  if (result.ok) revalidatePersonaPaths(projectSlug, result.id);
  return result;
}

export async function deletePersonaAction(
  personaId: string,
  projectId: string,
  projectSlug: string
) {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;
  const result = await deletePersona(personaId, projectId);
  if (result.ok) revalidatePersonaPaths(projectSlug);
  return result;
}

export async function renamePersonaAction(
  personaId: string,
  projectId: string,
  projectSlug: string,
  newName: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_personas")
    .update({ name: newName })
    .eq("id", personaId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePersonaPaths(projectSlug, personaId);
  return { ok: true };
}

export async function duplicatePersonaAction(
  personaId: string,
  projectId: string,
  projectSlug: string
) {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;
  const result = await duplicatePersona(personaId, projectId);
  if (result.ok) revalidatePersonaPaths(projectSlug, result.id);
  return result;
}

export async function setPersonaProjectScopeAction(
  personaId: string,
  projectId: string,
  projectSlug: string,
  projectScope: "active" | "reference"
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { data: project, error: projectError } = await supabase
    .from("sttns_projects")
    .select("personas_cast_locked_at")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return { ok: false, error: "Projet introuvable." };
  }
  if (project.personas_cast_locked_at) {
    return {
      ok: false,
      error: "Casting verrouillé — réouvrez le casting depuis la page Personas pour modifier actif/inactif.",
    };
  }

  const { error } = await supabase
    .from("sttns_personas")
    .update({ project_scope: projectScope })
    .eq("id", personaId)
    .eq("project_id", projectId)
    .is("archived_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePersonaPaths(projectSlug, personaId);
  return { ok: true };
}

export async function lockPersonasCastAction(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Session expirée." };

  const { count, error: countError } = await supabase
    .from("sttns_personas")
    .select("id", { count: "exact", head: true })
    .eq("project_id", projectId)
    .eq("project_scope", "active")
    .is("archived_at", null);

  if (countError) return { ok: false, error: countError.message };
  if (!count || count < 1) {
    return { ok: false, error: "Activez au moins un persona avant de valider le casting." };
  }

  const { error } = await supabase
    .from("sttns_projects")
    .update({
      personas_cast_locked_at: new Date().toISOString(),
      personas_cast_locked_by: user.id,
    })
    .eq("id", projectId)
    .is("personas_cast_locked_at", null);

  if (error) return { ok: false, error: error.message };
  revalidatePersonaPaths(projectSlug);
  return { ok: true };
}

export async function unlockPersonasCastAction(
  projectId: string,
  projectSlug: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_projects")
    .update({
      personas_cast_locked_at: null,
      personas_cast_locked_by: null,
    })
    .eq("id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidatePersonaPaths(projectSlug);
  return { ok: true };
}

export async function uploadLegacyPersonaPhotoAction(
  projectId: string,
  projectSlug: string,
  personaId: string,
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  if (!personaId) {
    return { ok: false, error: "Persona introuvable." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucune photo sélectionnée." };
  }

  if (!isPersonaPhotoMimeType(file.type)) {
    return { ok: false, error: "Format accepté : JPG, PNG, WebP ou GIF." };
  }

  if (file.size > PERSONA_PHOTO_MAX_BYTES) {
    return { ok: false, error: "La photo ne doit pas dépasser 5 Mo." };
  }

  const supabase = await createClient();
  const { data: persona, error: personaError } = await supabase
    .from("sttns_personas")
    .select("id")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .maybeSingle();

  if (personaError || !persona) {
    return { ok: false, error: "Persona introuvable." };
  }

  const uploaded = await uploadPersonaPhotoToStorage(projectId, personaId, file);
  if (!uploaded.ok) return uploaded;

  const persisted = await updateLegacyPersonaAvatarInDb(
    projectId,
    personaId,
    uploaded.avatarUrl
  );
  if (!persisted.ok) return persisted;

  revalidatePersonaPaths(projectSlug, personaId);
  return { ok: true, avatarUrl: uploaded.avatarUrl };
}

export async function removeLegacyPersonaPhotoAction(
  projectId: string,
  projectSlug: string,
  personaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const frozen = legacyPersonaWriteForbidden();
  if (frozen) return frozen;

  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  if (!personaId) {
    return { ok: false, error: "Persona introuvable." };
  }

  const removed = await removePersonaPhotoFromStorage(projectId, personaId);
  if (!removed.ok) return removed;

  const cleared = await clearLegacyPersonaAvatarInDb(projectId, personaId);
  if (!cleared.ok) return cleared;

  revalidatePersonaPaths(projectSlug, personaId);
  return { ok: true };
}
