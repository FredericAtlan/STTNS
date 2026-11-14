export const PROFILE_AVATAR_BUCKET = "avatars";

export const PROFILE_AVATAR_MAX_BYTES = 5 * 1024 * 1024;

export const PROFILE_AVATAR_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
] as const;

export type ProfileAvatarMimeType = (typeof PROFILE_AVATAR_MIME_TYPES)[number];

export function isProfileAvatarMimeType(value: string): value is ProfileAvatarMimeType {
  return (PROFILE_AVATAR_MIME_TYPES as readonly string[]).includes(value);
}

export function profileAvatarExtension(mimeType: ProfileAvatarMimeType): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
  }
}

export function profileAvatarObjectPath(userId: string, mimeType: ProfileAvatarMimeType): string {
  return `${userId}/avatar.${profileAvatarExtension(mimeType)}`;
}
