"use client";

import { SttnsModal } from "@/components/ui/SttnsModal";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description: string;
  busy?: boolean;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmation d'archivage Why — remplace `window.confirm`. */
export function WhyArchiveConfirmModal({
  open,
  title,
  description,
  busy = false,
  confirmLabel = "Archiver",
  onConfirm,
  onCancel,
}: Props) {
  return (
    <SttnsModal
      open={open}
      onClose={onCancel}
      title={title}
      eyebrow="Archivage"
      size="md"
      preventClose={busy}
      footer={
        <>
          <button
            type="button"
            className="sttns-btn-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            Annuler
          </button>
          <button
            type="button"
            className="sttns-btn-destructive"
            onClick={onConfirm}
            disabled={busy}
          >
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
    </SttnsModal>
  );
}
