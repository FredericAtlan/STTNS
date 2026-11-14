"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markEpicReadyAction } from "@/app/projects/[slug]/epics/actions";
import { EPIC_READY_TOOLTIP } from "@/lib/sttns/epicReady";
import { Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  epicId: string;
  canMarkReady: boolean;
  readOnly?: boolean;
}

export function MarkEpicReadyButton({
  projectId,
  projectSlug,
  epicId,
  canMarkReady,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disabled = readOnly || !canMarkReady || loading;

  async function handleMarkReady() {
    if (disabled) return;
    setLoading(true);
    setError(null);
    const result = await markEpicReadyAction(projectId, projectSlug, epicId);
    if (!result.ok) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <div className="relative inline-block">
        <button
          type="button"
          onClick={handleMarkReady}
          disabled={disabled}
          title={!canMarkReady ? EPIC_READY_TOOLTIP : undefined}
          className={cn(
            "sttns-btn-primary inline-flex items-center gap-2",
            disabled && "cursor-not-allowed opacity-60"
          )}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Rocket className="h-4 w-4" />
          )}
          Marquer comme Ready
        </button>
      </div>
      {!canMarkReady && !readOnly && (
        <p className="max-w-md text-xs text-amber-800">{EPIC_READY_TOOLTIP}</p>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
