"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Pencil } from "lucide-react";
import type { WhyEditTarget } from "./WhyEditSlideOver";
import { WhyHealthBadge } from "./WhyHealthBadge";
import { WhyHealthLegendSlideOver } from "./WhyHealthLegendSlideOver";
import { PersonaAvatar } from "@/components/personas/PersonaAvatar";
import { EmptyStateCoach } from "@/components/ui/EmptyStateCoach";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import {
  coveredPainPointIdsFromJtbds,
  countGhostJtbds,
  countOrphanPainPoints,
  isGhostJtbd,
  isOrphanPainPoint,
} from "@/lib/sttns/whyHealth";

type PersonaRow = {
  id: string;
  title: string;
  code: string | null;
  status: string;
  segment?: string;
  description?: string;
  avatar_url?: string | null;
  doc_url?: string | null;
};

type JTBRow = {
  id: string;
  title: string;
  parent_id: string | null;
  status: string;
  solved_pain_point_ids?: string[];
};

type PainPointRow = {
  id: string;
  title: string;
  severity: "low" | "medium" | "high" | "critical";
  persona_id: string;
};

interface Props {
  personas: PersonaRow[];
  jtbs: JTBRow[];
  painPoints?: PainPointRow[];
  onEdit: (target: WhyEditTarget) => void;
  onCreatePersona: () => void;
  onCreatePainPoint: (personaId: string) => void;
  onCreateJtbd: (personaId: string) => void;
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm text-muted-foreground hover:text-primary"
    >
      <Pencil className="h-5 w-5" />
    </button>
  );
}

function parseJtbd(title: string): {
  situation: string;
  motivation: string;
  outcome: string;
} {
  const quandMatch = title.match(/Quand\s+\[([^\]]+)\]/i);
  const veuxMatch = title.match(/je veux\s+\[([^\]]+)\]/i);
  const afinMatch = title.match(/afin de\s+\[([^\]]+)\]/i);
  if (quandMatch || veuxMatch || afinMatch) {
    return {
      situation: quandMatch?.[1]?.trim() ?? "",
      motivation: veuxMatch?.[1]?.trim() ?? "",
      outcome: afinMatch?.[1]?.trim() ?? "",
    };
  }
  const matches = title.match(/\[([^\]]+)\]/g) || [];
  return {
    situation: matches[0]?.replace(/[\[\]]/g, "") ?? title,
    motivation: matches[1]?.replace(/[\[\]]/g, "") ?? "",
    outcome: matches[2]?.replace(/[\[\]]/g, "") ?? "",
  };
}

