"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cancelProjectInviteAction, setPlatformRoleAction } from "@/app/admin/actions";
import { RecoveryLinkGenerator } from "@/components/auth/RecoveryLinkGenerator";
import { PROJECT_ROLE_LABELS } from "@/lib/sttns/governance";
import type { SttnsPlatformRole, SttnsProfile } from "@/types/sttns";
import { Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

function displayName(p: SttnsProfile) {
  return p.full_name?.trim() || p.email?.split("@")[0] || "User";
}

export function PlatformAdminPanel({
  profiles,
  currentUserId,
}: {
  profiles: SttnsProfile[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function toggleAdmin(profile: SttnsProfile) {
    const next: SttnsPlatformRole = profile.platform_role === "admin" ? "user" : "admin";
    setBusy(profile.id);
    setMessage(null);
    const res = await setPlatformRoleAction(profile.id, next);
    if (!res.ok) setMessage(res.error);
    setBusy(null);
    router.refresh();
  }

  const sorted = [...profiles].sort((a, b) => displayName(a).localeCompare(displayName(b), "fr"));

  return (
    <div className="sttns-card">
      <div className="mb-4 flex items-center gap-2">
        <Shield className="h-5 w-5 text-sttns-accent" />
        <h3 className="font-display font-bold">Platform administrators</h3>
      </div>
      <p className="mb-4 text-sm text-sttns-muted">
        One admin manages invites, role grid and governance settings. At least one admin must
        remain.
      </p>

      {message && <p className="mb-3 text-sm text-red-600">{message}</p>}

      <ul className="space-y-2">
        {sorted.map((p) => (
          <li
            key={p.id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 px-3 py-2"
          >
            <div>
              <p className="font-semibold text-sm">
                {displayName(p)}
                {p.id === currentUserId && (
                  <span className="ml-2 text-xs text-sttns-accent">(you)</span>
                )}
              </p>
              <p className="text-xs text-sttns-muted">{p.email}</p>
            </div>
            <button
              type="button"
              disabled={!!busy}
              onClick={() => toggleAdmin(p)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-bold transition",
                p.platform_role === "admin"
                  ? "bg-slate-800 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {busy === p.id ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : p.platform_role === "admin" ? (
                "Admin"
              ) : (
                "Make admin"
              )}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

export { RecoveryLinkGenerator } from "@/components/auth/RecoveryLinkGenerator";

export function PendingInvitesList({
  invites,
  projectSlug,
  isAdmin,
}: {
  invites: { id: string; email: string; roles: string[]; created_at: string }[];
  projectSlug: string;
  isAdmin: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);

  if (!invites.length) return null;

  async function cancel(id: string) {
    setBusy(id);
    await cancelProjectInviteAction(id, projectSlug);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
      <p className="text-xs font-bold uppercase text-amber-900">Pending invites</p>
      <ul className="mt-2 space-y-2">
        {invites.map((inv) => (
          <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span>
              <strong>{inv.email}</strong>
              <span className="text-sttns-muted">
                {" "}
                — {inv.roles.map((r) => PROJECT_ROLE_LABELS[r] ?? r).join(", ")}
              </span>
            </span>
            {isAdmin && (
              <button
                type="button"
                disabled={busy === inv.id}
                onClick={() => cancel(inv.id)}
                className="text-xs font-semibold text-red-700 hover:underline"
              >
                Cancel
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
