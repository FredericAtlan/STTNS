"use client";

import { SttnsModal } from "@/components/ui/SttnsModal";

interface Props {
  open: boolean;
  criticalCount: number;
  warningCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export function PersonaDraftConfirmModal({
  open,
  criticalCount,
  warningCount,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <SttnsModal
      open={open}
      onClose={onCancel}
      title="Enregistrer un brouillon incomplet ?"
      size="md"
      footer={
        <>
          <button type="button" className="sttns-btn-secondary" onClick={onCancel}>
            Revenir au formulaire
          </button>
          <button type="button" className="sttns-btn-primary" onClick={onConfirm}>
            Enregistrer en brouillon
          </button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted-foreground">
        La matrice n&apos;est pas à 100&nbsp;% :{" "}
        {criticalCount > 0 && (
          <strong className="text-foreground">
            {criticalCount} friction{criticalCount > 1 ? "s" : ""} ignorée
            {criticalCount > 1 ? "s" : ""}
          </strong>
        )}
        {criticalCount > 0 && warningCount > 0 && " · "}
        {warningCount > 0 && (
          <strong className="text-foreground">
            {warningCount} job{warningCount > 1 ? "s" : ""} fantôme
            {warningCount > 1 ? "s" : ""}
          </strong>
        )}
        . Le persona sera enregistré en <strong className="text-foreground">DRAFT</strong>{" "}
        uniquement.
      </p>
    </SttnsModal>
  );
}
