import { fetchAdminUsers } from "@/lib/sttns/adminData";
import { UsersAdminTable } from "@/components/admin/UsersAdminTable";

export default async function AdminUsersPage() {
  const users = await fetchAdminUsers();

  return (
    <div className="space-y-6">
      <header>
        <h2 className="font-display text-xl font-bold">Utilisateurs</h2>
        <p className="mt-1 text-sm text-sttns-muted">
          Comptes inscrits, rôles plateforme et appartenances projet.
        </p>
      </header>

      <UsersAdminTable users={users} />
    </div>
  );
}
