import {
  isProfileAvatarMimeType,
  profileAvatarExtension,
  PROFILE_AVATAR_MAX_BYTES,
  PROFILE_AVATAR_MIME_TYPES,
  type ProfileAvatarMimeType,
} from "@/lib/sttns/profileAvatar";

export const PERSONA_PHOTO_BUCKET = "persona-photos";

export {
  PROFILE_AVATAR_MAX_BYTES as PERSONA_PHOTO_MAX_BYTES,
  PROFILE_AVATAR_MIME_TYPES as PERSONA_PHOTO_MIME_TYPES,
  isProfileAvatarMimeType as isPersonaPhotoMimeType,
};

export function personaPhotoObjectPath(
  projectId: string,
  personaId: string,
  mimeType: ProfileAvatarMimeType
): string {
  return `${projectId}/${personaId}/avatar.${profileAvatarExtension(mimeType)}`;
}
