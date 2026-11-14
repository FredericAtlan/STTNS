import { createClient } from "@/lib/supabase/server";
import type { SttnsProfile } from "@/types/sttns";

export function isPlatformAdmin(profile: Pick<SttnsProfile, "platform_role"> | null | undefined) {
  return profile?.platform_role === "admin";
}

export async function getProfileForUser(userId: string): Promise<SttnsProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("sttns_profiles")
    .select("id, full_name, email, avatar_url, platform_role")
    .eq("id", userId)
    .single();
  return data as SttnsProfile | null;
}
