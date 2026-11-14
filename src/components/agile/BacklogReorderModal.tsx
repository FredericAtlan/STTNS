"use client";

import { useState } from "react";
import { PLACEMENT_REASON_LABELS, PLACEMENT_REASON_OPTIONS } from "@/lib/sttns/placementReason";
import type { SttnsPlacementReasonType } from "@/types/sttns";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SttnsModal } from "@/components/ui/SttnsModal";

interface Props {
  open: boolean;
  featureLabel: string;
  requiresCeoApproval?: boolean;
  loading?: boolean;
  error?: string | null;
  onClose: () => void;
  onConfirm: (reasonType: SttnsPlacementReasonType, comment: string) => void;
}

export function BacklogReorderModal({
  open,
  featureLabel,
  requiresCeoApproval = true,
  loading = false,
  error = null,
  onClose,
  onConfirm,
}: Props) {
  const [reasonType, setReasonType] = useState<SttnsPlacementReasonType>("strategic_priority");
  const [comment, setComment] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onConfirm(reasonType, comment);
  }

  return (
    <SttnsModal
      open={open}
      onClose={onClose}
      title={featureLabel}
      eyebrow="Réordonnancement backlog"
      size="md"
      preventClose={loading}
      footer={
        <>
          <button
            type="button"
            className="sttns-btn-secondary"
            disabled={loading}
            onClick={onClose}
          >
            Annuler
          </button>
          <button
            type="submit"
            form="backlog-reorder-form"
            className={cn("sttns-btn-primary", loading && "opacity-70")}
            disabled={loading || !comment.trim()}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enregistrement…
              </>
            ) : requiresCeoApproval ? (
              "Soumettre au CEO"
            ) : (
              "Valider le placement"
            )}
          </button>
        </>
      }
    >
      <form id="backlog-reorder-form" onSubmit={handleSubmit} className="space-y-4">
        <p className="text-sm text-muted-foreground">
          {requiresCeoApproval
            ? "Votre proposition sera soumise au CEO pour validation avant d'être actée."
            : "Indiquez la nature du placement et un bref commentaire justificatif."}
        </p>

        <div>
          <label htmlFor="placement-reason" className="sttns-label">
            Nature du placement *
          </label>
          <select
            id="placement-reason"
            className="sttns-input mt-1"
            value={reasonType}
            disabled={loading}
            onChange={(e) => setReasonType(e.target.value as SttnsPlacementReasonType)}
          >
            {PLACEMENT_REASON_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {PLACEMENT_REASON_LABELS[option]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="placement-comment" className="sttns-label">
            Commentaire *
          </label>
          <textarea
            id="placement-comment"
            className="sttns-input mt-1 min-h-[88px] resize-y"
            placeholder="Ex. Bloqué par l'API compta — on passe F06 avant F04."
            value={comment}
            disabled={loading}
            onChange={(e) => setComment(e.target.value)}
            required
          />
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </form>
    </SttnsModal>
  );
}
