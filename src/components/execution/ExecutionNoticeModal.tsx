"use client";

import { AlertTriangle } from "lucide-react";
import { SttnsModal } from "@/components/ui/SttnsModal";

export type ExecutionNoticeTone = "warning" | "error";

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  tone?: ExecutionNoticeTone;
  eyebrow?: string;
  ctaLabel?: string;
}

/**
 * Modal d'information exécution — remplace `window.alert` sur les Kanbans.
 * Utilisé pour WIP Limit, Impact 0 (Gaspillage), erreurs de gouvernance.
 */
export function ExecutionNoticeModal({
  open,
  onClose,
  title,
  message,
  tone = "warning",
  eyebrow,
  ctaLabel = "J'ai compris",
}: Props) {
  const iconTone =
    tone === "error" ? "text-destructive" : "text-warning";

  return (
    <SttnsModal
      open={open}
      onClose={onClose}
      title={title}
      eyebrow={eyebrow}
      size="md"
      footer={
        <button type="button" className="sttns-btn-primary" onClick={onClose}>
          {ctaLabel}
        </button>
      }
    >
      <div className="flex items-start gap-3">
        <AlertTriangle
          className={`mt-0.5 h-5 w-5 shrink-0 ${iconTone}`}
          aria-hidden
        />
        <p className="text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      </div>
    </SttnsModal>
  );
}
