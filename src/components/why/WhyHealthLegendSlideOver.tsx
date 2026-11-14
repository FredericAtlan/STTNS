"use client";

import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { WhyHealthBadge } from "@/components/why/WhyHealthBadge";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * Légende santé Why — Orphelin (PP) vs Fantôme (JTBD).
 * Ouvert depuis les badges en bas à droite de la matrice.
 */
export function WhyHealthLegendSlideOver({ open, onClose }: Props) {
  return (
    <SttnsSlideOver
      open={open}
      onClose={onClose}
      eyebrow="Légende santé"
      title="Orphelin & Fantôme"
      size="md"
      ariaLabelClose="Fermer la légende"
    >
      <div className="space-y-6 text-sm text-foreground">
        <p className="text-muted-foreground">
          Ces badges signalent une rupture du lien{" "}
          <strong className="font-medium text-foreground">solves</strong> entre
          un Pain Point et un JTBD — ancrage Shape Up de la Matrice Besoins.
        </p>

        <section className="space-y-3 rounded-md border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SpineObjectIcon type="pain_point" size="md" />
            <WhyHealthBadge variant="orphan" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Orphelin</h3>
          <p className="leading-relaxed text-muted-foreground">
            Un <strong className="text-foreground">Pain Point</strong> sans
            aucun JTBD qui le résout. La friction est nommée, mais pas encore
            traduite en job à accomplir.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Action typique : créer ou éditer un JTBD et cocher ce Pain Point
            dans les liens « résout ».
          </p>
        </section>

        <section className="space-y-3 rounded-md border border-border bg-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <SpineObjectIcon type="jtbd" size="md" />
            <WhyHealthBadge variant="ghost" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Fantôme</h3>
          <p className="leading-relaxed text-muted-foreground">
            Un <strong className="text-foreground">JTBD</strong> sans Pain Point
            lié. L’objectif est formulé, mais sans ancrage friction — risque de
            solution sans problème clair.
          </p>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Action typique : éditer le JTBD et rattacher au moins un Pain Point
            du même Persona.
          </p>
        </section>

        <p className="text-xs leading-relaxed text-muted-foreground">
          Les pastilles de sévérité (Critique → Faible) décrivent l’intensité du
          Pain Point ; elles sont indépendantes d’Orphelin / Fantôme.
        </p>
      </div>
    </SttnsSlideOver>
  );
}
