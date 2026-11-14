"use client";

import { SttnsDataTable } from "@/components/ui/SttnsDataTable";
import { StatusPill } from "@/components/ui/StatusPill";
import type { AdminUserRow } from "@/lib/sttns/adminData";
import type { SttnsPlatformRole } from "@/types/sttns";

function platformRolePill(role: SttnsPlatformRole) {
  if (role === "admin") {
    return <StatusPill status="done" label="Super admin" />;
  }
  return <StatusPill status="todo" label="Utilisateur" />;
}

export function AdminRecentUsersTable({ users }: { users: AdminUserRow[] }) {
  return (
    <SttnsDataTable
      rows={users}
      emptyMessage="Aucun utilisateur inscrit."
      columns={[
        {
          id: "name",
          header: "Nom",
          cell: (user) => (
            <span className="font-medium text-zinc-900">{user.full_name ?? "—"}</span>
          ),
        },
        {
          id: "email",
          header: "Email",
          cell: (user) => <span className="text-zinc-500">{user.email ?? "—"}</span>,
        },
        {
          id: "role",
          header: "Rôle plateforme",
          cell: (user) => platformRolePill(user.platform_role),
        },
      ]}
    />
  );
}
