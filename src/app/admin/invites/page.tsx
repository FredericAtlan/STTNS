import { fetchAdminInvites } from "@/lib/sttns/adminData";
import { InvitesAdminTable } from "@/components/admin/InvitesAdminTable";

export default async function AdminInvitesPage() {
  const invites = await fetchAdminInvites();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Pending invites</h2>
        <p className="mt-1 text-sm text-sttns-muted">
          All projects — roles are applied on signup or immediately if the account already exists.
        </p>
      </header>
      <InvitesAdminTable invites={invites} />
    </div>
  );
}
