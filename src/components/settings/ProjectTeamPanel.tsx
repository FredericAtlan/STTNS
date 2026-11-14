"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, X } from "lucide-react";
import {
  cancelProjectInviteAction,
  inviteOrAddProjectMemberAction,
  updateMemberSquadRoleAction,
} from "@/app/projects/[slug]/settings/actions";
import {
  SQUAD_PROJECT_ROLE_LABELS,
  type ProjectInviteMemberInput,
} from "@/lib/sttns/projectSettingsSchema";
import { SQUAD_ROLE_DESCRIPTIONS } from "@/lib/sttns/squadRoles";
import type { ProjectMemberRow } from "@/lib/sttns/projectMembers";
import { SquadRoleBadge } from "@/components/settings/SquadRoleBadge";
import type { SttnsProjectInvite, SttnsSquadProjectRole } from "@/types/sttns";

const SQUAD_ROLES: SttnsSquadProjectRole[] = ["viewer", "editor", "ceo_admin"];

type Props = {
  projectId: string;
  projectSlug: string;
  projectName: string;
  members: ProjectMemberRow[];
  pendingInvites: SttnsProjectInvite[];
  canEdit: boolean;
  currentUserId: string;
};

export function ProjectTeamPanel({
  projectId,
  projectSlug,
  projectName,
  members,
  pendingInvites,
  canEdit,
  currentUserId,
}: Props) {
  const router = useRouter();
  const [mode, setMode] = useState<"email" | "id">("email");
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");
  const [projectRole, setProjectRole] = useState<SttnsSquadProjectRole>("editor");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (isSubmitting || !canEdit) return;

    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    const payload: ProjectInviteMemberInput = {
      project_role: projectRole,
      email: mode === "email" ? email : "",
      user_id: mode === "id" ? userId : "",
    };

    const result = await inviteOrAddProjectMemberAction(
      projectId,
      projectSlug,
      projectName,
      payload
    );

    setIsSubmitting(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(result.message ?? "Membre ajouté.");
    setEmail("");
    setUserId("");
    router.refresh();
  }

  async function handleRoleChange(memberId: string, nextRole: SttnsSquadProjectRole) {
    if (!canEdit || busyMemberId) return;

    setBusyMemberId(memberId);
    setError(null);

    const result = await updateMemberSquadRoleAction(projectId, projectSlug, {
      user_id: memberId,
      project_role: nextRole,
    });

    setBusyMemberId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    router.refresh();
  }

  async function handleCancelInvite(inviteId: string) {
    if (!canEdit || busyInviteId) return;

    setBusyInviteId(inviteId);
    setError(null);
    setSuccess(null);

    const result = await cancelProjectInviteAction(projectId, projectSlug, inviteId);

    setBusyInviteId(null);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setSuccess(result.message ?? "Invitation retirée.");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="rounded border border-sky-100 bg-sky-50/60 px-4 py-3 text-xs text-sky-900">
        <strong>Squad STTNS</strong> — 3 niveaux transverses :{" "}
        <strong>Lecteur</strong> (Vision / Epics/Features / Exécution Kanban en lecture),{" "}
        <strong>Éditeur</strong> (écriture Spine), <strong>Admin projet</strong> (paramètres
        et équipe). Plusieurs éditeurs ou admins peuvent coexister sans conflit.
      </div>

      {!canEdit && (
        <p className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Lecture seule — seuls les admins projet peuvent inviter ou modifier les rôles.
        </p>
      )}

      <div className="sttns-card p-0 overflow-hidden">
        <div className="border-b border-zinc-200 px-4 py-3">
          <h3 className="text-sm font-semibold text-zinc-900">
            Membres ({members.length})
          </h3>
        </div>
        <div className="sttns-scroll-x">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-semibold uppercase text-zinc-500">
                <th className="px-4 py-2.5">Utilisateur</th>
                <th className="px-4 py-2.5">Rôle squad</th>
                <th className="px-4 py-2.5">Depuis</th>
              </tr>
            </thead>
            <tbody>
              {members.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-6 text-center text-zinc-500">
                    Aucun membre enregistré.
                  </td>
                </tr>
              ) : (
                members.map((member) => (
                  <tr key={member.user_id} className="border-b border-zinc-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-zinc-900">
                        {member.profile.full_name ?? "—"}
                        {member.user_id === currentUserId && (
                          <span className="ml-1 text-xs text-zinc-400">(vous)</span>
                        )}
                      </p>
                      <p className="text-xs text-zinc-500">{member.profile.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      {canEdit ? (
                        <select
                          value={member.project_role}
                          disabled={busyMemberId === member.user_id}
                          onChange={(e) =>
                            handleRoleChange(
                              member.user_id,
                              e.target.value as SttnsSquadProjectRole
                            )
                          }
                          className="rounded border border-zinc-300 px-2 py-1 text-xs font-medium focus:border-emerald-500 focus:outline-none disabled:opacity-50"
                        >
                          {SQUAD_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {SQUAD_PROJECT_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <SquadRoleBadge role={member.project_role} />
                      )}
                      <p className="mt-1 text-[11px] text-zinc-400 max-w-xs">
                        {SQUAD_ROLE_DESCRIPTIONS[member.project_role]}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-500">
                      {new Date(member.joined_at).toLocaleDateString("fr-FR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {pendingInvites.length > 0 && (
        <div className="sttns-card space-y-2">
          <h3 className="text-sm font-semibold text-zinc-900">
            Invitations en attente ({pendingInvites.length})
          </h3>
          <ul className="space-y-1 text-sm text-zinc-600">
            {pendingInvites.map((inv) => {
              const squad =
                (inv as SttnsProjectInvite & { squad_role?: SttnsSquadProjectRole })
                  .squad_role ?? "editor";
              return (
                <li
                  key={inv.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded border border-zinc-100 bg-zinc-50/80 px-3 py-2"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{inv.email}</span>
                    <SquadRoleBadge role={squad} />
                  </div>
                  {canEdit && (
                    <button
                      type="button"
                      disabled={busyInviteId === inv.id}
                      onClick={() => handleCancelInvite(inv.id)}
                      className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                      title="Retirer l'invitation"
                    >
                      {busyInviteId === inv.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                      Retirer
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {canEdit && (
        <form onSubmit={handleInvite} className="sttns-card space-y-4 max-w-xl">
          <div>
            <h3 className="text-sm font-semibold text-zinc-900">Inviter un membre</h3>
            <p className="mt-1 text-xs text-zinc-500">
              Email ou ID Supabase — le rôle squad s&apos;applique à tout le projet.
            </p>
          </div>

          {error && (
            <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setMode("email")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                mode === "email"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              Par email
            </button>
            <button
              type="button"
              onClick={() => setMode("id")}
              className={`rounded px-3 py-1.5 text-xs font-semibold ${
                mode === "id"
                  ? "bg-emerald-100 text-emerald-800"
                  : "bg-zinc-100 text-zinc-600"
              }`}
            >
              Par ID utilisateur
            </button>
          </div>

          {mode === "email" ? (
            <div>
              <label className="block text-sm font-medium text-zinc-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="collegue@entreprise.com"
                required
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-zinc-700">ID utilisateur</label>
              <input
                type="text"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 font-mono text-sm focus:border-emerald-500 focus:outline-none"
                placeholder="uuid Supabase"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700">Rôle squad</label>
            <select
              value={projectRole}
              onChange={(e) => setProjectRole(e.target.value as SttnsSquadProjectRole)}
              className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
            >
              {SQUAD_ROLES.map((r) => (
                <option key={r} value={r}>
                  {SQUAD_PROJECT_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-zinc-500">{SQUAD_ROLE_DESCRIPTIONS[projectRole]}</p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="sttns-btn-primary sttns-btn-md"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Envoi…
              </>
            ) : (
              <>
                <UserPlus className="h-4 w-4" />
                Ajouter / Inviter
              </>
            )}
          </button>
        </form>
      )}
    </div>
  );
}
