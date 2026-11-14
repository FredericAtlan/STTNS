"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw, Loader2 } from "lucide-react";
import { reopenFeatureForRevisionAction } from "@/app/projects/[slug]/features/actions";
import { cn } from "@/lib/utils";

type Props = {
  projectId: string;
  projectSlug: string;
  initiativeId: string;
  featureName: string;
  className?: string;
};

export function FeatureReopenRevisionButton({
  projectId,
  projectSlug,
  initiativeId,
  featureName,
  className,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleReopen() {
    const confirmed = window.confirm(
      `Rouvrir « ${featureName} » en brouillon ?\n\nLa décision CEO sera effacée. Vous pourrez modifier la feature puis la soumettre à nouveau au comité.`
    );
    if (!confirmed) return;

    setError(null);
    startTransition(async () => {
      const res = await reopenFeatureForRevisionAction(projectId, projectSlug, initiativeId);
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
