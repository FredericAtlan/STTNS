"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, User } from "lucide-react";
import {
  changeProfilePasswordAction,
  updateProfileSettingsAction,
} from "@/app/settings/profile/actions";
import { ProfileAvatarUpload } from "@/components/settings/ProfileAvatarUpload";
import {
  changePasswordSchema,
  profileUpdateSchema,
  splitFullName,
  joinFullName,
} from "@/lib/sttns/profileSettingsSchema";
import type { SttnsProfile } from "@/types/sttns";

interface Props {
  profile: SttnsProfile | null;
  email: string | null;
}

export function ProfileSettingsForm({ profile, email }: Props) {
  const router = useRouter();
  const initialNames = useMemo(() => splitFullName(profile?.full_name), [profile?.full_name]);

  const [firstName, setFirstName] = useState(initialNames.first_name);
  const [lastName, setLastName] = useState(initialNames.last_name);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileBusy, setProfileBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  const displayName = useMemo(() => {
    const joined = joinFullName(firstName, lastName);
    return joined || profile?.full_name?.trim() || email?.split("@")[0] || "Utilisateur";
  }, [firstName, lastName, profile?.full_name, email]);

  async function handleProfileSubmit(e: React.FormEvent) {
    e.preventDefault();
    setProfileBusy(true);
    setProfileError(null);
    setProfileSuccess(null);

    const parsed = profileUpdateSchema.safeParse({
      first_name: firstName,
      last_name: lastName,
    });

    if (!parsed.success) {
      setProfileError(parsed.error.issues[0]?.message ?? "Données invalides.");
      setProfileBusy(false);
      return;
    }

    const result = await updateProfileSettingsAction(parsed.data);
    setProfileBusy(false);

    if (!result.ok) {
      setProfileError(result.error);
      return;
    }

    setProfileSuccess("Profil mis à jour avec succès.");
    router.refresh();
  }

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordBusy(true);
    setPasswordError(null);
    setPasswordSuccess(null);

    const parsed = changePasswordSchema.safeParse({ password, confirmPassword });
    if (!parsed.success) {
      setPasswordError(parsed.error.issues[0]?.message ?? "Données invalides.");
      setPasswordBusy(false);
      return;
    }

    const result = await changeProfilePasswordAction(parsed.data);
    setPasswordBusy(false);

    if (!result.ok) {
      setPasswordError(result.error);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setPasswordSuccess("Mot de passe mis à jour avec succès.");
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="font-display text-xl font-bold text-zinc-900">Paramètres profil</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Gérez votre identité et la sécurité de votre compte.
        </p>
      </header>

      <section className="sttns-card space-y-4">
        <div className="flex items-center gap-2">
          <User className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-zinc-900">Identité</h2>
        </div>

        {profileError && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {profileError}
          </div>
        )}
        {profileSuccess && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {profileSuccess}
          </div>
        )}

        <ProfileAvatarUpload
          avatarUrl={profile?.avatar_url ?? null}
          displayName={displayName}
        />

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-email" className="mb-1 block text-xs font-semibold text-zinc-600">
              Email
            </label>
            <input
              id="profile-email"
              type="email"
              value={email ?? profile?.email ?? ""}
              disabled
              className="w-full rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="profile-first-name" className="mb-1 block text-xs font-semibold text-zinc-600">
                Prénom
              </label>
              <input
                id="profile-first-name"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                autoComplete="given-name"
              />
            </div>
            <div>
              <label htmlFor="profile-last-name" className="mb-1 block text-xs font-semibold text-zinc-600">
                Nom
              </label>
              <input
                id="profile-last-name"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
                autoComplete="family-name"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={profileBusy}
            className="inline-flex items-center gap-2 rounded-md bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50"
          >
            {profileBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Enregistrer le profil
          </button>
        </form>
      </section>

      <section className="sttns-card space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="h-4 w-4 text-emerald-700" />
          <h2 className="text-sm font-semibold text-zinc-900">Sécurité</h2>
        </div>

        {passwordError && (
          <div className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {passwordError}
          </div>
        )}
        {passwordSuccess && (
          <div className="rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            {passwordSuccess}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="profile-password" className="mb-1 block text-xs font-semibold text-zinc-600">
              Nouveau mot de passe
            </label>
            <input
              id="profile-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>
          <div>
            <label
              htmlFor="profile-confirm-password"
              className="mb-1 block text-xs font-semibold text-zinc-600"
            >
              Confirmer le mot de passe
            </label>
            <input
              id="profile-confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={passwordBusy}
            className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            {passwordBusy && <Loader2 className="h-4 w-4 animate-spin" />}
            Changer le mot de passe
          </button>
        </form>
      </section>
    </div>
  );
}
