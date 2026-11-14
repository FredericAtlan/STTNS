"use client";

import { useRouter } from "next/navigation";
import { cancelProjectInviteAction } from "@/app/admin/actions";
import { PROJECT_ROLE_LABELS } from "@/lib/sttns/governance";
import type { AdminInviteRow } from "@/lib/sttns/adminData";
import Link from "next/link";
import { useState } from "react";

export function InvitesAdminTable({ invites }: { invites: AdminInviteRow[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  async function cancel(id: string, slug: string) {
    setBusy(id);
    await cancelProjectInviteAction(id, slug);
    setBusy(null);
    router.refresh();
  }

  if (!invites.length) {
    return (
      <p className="sttns-card text-center text-sm text-sttns-muted">
        No pending invites.
      </p>
    );
  }

  return (
    <div className="sttns-card overflow-x-auto p-0">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-sttns-muted">
            <th className="px-4 py-3">Email</th>
            <th className="px-4 py-3">Project</th>
            <th className="px-4 py-3">Roles</th>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3" />
          </tr>
        </thead>
        <tbody>
          {invites.map((inv) => (
            <tr key={inv.id} className="border-b border-slate-100">
              <td className="px-4 py-3 font-medium">{inv.email}</td>
              <td className="px-4 py-3">
                {inv.project_slug ? (
                  <Link
                    href={`/projects/${inv.project_slug}/team`}
                    className="font-semibold text-sttns-accent hover:underline"
                  >
                    {inv.project_name}
                  </Link>
                ) : (
                  inv.project_name
                )}
              </td>
              <td className="px-4 py-3 text-xs">
                {inv.roles.map((r) => PROJECT_ROLE_LABELS[r] ?? r).join(", ")}
              </td>
              <td className="px-4 py-3 text-xs text-sttns-muted">
                {new Date(inv.created_at).toLocaleDateString("fr-FR")}
              </td>
              <td className="px-4 py-3">
                <button
                  type="button"
                  disabled={busy === inv.id}
                  onClick={() => cancel(inv.id, inv.project_slug)}
                  className="text-xs font-semibold text-red-700 hover:underline"
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
