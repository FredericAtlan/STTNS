"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, User } from "lucide-react";
import {
  removeProfileAvatarAction,
  uploadProfileAvatarAction,
} from "@/app/settings/profile/actions";
import { PROFILE_AVATAR_MAX_BYTES, PROFILE_AVATAR_MIME_TYPES } from "@/lib/sttns/profileAvatar";
import { initialsFromDisplayName } from "@/lib/sttns/memberDisplay";
import { cn } from "@/lib/utils";

interface Props {
  avatarUrl: string | null;
  displayName: string;
}

export function ProfileAvatarUpload({ avatarUrl, displayName }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    setPreviewUrl(avatarUrl);
  }, [avatarUrl]);

  async function handleFileSelected(file: File | undefined) {
    if (!file || busy) return;

    setError(null);
    setSuccess(null);

    if (!(PROFILE_AVATAR_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Format accepté : JPG, PNG, WebP ou GIF.");
      return;
    }

    if (file.size > PROFILE_AVATAR_MAX_BYTES) {
      setError("La photo ne doit pas dépasser 5 Mo.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setBusy(true);

    const formData = new FormData();
    formData.append("avatar", file);

    const result = await uploadProfileAvatarAction(formData);
    setBusy(false);
    URL.revokeObjectURL(localPreview);

    if (!result.ok) {
      setPreviewUrl(avatarUrl);
      setError(result.error);
      return;
    }

    setPreviewUrl(result.avatarUrl);
    setSuccess("Photo de profil mise à jour.");
    router.refresh();
  }

  async function handleRemove() {
    if (busy || !previewUrl) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await removeProfileAvatarAction();
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    setPreviewUrl(null);
    setSuccess("Photo de profil supprimée.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative h-24 w-24 shrink-0">
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 border-emerald-200 bg-emerald-50 text-emerald-900",
            busy && "opacity-60"
          )}
        >
          {previewUrl ? (
            <Image
              src={previewUrl}
              alt={`Photo de ${displayName}`}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span className="text-xl font-bold uppercase tracking-tight">
              {initialsFromDisplayName(displayName)}
            </span>
          )}
        </div>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-full bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium text-zinc-900">Photo de profil</p>
        <p className="text-xs text-zinc-500">JPG, PNG, WebP ou GIF · max. 5 Mo</p>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={inputRef}
            type="file"
            accept={PROFILE_AVATAR_MIME_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              void handleFileSelected(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
          >
            <Camera className="h-3.5 w-3.5" />
            Choisir une photo
          </button>
          {previewUrl && (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleRemove()}
              className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Supprimer
            </button>
          )}
        </div>

        {!previewUrl && (
          <p className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <User className="h-3 w-3" />
            Aucune photo — vos initiales seront affichées.
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-700">{success}</p>}
      </div>
    </div>
  );
}
