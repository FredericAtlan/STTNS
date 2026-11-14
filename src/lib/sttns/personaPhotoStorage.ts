import { createServiceClient } from "@/lib/supabase/server";
import type { ProfileAvatarMimeType } from "@/lib/sttns/profileAvatar";
import type { PersonaMetadata } from "@/lib/sttns/types";
import {
  isPersonaPhotoMimeType,
  PERSONA_PHOTO_BUCKET,
  PERSONA_PHOTO_MAX_BYTES,
  PERSONA_PHOTO_MIME_TYPES,
  personaPhotoObjectPath,
} from "@/lib/sttns/personaPhoto";

let bucketEnsured = false;

async function ensurePersonaPhotosBucket(
  service: NonNullable<ReturnType<typeof createServiceClient>>
): Promise<void> {
  if (bucketEnsured) return;

  const { data: buckets, error: listError } = await service.storage.listBuckets();
  if (listError) {
    throw new Error(listError.message);
  }

  if (buckets?.some((b) => b.id === PERSONA_PHOTO_BUCKET)) {
    bucketEnsured = true;
    return;
  }

  const { error: createError } = await service.storage.createBucket(PERSONA_PHOTO_BUCKET, {
    public: true,
    fileSizeLimit: PERSONA_PHOTO_MAX_BYTES,
    allowedMimeTypes: [...PERSONA_PHOTO_MIME_TYPES],
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(createError.message);
  }

  bucketEnsured = true;
}

export async function uploadPersonaPhotoToStorage(
  projectId: string,
  personaId: string,
  file: File
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  if (!isPersonaPhotoMimeType(file.type)) {
    return { ok: false, error: "Format accepté : JPG, PNG, WebP ou GIF." };
  }

  if (file.size > PERSONA_PHOTO_MAX_BYTES) {
    return { ok: false, error: "La photo ne doit pas dépasser 5 Mo." };
  }

  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Stockage indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  try {
    await ensurePersonaPhotosBucket(service);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Impossible de préparer le stockage.";
    return { ok: false, error: message };
  }

  const objectPath = personaPhotoObjectPath(
    projectId,
    personaId,
    file.type as ProfileAvatarMimeType
  );
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await service.storage
    .from(PERSONA_PHOTO_BUCKET)
    .upload(objectPath, bytes, {
      upsert: true,
      contentType: file.type,
      cacheControl: "3600",
    });

  if (uploadError) {
    return { ok: false, error: uploadError.message };
  }

  const {
    data: { publicUrl },
  } = service.storage.from(PERSONA_PHOTO_BUCKET).getPublicUrl(objectPath);

  return { ok: true, avatarUrl: `${publicUrl}?v=${Date.now()}` };
}

export async function removePersonaPhotoFromStorage(
  projectId: string,
  personaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Stockage indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  try {
    await ensurePersonaPhotosBucket(service);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Impossible de préparer le stockage.";
    return { ok: false, error: message };
  }

  const prefix = `${projectId}/${personaId}`;
  const { data: existingFiles } = await service.storage
    .from(PERSONA_PHOTO_BUCKET)
    .list(`${projectId}/${personaId}`);

  if (existingFiles?.length) {
    const paths = existingFiles.map((f) => `${prefix}/${f.name}`);
    const { error } = await service.storage.from(PERSONA_PHOTO_BUCKET).remove(paths);
    if (error) return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function updateSpinePersonaAvatarInDb(
  projectId: string,
  personaId: string,
  avatarUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Base de données indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  const { data: workItem, error: fetchError } = await service
    .from("sttns_work_items")
    .select("metadata")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null)
    .maybeSingle();

  if (fetchError || !workItem) {
    return { ok: false, error: fetchError?.message ?? "Persona introuvable." };
  }

  const metadata: PersonaMetadata = {
    ...((workItem.metadata as PersonaMetadata | null) ?? {}),
    avatar_url: avatarUrl,
  };

  const { error: updateError } = await service
    .from("sttns_work_items")
    .update({ metadata })
    .eq("id", personaId)
    .eq("project_id", projectId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}

export async function clearSpinePersonaAvatarInDb(
  projectId: string,
  personaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Base de données indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  const { data: workItem, error: fetchError } = await service
    .from("sttns_work_items")
    .select("metadata")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null)
    .maybeSingle();

  if (fetchError || !workItem) {
    return { ok: false, error: fetchError?.message ?? "Persona introuvable." };
  }

  const metadata = { ...((workItem.metadata as PersonaMetadata | null) ?? {}) };
  delete metadata.avatar_url;

  const { error: updateError } = await service
    .from("sttns_work_items")
    .update({ metadata })
    .eq("id", personaId)
    .eq("project_id", projectId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}

export async function updateLegacyPersonaAvatarInDb(
  projectId: string,
  personaId: string,
  avatarUrl: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Base de données indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  const { error: updateError } = await service
    .from("sttns_personas")
    .update({ avatar_url: avatarUrl })
    .eq("id", personaId)
    .eq("project_id", projectId)
    .is("archived_at", null);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}

export async function clearLegacyPersonaAvatarInDb(
  projectId: string,
  personaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const service = createServiceClient();
  if (!service) {
    return {
      ok: false,
      error:
        "Base de données indisponible — vérifiez SUPABASE_SERVICE_ROLE_KEY sur le serveur.",
    };
  }

  const { error: updateError } = await service
    .from("sttns_personas")
    .update({ avatar_url: null })
    .eq("id", personaId)
    .eq("project_id", projectId);

  if (updateError) return { ok: false, error: updateError.message };
  return { ok: true };
}
