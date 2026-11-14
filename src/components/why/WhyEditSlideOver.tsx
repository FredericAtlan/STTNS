"use client";

import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { PersonaForm } from "./PersonaForm";
import { PainPointForm } from "./PainPointForm";
import { JTBDForm } from "./JTBDForm";
import type { PainPointInput } from "@/lib/sttns/types";

export type PersonaEditData = {
  id?: string;
  name?: string;
  code?: string | null;
  description?: string;
  segment?: string;
  avatar_url?: string | null;
  doc_url?: string | null;
};

export type JtbdEditData = {
  id?: string;
  title?: string;
  parent_id?: string | null;
  solved_pain_points?: string[];
};

export type WhyEditTarget =
  | { kind: "persona"; data?: PersonaEditData }
  | {
      kind: "pp";
      data?: Partial<PainPointInput> & {
        id?: string;
        persona_id?: string;
        label?: string;
      };
    }
  | { kind: "jtbd"; data?: JtbdEditData };

interface Props {
  open: boolean;
  target: WhyEditTarget | null;
  projectId: string;
  projectSlug: string;
  personas: { id: string; title: string; code: string | null }[];
  painPoints: {
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    persona_id: string;
  }[];
  onClose: () => void;
  onSaved: () => void;
}

function slideTitle(target: WhyEditTarget | null): string {
  if (!target) return "Modifier";
  switch (target.kind) {
    case "persona":
      return target.data?.id ? "Modifier le Persona" : "Nouveau Persona";
    case "pp":
      return target.data?.id ? "Modifier le Pain Point" : "Nouveau Pain Point";
    case "jtbd":
      return target.data?.id ? "Modifier le JTBD" : "Nouveau JTBD";
  }
}

/**
 * Clé de remount : force React à recréer le formulaire lorsqu'on passe
 * d'une cible à une autre (kind + id) afin d'éviter l'état résiduel
 * (champs non vidés) au changement de cible dans le Slide-over.
 */
function targetKey(target: WhyEditTarget): string {
  const id = target.data?.id ?? "new";
  return `${target.kind}:${id}`;
}

export function WhyEditSlideOver({
  open,
  target,
  projectId,
  projectSlug,
  personas,
  painPoints,
  onClose,
  onSaved,
}: Props) {
  const handleSuccess = () => {
    onSaved();
    onClose();
  };

  return (
    <SttnsSlideOver
      open={open && !!target}
      onClose={onClose}
      title={slideTitle(target)}
      eyebrow="Matrice Besoins"
      size="lg"
    >
      {target?.kind === "persona" && (
        <PersonaForm
          key={targetKey(target)}
          projectId={projectId}
          projectSlug={projectSlug}
          initialData={target.data}
          showHeading={false}
          onSuccess={handleSuccess}
        />
      )}
      {target?.kind === "pp" && (
        <PainPointForm
          key={targetKey(target)}
          projectId={projectId}
          projectSlug={projectSlug}
          personas={personas}
          initialData={
            target.data
              ? {
                  id: target.data.id,
                  persona_id: target.data.persona_id,
                  label: target.data.label,
                  severity: target.data.severity,
                }
              : undefined
          }
          showHeading={false}
          onSuccess={handleSuccess}
        />
      )}
      {target?.kind === "jtbd" && (
        <JTBDForm
          key={targetKey(target)}
          projectId={projectId}
          projectSlug={projectSlug}
          personas={personas}
          painPoints={painPoints}
          initialData={
            target.data
              ? {
                  id: target.data.id,
                  title: target.data.title ?? "",
                  parent_id: target.data.parent_id ?? null,
                  solved_pain_points: target.data.solved_pain_points,
                }
              : undefined
          }
          showHeading={false}
          onSuccess={handleSuccess}
        />
      )}
    </SttnsSlideOver>
  );
}
