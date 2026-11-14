"use client";

import { SttnsModal } from "@/components/ui/SttnsModal";

interface Props {
  open: boolean;
  gaps: string[];
  onConfirm: () => void;
  onCancel: () => void;
}

export function UserStoryDraftConfirmModal({ open, gaps, onConfirm, onCancel }: Props) {
  return (
    <SttnsModal
      open={open}
      onClose={onCancel}
      title="Enregistrer en brouillon ?"
      size="md"
      footer={
        <>
          <button type="button" className="sttns-btn-secondary" onClick={onCancel}>
            Continuer l&apos;édition
          </button>
          <button type="button" className="sttns-btn-primary" onClick={onConfirm}>
            Enregistrer quand même
          </button>
        </>
      }
    >
      <p className="text-sm text-muted-foreground">
        La Definition of Ready n&apos;est pas complète. La story restera non alignée tant que :
      </p>
      <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warning">
        {gaps.map((gap) => (
          <li key={gap}>{gap}</li>
        ))}
      </ul>
    </SttnsModal>
  );
}
