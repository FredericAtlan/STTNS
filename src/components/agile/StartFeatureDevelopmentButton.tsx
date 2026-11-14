"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { startFeatureDevelopmentAction } from "@/app/projects/[slug]/agile/actions";
import { Loader2, Play } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  initiativeId: string;
  label?: string;
  disabled?: boolean;
  disabledReason?: string;
  className?: string;
  fullWidth?: boolean;
}

export function StartFeatureDevelopmentButton({
  projectId,
  projectSlug,
  initiativeId,
  label = "Démarrer le dev",
  disabled = false,
  disabledReason,
  className,
  fullWidth = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (disabled || loading) return;
    setLoading(true);
    setError(null);
    const result = await startFeatureDevelopmentAction(projectId, projectSlug, initiativeId);
    if (!result.ok) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className={cn("space-y-1", fullWidth && "w-full")} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className={cn("sttns-btn-primary text-sm", fullWidth && "w-full", className)}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Play className="h-4 w-4" />
        )}
        {label}
      </button>
      {disabled && disabledReason && (
        <p className="text-xs text-amber-700">{disabledReason}</p>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
