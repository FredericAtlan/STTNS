"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { reopenAssetForRevisionAction } from "@/app/projects/[slug]/team/actions";
import type { SttnsAssetType } from "@/types/sttns";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectSlug: string;
  assetType: SttnsAssetType;
  assetId: string;
  assetLabel: string;
  className?: string;
};

export function AssetReopenRevisionButton({
  projectId,
  projectSlug,
  assetType,
  assetId,
  assetLabel,
  className,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleReopen() {
    const confirmed = window.confirm(
      `Rouvrir « ${assetLabel} » en brouillon ?\n\nLa décision comité / CEO sera effacée. Vous pourrez modifier puis resoumettre.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const res = await reopenAssetForRevisionAction(
        projectId,
        projectSlug,
        assetType,
        assetId
      );
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={cn("flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        onClick={handleReopen}
        disabled={pending}
        className="sttns-btn-secondary text-sm"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <RotateCcw className="h-4 w-4" aria-hidden />
        )}
        Rouvrir en brouillon
      </button>
      {error && (
        <p className="text-xs text-rose-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
