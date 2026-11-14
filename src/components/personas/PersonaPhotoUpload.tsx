"use client";

/**
 * @deprecated Upload photo dual legacy/Spine — encore utilisé par Why Spine.
 * Ne plus exposer via routes `/personas` (Étape B).
 */
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Camera, Loader2, Trash2, UserCircle } from "lucide-react";
import {
  PERSONA_PHOTO_MAX_BYTES,
  PERSONA_PHOTO_MIME_TYPES,
} from "@/lib/sttns/personaPhoto";
import { cn } from "@/lib/utils";

interface Props {
  avatarUrl: string | null;
  displayName: string;
  readOnly?: boolean;
  disabledReason?: string;
  uploadAction: (formData: FormData) => Promise<
    { ok: true; avatarUrl: string } | { ok: false; error: string }
  >;
  removeAction: () => Promise<{ ok: true } | { ok: false; error: string }>;
}

function initialsFromName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "??";
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ""}${parts[1]![0] ?? ""}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

export function PersonaPhotoUpload({
  avatarUrl,
  displayName,
  readOnly = false,
  disabledReason,
  uploadAction,
  removeAction,
}: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const pendingUrlRef = useRef<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (avatarUrl) {
      setPreviewUrl(avatarUrl);
      pendingUrlRef.current = null;
      return;
    }
    if (!pendingUrlRef.current) {
      setPreviewUrl(null);
    }
  }, [avatarUrl]);

  const locked = readOnly || !!disabledReason || busy;

  async function handleFileSelected(file: File | undefined) {
    if (!file || locked) return;

    setError(null);
    setSuccess(null);

    if (!(PERSONA_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError("Format accepté : JPG, PNG, WebP ou GIF.");
      return;
    }

    if (file.size > PERSONA_PHOTO_MAX_BYTES) {
      setError("La photo ne doit pas dépasser 5 Mo.");
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl(localPreview);
    setBusy(true);

    const formData = new FormData();
    formData.append("photo", file);

    const result = await uploadAction(formData);
    setBusy(false);
    URL.revokeObjectURL(localPreview);

    if (!result.ok) {
      pendingUrlRef.current = null;
      setPreviewUrl(avatarUrl);
      setError(result.error);
      return;
    }

    pendingUrlRef.current = result.avatarUrl;
    setPreviewUrl(result.avatarUrl);
    setSuccess("Photo enregistrée.");
    router.refresh();
  }

  async function handleRemove() {
    if (locked || !previewUrl) return;

    setBusy(true);
    setError(null);
    setSuccess(null);

    const result = await removeAction();
    setBusy(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    pendingUrlRef.current = null;
    setPreviewUrl(null);
    setSuccess("Photo supprimée.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
      <div className="relative h-24 w-24 shrink-0">
        <div
          className={cn(
            "flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-2 border-emerald-200 bg-emerald-50 text-emerald-900",
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
              {initialsFromName(displayName)}
            </span>
          )}
        </div>
        {busy && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-white/70">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-700" />
          </div>
        )}
      </div>

      <div className="min-w-0 space-y-2">
        <p className="text-sm font-medium text-zinc-900">Photo du persona</p>
        <p className="text-xs text-zinc-500">JPG, PNG, WebP ou GIF · max. 5 Mo</p>

        {disabledReason ? (
          <p className="text-xs text-zinc-500">{disabledReason}</p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={inputRef}
              type="file"
              accept={PERSONA_PHOTO_MIME_TYPES.join(",")}
              className="hidden"
              disabled={locked}
              onChange={(e) => {
                void handleFileSelected(e.target.files?.[0]);
                e.target.value = "";
              }}
            />
            <button
              type="button"
              disabled={locked}
              onClick={() => inputRef.current?.click()}
              className="inline-flex items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
            >
              <Camera className="h-3.5 w-3.5" />
              Choisir une photo
            </button>
            {previewUrl && !readOnly && (
              <button
                type="button"
                disabled={locked}
                onClick={() => void handleRemove()}
                className="inline-flex items-center gap-1.5 rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Supprimer
              </button>
            )}
          </div>
        )}

        {!previewUrl && !disabledReason && (
          <p className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
            <UserCircle className="h-3 w-3" />
            Aucune photo — les initiales seront affichées.
          </p>
        )}

        {error && <p className="text-xs text-red-600">{error}</p>}
        {success && <p className="text-xs text-emerald-700">{success}</p>}
      </div>
    </div>
  );
}
