import { splitFullName } from "@/lib/sttns/profileSettingsSchema";
import type { SttnsProfile } from "@/types/sttns";

/** Initiales affichées : 1ʳᵉ lettre du prénom + 1ʳᵉ lettre du nom (dernier mot si nom composé). */
export function initialsFromDisplayName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "??";

  const { first_name, last_name } = splitFullName(trimmed);
  if (first_name && last_name) {
    const lastParts = last_name.split(/\s+/).filter(Boolean);
    const lastInitial = lastParts.at(-1)?.[0] ?? "";
    return `${first_name[0] ?? ""}${lastInitial}`.toUpperCase();
  }

  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts.at(-1)![0] ?? ""}`.toUpperCase();
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function memberInitialsFromNames(
  fullName: string | null | undefined,
  email: string | null | undefined
): string {
  const name = fullName?.trim();
  if (name) return initialsFromDisplayName(name);
  const local = email?.split("@")[0]?.trim();
  if (local) return local.slice(0, 2).toUpperCase();
  return "??";
}

export function profileDisplayName(profile: SttnsProfile | null | undefined): string {
  if (!profile) return "Non assigné";
  return profile.full_name?.trim() || profile.email?.split("@")[0] || "Membre";
}

export function profileInitials(profile: SttnsProfile | null | undefined): string {
  if (!profile) return "—";
  return memberInitialsFromNames(profile.full_name, profile.email);
}
