"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { markFeatureDeployedAction } from "@/app/projects/[slug]/agile/actions";
import { Loader2, Rocket } from "lucide-react";

interface Props {
  projectId: string;
  projectSlug: string;
  initiativeId: string;
  label?: string;
  disabled?: boolean;
}

export function MarkFeatureDeployedButton({
  projectId,
  projectSlug,
  initiativeId,
  label = "Marquer déployé",
  disabled = false,
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
    const result = await markFeatureDeployedAction(projectId, projectSlug, initiativeId);
    if (!result.ok) setError(result.error);
    else router.refresh();
    setLoading(false);
  }

  return (
    <div className="mt-3 space-y-1" onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={handleClick}
        disabled={disabled || loading}
        className="sttns-btn-primary w-full text-sm"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Rocket className="h-4 w-4" />
        )}
        {label}
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
