"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/sttns/access";
import {
  changePasswordSchema,
  joinFullName,
  profileUpdateSchema,
  type ChangePasswordInput,
  type ProfileUpdateInput,
} from "@/lib/sttns/profileSettingsSchema";
import {
  isProfileAvatarMimeType,
  PROFILE_AVATAR_BUCKET,
  PROFILE_AVATAR_MAX_BYTES,
  profileAvatarObjectPath,
} from "@/lib/sttns/profileAvatar";

function revalidateProfilePaths() {
  revalidatePath("/settings/profile");
  revalidatePath("/me");
  revalidatePath("/", "layout");
}

export async function uploadProfileAvatarAction(
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const file = formData.get("avatar");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucune photo sélectionnée." };
  }

  if (!isProfileAvatarMimeType(file.type)) {
    return { ok: false, error: "Format accepté : JPG, PNG, WebP ou GIF." };
  }

  if (file.size > PROFILE_AVATAR_MAX_BYTES) {
    return { ok: false, error: "La photo ne doit pas dépasser 5 Mo." };
  }

  const supabase = await createClient();
  const objectPath = profileAvatarObjectPath(auth.userId, file.type);
  const bytes = Buffer.from(await file.arrayBuffer());

  const { error: uploadError } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
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
  } = supabase.storage.from(PROFILE_AVATAR_BUCKET).getPublicUrl(objectPath);

  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  const { error: profileError } = await supabase
    .from("sttns_profiles")
    .update({ avatar_url: avatarUrl })
    .eq("id", auth.userId);

  if (profileError) {
    return { ok: false, error: profileError.message };
  }

  revalidateProfilePaths();
  return { ok: true, avatarUrl };
}

export async function removeProfileAvatarAction(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const supabase = await createClient();

  const { data: existingFiles } = await supabase.storage
    .from(PROFILE_AVATAR_BUCKET)
    .list(auth.userId);

  if (existingFiles?.length) {
    const paths = existingFiles.map((file) => `${auth.userId}/${file.name}`);
    await supabase.storage.from(PROFILE_AVATAR_BUCKET).remove(paths);
  }

  const { error } = await supabase
    .from("sttns_profiles")
    .update({ avatar_url: null })
    .eq("id", auth.userId);

  if (error) return { ok: false, error: error.message };

  revalidateProfilePaths();
  return { ok: true };
}

export async function updateProfileSettingsAction(
  input: ProfileUpdateInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const parsed = profileUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_profiles")
    .update({
      full_name: joinFullName(parsed.data.first_name, parsed.data.last_name),
    })
    .eq("id", auth.userId);

  if (error) return { ok: false, error: error.message };
  revalidateProfilePaths();
  return { ok: true };
}

export async function changeProfilePasswordAction(
  input: ChangePasswordInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await requireAuth();
  if (!auth.ok) return auth;

  const parsed = changePasswordSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
