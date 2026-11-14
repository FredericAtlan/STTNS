"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Shield, ShieldOff } from "lucide-react";
import {
  setPlatformRoleAction,
  updateUserProfileAdminAction,
} from "@/app/admin/actions";
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

export function UsersAdminTable({ users }: { users: AdminUserRow[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameEdits, setNameEdits] = useState<Record<string, string>>(() =>
    Object.fromEntries(users.map((u) => [u.id, u.full_name ?? ""]))
  );

  async function toggleAdmin(userId: string, current: SttnsPlatformRole) {
    setBusyId(userId);
    setError(null);
    const next: SttnsPlatformRole = current === "admin" ? "user" : "admin";
    const result = await setPlatformRoleAction(userId, next);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  async function saveName(userId: string) {
    const fullName = nameEdits[userId] ?? "";
    const original = users.find((u) => u.id === userId)?.full_name ?? "";
    if (fullName.trim() === original.trim()) return;

    setBusyId(userId);
    setError(null);
    const result = await updateUserProfileAdminAction(userId, { full_name: fullName });
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <SttnsDataTable
        rows={users}
        emptyMessage="Aucun utilisateur inscrit."
        columns={[
          {
            id: "user",
            header: "Utilisateur",
            cell: (user) => (
              <div>
                <input
                  type="text"
                  value={nameEdits[user.id] ?? ""}
                  onChange={(e) =>
                    setNameEdits((prev) => ({ ...prev, [user.id]: e.target.value }))
                  }
                  onBlur={() => saveName(user.id)}
                  className="w-full min-w-[140px] rounded border border-zinc-200 px-2 py-1 text-sm font-semibold"
                />
                <p className="mt-1 text-xs text-zinc-500">{user.email}</p>
              </div>
            ),
          },
          {
            id: "platform",
            header: "Plateforme",
            cell: (user) => platformRolePill(user.platform_role),
          },
          {
            id: "projects",
            header: "Projets",
            cell: (user) =>
              user.memberships.length === 0 ? (
                <span className="text-xs text-zinc-400">—</span>
              ) : (
                <ul className="space-y-1 text-xs">
                  {user.memberships.map((m) => (
                    <li key={`${m.project_id}-${m.role}`}>
                      <Link
                        href={`/projects/${m.project_slug}/settings?tab=team`}
                        className="font-semibold text-emerald-700 hover:underline"
                      >
                        {m.project_name}
                      </Link>
                      <span className="text-zinc-400"> · {m.role}</span>
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            id: "actions",
            header: "Actions",
            cell: (user) => (
              <button
                type="button"
                onClick={() => toggleAdmin(user.id, user.platform_role)}
                disabled={busyId === user.id}
                className="inline-flex items-center gap-1 rounded border border-zinc-200 px-2 py-1 text-xs font-semibold hover:bg-zinc-50 disabled:opacity-50"
              >
                {busyId === user.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : user.platform_role === "admin" ? (
                  <ShieldOff className="h-3.5 w-3.5" />
                ) : (
                  <Shield className="h-3.5 w-3.5" />
                )}
                {user.platform_role === "admin" ? "Rétrograder" : "Promouvoir Admin"}
              </button>
            ),
          },
        ]}
      />
    </div>
  );
}
