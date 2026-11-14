import { fetchAdminProfilesList } from "@/lib/sttns/adminData";
import { PlatformAdminPanel, RecoveryLinkGenerator } from "@/components/admin/PlatformAdminPanel";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminSecurityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const profiles = await fetchAdminProfilesList();

  return (
    <div className="space-y-8">
      <header>
        <h2 className="font-display text-xl font-bold">Security & access</h2>
        <p className="mt-1 text-sm text-sttns-muted">
          Platform admins and no-email password reset.
        </p>
      </header>

      <PlatformAdminPanel profiles={profiles} currentUserId={user.id} />
      <RecoveryLinkGenerator />
    </div>
  );
}