export function ContextMatrix({
  personas,
  jtbs,
  painPoints = [],
  onEdit,
  onCreatePersona,
  onCreatePainPoint,
  onCreateJtbd,
}: Props) {
  const [legendOpen, setLegendOpen] = useState(false);
  const openLegend = () => setLegendOpen(true);

  const painPointById = useMemo(
    () => new Map(painPoints.map((pp) => [pp.id, pp])),
    [painPoints]
  );

  const coveredPainPointIds = useMemo(
    () => coveredPainPointIdsFromJtbds(jtbs),
    [jtbs]
  );

  const orphanPpCount = useMemo(
    () => countOrphanPainPoints(painPoints, jtbs),
    [painPoints, jtbs]
  );

  const ghostJtbdCount = useMemo(() => countGhostJtbds(jtbs), [jtbs]);

  const jtbdByPersona = useMemo(() => {
    const map = new Map<string, JTBRow[]>();
    jtbs.forEach((jtbd) => {
      const personaId = jtbd.parent_id;
      if (!personaId) return;
      const list = map.get(personaId) ?? [];
      list.push(jtbd);
      map.set(personaId, list);
    });
    return map;
  }, [jtbs]);

  const painByPersona = useMemo(() => {
    const map = new Map<string, PainPointRow[]>();
    painPoints.forEach((pp) => {
      const list = map.get(pp.persona_id) ?? [];
      list.push(pp);
      map.set(pp.persona_id, list);
    });
    return map;
  }, [painPoints]);

  if (personas.length === 0) {
    return (
      <EmptyStateCoach
        type="persona"
        title="Aucun Persona"
        explanation="La Matrice Besoins démarre par un Persona. Créez-en un pour rattacher Pain Points et JTBD."
        actionLabel="Créer un Persona"
        onAction={onCreatePersona}
      />
    );
  }

  return (
    <div className="space-y-4">
      {(orphanPpCount > 0 || ghostJtbdCount > 0) && (
        <div className="flex flex-wrap items-center justify-end gap-2 text-xs text-muted-foreground">
          {orphanPpCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <WhyHealthBadge variant="orphan" />
              <span className="tabular-nums">{orphanPpCount}</span>
            </span>
          )}
          {ghostJtbdCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <WhyHealthBadge variant="ghost" />
              <span className="tabular-nums">{ghostJtbdCount}</span>
            </span>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-xl border border-border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border bg-muted text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Persona</th>
                <th className="w-80 px-4 py-3 text-left">Pain Points</th>
                <th className="px-4 py-3 text-left">
                  Job-To-Be-Done (Situation → Motivation → Résultat)
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {personas.map((persona) => {
                const personaJtbs = jtbdByPersona.get(persona.id) ?? [];
                const personaPains = painByPersona.get(persona.id) ?? [];

                return (
                  <tr key={persona.id} className="hover:bg-muted/40">
                    <td className="px-4 py-4 align-top">
                      <div className="flex items-start gap-2">
                        <PersonaAvatar
                          name={persona.title}
                          code={persona.code}
                          avatarUrl={persona.avatar_url}
                          size="xs"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start gap-1">
                            <p className="font-medium text-foreground">{persona.title}</p>
                            <EditButton
                              label={`Modifier ${persona.title}`}
                              onClick={() =>
                                onEdit({
                                  kind: "persona",
                                  data: {
                                    id: persona.id,
                                    name: persona.title,
                                    code: persona.code,
                                    segment: persona.segment,
                                    description: persona.description,
                                    avatar_url: persona.avatar_url,
                                    doc_url: persona.doc_url,
                                  },
                                })
                              }
                            />
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <StatusBadge status={persona.status} />
                            {persona.segment && (
                              <span className="text-[11px] font-medium text-muted-foreground">
                                {persona.segment}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-4 align-top">
                      {personaPains.length === 0 ? (
                        <EmptyStateCoach
                          compact
                          type="pain_point"
                          title="Aucun Pain Point"
                          explanation="Ancrez une friction pour ce Persona — prérequis Shape Up."
                          actionLabel="Ajouter un PP"
                          onAction={() => onCreatePainPoint(persona.id)}
                        />
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {personaPains.map((pp) => {
                            const orphan = isOrphanPainPoint(
                              pp.id,
                              coveredPainPointIds
                            );
                            return (
                              <span
                                key={pp.id}
                                className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                                title={pp.title}
                              >
                                <SeverityBadge severity={pp.severity} />
                                <span className="min-w-0 truncate">
                                  {pp.title.length > 24
                                    ? pp.title.slice(0, 24) + "…"
                                    : pp.title}
                                </span>
                                {orphan && <WhyHealthBadge variant="orphan" />}
                                <EditButton
                                  label={`Modifier ${pp.title}`}
                                  onClick={() =>
                                    onEdit({
                                      kind: "pp",
                                      data: {
                                        id: pp.id,
                                        persona_id: pp.persona_id,
                                        label: pp.title,
                                        severity: pp.severity,
                                      },
                                    })
                                  }
                                />
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </td>

                    <td className="px-4 py-4 align-top">
                      {personaJtbs.length === 0 ? (
                        <EmptyStateCoach
                          compact
                          type="jtbd"
                          title="Aucun JTBD"
                          explanation="Formulez le job à résoudre — pont vers les Features (Tableau de brouillons)."
                          actionLabel="Ajouter un JTBD"
                          onAction={() => onCreateJtbd(persona.id)}
                        />
                      ) : (
                        <div className="space-y-2">
                          {personaJtbs.map((jtbd) => {
                            const parsed = parseJtbd(jtbd.title);
                            const solvedPps = (jtbd.solved_pain_point_ids ?? [])
                              .map((id) => painPointById.get(id))
                              .filter(Boolean) as PainPointRow[];
                            const ghost = isGhostJtbd(jtbd);
                            return (
                              <div
                                key={jtbd.id}
                                className="rounded-md border border-border bg-card p-3"
                              >
                                <div className="mb-2 flex items-start justify-between gap-2">
                                  <div className="flex flex-1 flex-wrap items-center gap-1">
                                    {ghost ? (
                                      <WhyHealthBadge variant="ghost" />
                                    ) : (
                                      solvedPps.map((pp) => (
                                        <span
                                          key={pp.id}
                                          className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-muted/50 px-1.5 py-0.5 text-[10px] text-foreground"
                                          title={`Résout : ${pp.title}`}
                                        >
                                          <SeverityBadge severity={pp.severity} />
                                          <span className="truncate">
                                            ↳{" "}
                                            {pp.title.length > 24
                                              ? pp.title.slice(0, 24) + "…"
                                              : pp.title}
                                          </span>
                                        </span>
                                      ))
                                    )}
                                  </div>
                                  <EditButton
                                    label="Modifier ce JTBD"
                                    onClick={() =>
                                      onEdit({
                                        kind: "jtbd",
                                        data: {
                                          id: jtbd.id,
                                          title: jtbd.title,
                                          parent_id: jtbd.parent_id ?? persona.id,
                                          solved_pain_points:
                                            jtbd.solved_pain_point_ids,
                                        },
                                      })
                                    }
                                  />
                                </div>
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5">
                                    Quand
                                  </span>
                                  <span>{parsed.situation}</span>
                                </div>
                                <div className="my-1 flex items-center gap-1">
                                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex items-start gap-2 text-xs font-medium text-foreground">
                                  <span className="shrink-0 rounded-md bg-primary/10 px-1.5 py-0.5 text-primary">
                                    Je veux
                                  </span>
                                  <span>{parsed.motivation}</span>
                                </div>
                                <div className="my-1 flex items-center gap-1">
                                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                                  <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5">
                                    Afin de
                                  </span>
                                  <span>{parsed.outcome}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-3 text-xs text-muted-foreground">
        <span className="sr-only">Légende sévérité et santé</span>
        <SeverityBadge severity="critical" />
        <SeverityBadge severity="high" />
        <SeverityBadge severity="medium" />
        <SeverityBadge severity="low" />
        <WhyHealthBadge variant="orphan" onClick={openLegend} />
        <WhyHealthBadge variant="ghost" onClick={openLegend} />
      </div>

      <WhyHealthLegendSlideOver
        open={legendOpen}
        onClose={() => setLegendOpen(false)}
      />
    </div>
  );
}
