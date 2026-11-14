"use client";

import { useState } from "react";
import { Info } from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import { cn } from "@/lib/utils";

function HelpSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      <div className="text-sm leading-relaxed text-zinc-600 space-y-2">{children}</div>
    </section>
  );
}

export function SimplifiedManagementHelpBody() {
  return (
    <div className="space-y-6 pb-4">
      <HelpSection title="Les 4 combinaisons possibles">
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50 text-zinc-700">
              <tr>
                <th className="px-3 py-2 font-semibold">Mode</th>
                <th className="px-3 py-2 font-semibold">Stories</th>
                <th className="px-3 py-2 font-semibold">Epic ↔ Cycle</th>
                <th className="px-3 py-2 font-semibold">Profil équipe</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-zinc-600">
              <tr>
                <td className="px-3 py-2 font-medium text-zinc-800">STTNS complet (actuel)</td>
                <td className="px-3 py-2">Oui</td>
                <td className="px-3 py-2">Séparés</td>
                <td className="px-3 py-2">Squad structurée, gouvernance forte</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-zinc-800">Feature-only</td>
                <td className="px-3 py-2">Non</td>
                <td className="px-3 py-2">Séparés</td>
                <td className="px-3 py-2">PME agile légère, plusieurs epics/cycles</td>
              </tr>
              <tr>
                <td className="px-3 py-2 font-medium text-zinc-800">Epic = Cycle</td>
                <td className="px-3 py-2">Oui</td>
                <td className="px-3 py-2">Fusionnés</td>
                <td className="px-3 py-2">Mono-fil, rituels sprint classiques</td>
              </tr>
              <tr className="bg-[#4169E1]/5">
                <td className="px-3 py-2 font-medium text-[#27408b]">Minimal (les 2 options)</td>
                <td className="px-3 py-2">Non</td>
                <td className="px-3 py-2">Fusionnés</td>
                <td className="px-3 py-2">Très petite équipe, 1 chantier à la fois</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="rounded-lg border border-[#4169E1]/30 bg-[#4169E1]/5 px-3 py-2 text-xs text-[#27408b]">
          Le combo <strong>les deux activés</strong> donne un modèle très lisible :<br />
          <span className="font-mono text-[11px] mt-1 inline-block">
            Persona → Pain Point → JTBD → [Epic = Cycle] → Features (kanban)
          </span>
        </p>
      </HelpSection>

      <HelpSection title="Option 1 — Features en exécution (sans stories/tâches)">
        <p>
          <strong className="text-emerald-800">Verdict agile : oui, c&apos;est solide</strong> — et
          c&apos;est la simplification la plus utile.
        </p>
        <p>C&apos;est proche de ce que font beaucoup d&apos;équipes réelles sans le dire :</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong>Shape Up</strong> : on livre des scopes (≈ features), pas des user stories
            découpées
          </li>
          <li>
            <strong>Kanban feature-level</strong> : la carte qui bouge, c&apos;est l&apos;initiative
            livrable
          </li>
          <li>
            <strong>PME</strong> : « On fait la facturation mobile ce mois-ci », pas « En tant que…
            je veux… »
          </li>
        </ul>
        <p className="font-medium text-zinc-800">Ce que ça apporte</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Moins de friction cognitive (plus de Kanban stories, DoD story, tâches orphelines)
          </li>
          <li>La Feature reste le pont JTBD ↔ livraison</li>
          <li>
            Scoring Shape Up : Impact + Effort (jours) + Risque sur la Feature tant qu&apos;il
            n&apos;y a pas de Stories ; sinon roll-up depuis les Stories
          </li>
        </ul>
      </HelpSection>

      <HelpSection title="Option 2 — Epic = Cycle automatiquement">
        <p>
          <strong className="text-amber-800">Verdict agile : pertinent pour des cas ciblés</strong>,
          mais risqué en 1:1 strict.
        </p>
        <p>Epic et Cycle ne répondent pas à la même question :</p>
        <div className="overflow-x-auto rounded-lg border border-zinc-200">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-zinc-50">
              <tr>
                <th className="px-3 py-2" />
                <th className="px-3 py-2 font-semibold text-zinc-700">Epic</th>
                <th className="px-3 py-2 font-semibold text-zinc-700">Cycle</th>
              </tr>
            </thead>
            <tbody className="text-zinc-600">
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium">Nature</td>
                <td className="px-3 py-2">Thème / outcome stratégique</td>
                <td className="px-3 py-2">Boîte temporelle</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium">Durée typique</td>
                <td className="px-3 py-2">Plusieurs semaines à mois</td>
                <td className="px-3 py-2">1–3 semaines</td>
              </tr>
              <tr className="border-t border-zinc-100">
                <td className="px-3 py-2 font-medium">Cardinalité</td>
                <td className="px-3 py-2">1 epic → N features</td>
                <td className="px-3 py-2">1 cycle → N stories de sources variées</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="font-medium text-zinc-800">Quand Epic = Cycle fonctionne bien</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Équipe mono-fil : un seul chantier à la fois</li>
          <li>Roadmap linéaire : « Sprint 12 = Epic Paiements »</li>
          <li>Très petite squad (2–4 personnes), un produit, peu de parallélisme</li>
        </ul>
        <p className="font-medium text-zinc-800">Quand ça casse</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Un epic sur 2 cycles (cas le plus fréquent)</li>
          <li>2 epics dans le même cycle (bugfix + feature, dette + nouveau)</li>
          <li>Un cycle « ops / stabilisation » sans epic stratégique</li>
        </ul>
      </HelpSection>
    </div>
  );
}

export function SimplifiedManagementHelpSlideOver({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <SttnsSlideOver
      open={open}
      onClose={onClose}
      eyebrow="Gestion simplifiée"
      title="Implications des options"
      size="md"
    >
      <SimplifiedManagementHelpBody />
    </SttnsSlideOver>
  );
}

export function SimplifiedManagementHelpTrigger({
  className,
  iconClassName,
}: {
  className?: string;
  iconClassName?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <SttnsIconTip label="Comprendre les options de gestion simplifiée" placement="bottom">
        <button
          type="button"
          onClick={() => setOpen(true)}
          className={cn(
            "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-500 transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700",
            className
          )}
          aria-label="Aide — gestion simplifiée"
        >
          <Info className={cn("h-3.5 w-3.5", iconClassName)} />
        </button>
      </SttnsIconTip>
      <SimplifiedManagementHelpSlideOver open={open} onClose={() => setOpen(false)} />
    </>
  );
}
