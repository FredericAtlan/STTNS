import Link from "next/link";
import {
  fetchAdminStats,
  fetchAdminUsers,
  fetchDatabaseFillRate,
  fetchGlobalHygieneSummary,
} from "@/lib/sttns/adminData";
import { AdminGlobalHygieneSummary } from "@/components/admin/AdminGlobalHygieneSummary";
import { AdminRecentUsersTable } from "@/components/admin/AdminRecentUsersTable";
import { Database, FolderKanban, Users } from "lucide-react";

export default async function AdminDashboardPage() {
  const [stats, users, hygiene, fillRate] = await Promise.all([
    fetchAdminStats(),
    fetchAdminUsers(),
    fetchGlobalHygieneSummary(),
    fetchDatabaseFillRate(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <h2 className="font-display text-xl font-bold">Console Admin</h2>
        <p className="mt-1 text-sm text-sttns-muted">
          Vue globale de l&apos;instance — projets, utilisateurs et santé des données.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/admin/projects"
          className="sttns-card flex items-start gap-4 transition hover:border-emerald-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
            <FolderKanban className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.projects}</p>
            <p className="text-sm font-semibold text-sttns-muted">Projets</p>
          </div>
        </Link>

        <Link
          href="/admin/users"
          className="sttns-card flex items-start gap-4 transition hover:border-emerald-300"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{stats.users}</p>
            <p className="text-sm font-semibold text-sttns-muted">Utilisateurs</p>
          </div>
        </Link>

        <div className="sttns-card flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 text-violet-800">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold">{fillRate}%</p>
            <p className="text-sm font-semibold text-sttns-muted">Remplissage base</p>
            <p className="mt-0.5 text-xs text-sttns-muted">
              Profils nommés & stories avec effort
            </p>
          </div>
        </div>
      </div>

      <AdminGlobalHygieneSummary summary={hygiene} />

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="font-display font-bold">Utilisateurs récents</h3>
            <p className="mt-1 text-sm text-sttns-muted">
              Aperçu — gestion complète sur la page Utilisateurs.
            </p>
          </div>
          <Link href="/admin/users" className="text-sm font-semibold text-sttns-accent hover:underline">
            Voir tout →
          </Link>
        </div>

        <AdminRecentUsersTable users={users.slice(0, 12)} />
      </section>
    </div>
  );
}
