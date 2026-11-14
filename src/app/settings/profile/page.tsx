import { redirect } from "next/navigation";
import { ProfileSettingsForm } from "@/components/settings/ProfileSettingsForm";
import { createClient } from "@/lib/supabase/server";
import type { SttnsProfile } from "@/types/sttns";

export default async function ProfileSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("id, full_name, email, avatar_url, platform_role")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <ProfileSettingsForm
      profile={(profile as SttnsProfile | null) ?? null}
      email={user.email ?? profile?.email ?? null}
    />
  );
}
