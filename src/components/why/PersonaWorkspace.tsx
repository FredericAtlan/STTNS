"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { CsvWhyActions } from "@/components/csv/CsvWhyActions";
import { ContextMatrix } from "./ContextMatrix";
import { WhyEditSlideOver, type WhyEditTarget } from "./WhyEditSlideOver";

type CreateTab = "persona" | "pp" | "jtbd";

interface Props {
  projectId: string;
  projectSlug: string;
  personas: {
    id: string;
    title: string;
    code: string | null;
    status: string;
    segment?: string;
    description?: string;
    avatar_url?: string | null;
    doc_url?: string | null;
  }[];
  jtbs: {
    id: string;
    title: string;
    parent_id: string | null;
    status: string;
    solved_pain_point_ids?: string[];
  }[];
  painPoints?: {
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    persona_id: string;
  }[];
  /** Deep-link legacy `?tab=` → ouvre le Slide-over de création. */
  defaultTab?: "matrix" | CreateTab;
  preselectedPersonaId?: string;
  /** Deep-link Radar `?jtbd=<id>` → ouvre le Slide-over JTBD en édition. */
  preselectedJtbdEditId?: string;
}

function createTargetFromTab(
  tab: CreateTab,
  personaId?: string
): WhyEditTarget {
  switch (tab) {
    case "persona":
      return { kind: "persona", data: {} };
    case "pp":
      return {
        kind: "pp",
        data: personaId ? { persona_id: personaId } : {},
      };
    case "jtbd":
      return {
        kind: "jtbd",
        data: personaId
          ? { parent_id: personaId, title: "" }
          : { title: "", parent_id: null },
      };
  }
}

/**
 * Corps de page Why — pas de H1 ici (titre = ProjectPageHero uniquement).
 * Toolbar : compteurs + CTAs.
 */
export function PersonaWorkspace({
  projectId,
  projectSlug,
  personas,
  jtbs,
  painPoints = [],
  defaultTab = "matrix",
  preselectedPersonaId,
  preselectedJtbdEditId,
}: Props) {
  const router = useRouter();
  const [editTarget, setEditTarget] = useState<WhyEditTarget | null>(null);
  const openedFromUrlRef = useRef(false);

  useEffect(() => {
    if (openedFromUrlRef.current) return;

    if (preselectedJtbdEditId) {
      const jtbd = jtbs.find((j) => j.id === preselectedJtbdEditId);
      if (jtbd) {
        openedFromUrlRef.current = true;
        setEditTarget({
          kind: "jtbd",
          data: {
            id: jtbd.id,
            title: jtbd.title,
            parent_id: jtbd.parent_id,
            solved_pain_points: jtbd.solved_pain_point_ids ?? [],
          },
        });
        return;
      }
    }

    if (defaultTab === "matrix") {
      openedFromUrlRef.current = false;
      return;
    }
    openedFromUrlRef.current = true;
    setEditTarget(createTargetFromTab(defaultTab, preselectedPersonaId));
  }, [defaultTab, preselectedPersonaId, preselectedJtbdEditId, jtbs]);

  function openCreate(tab: CreateTab, personaId?: string) {
    if ((tab === "pp" || tab === "jtbd") && personas.length === 0) {
      setEditTarget({ kind: "persona", data: {} });
      return;
    }
    setEditTarget(createTargetFromTab(tab, personaId ?? preselectedPersonaId));
  }

  function closeSlide() {
    setEditTarget(null);
    if (defaultTab !== "matrix" || preselectedPersonaId || preselectedJtbdEditId) {
      router.replace(`/projects/${projectSlug}/why`, { scroll: false });
    }
  }

  const countsSummary =
    `${personas.length} persona${personas.length > 1 ? "s" : ""} · ` +
    `${painPoints.length} PP · ${jtbs.length} JTBD`;

  return (
    <div className="sttns-card !p-0 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-3">
        <p className="min-w-0 text-sm text-muted-foreground">
          <span className="text-foreground/80">Persona → Pain Point → JTBD</span>
          <span className="mx-2 text-border" aria-hidden>
            ·
          </span>
          <span className="tabular-nums">{countsSummary}</span>
        </p>
        <div className="flex flex-wrap items-center gap-1.5">
          <CsvWhyActions projectId={projectId} projectSlug={projectSlug} />
          <button
            type="button"
            onClick={() => openCreate("persona")}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            <SpineObjectIcon type="persona" size="md" />
            Persona
          </button>
          <button
            type="button"
            onClick={() => openCreate("pp")}
            disabled={personas.length === 0}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            <SpineObjectIcon type="pain_point" size="md" />
            Pain Point
          </button>
          <button
            type="button"
            onClick={() => openCreate("jtbd")}
            disabled={personas.length === 0}
            className="sttns-btn-secondary sttns-btn-sm"
          >
            <SpineObjectIcon type="jtbd" size="md" />
            JTBD
          </button>
        </div>
      </div>

      <div className="border-b border-warning/20 bg-warning/10 px-5 py-2.5 text-xs text-warning">
        <strong className="font-semibold">Constitution Spine :</strong> création
        en statut « todo » uniquement. Pain Points et JTBD rattachés à un Persona
        parent.
      </div>

      <div className="p-5">
        <ContextMatrix
          personas={personas}
          jtbs={jtbs}
          painPoints={painPoints}
          onEdit={setEditTarget}
          onCreatePersona={() => openCreate("persona")}
          onCreatePainPoint={(personaId) => openCreate("pp", personaId)}
          onCreateJtbd={(personaId) => openCreate("jtbd", personaId)}
        />
      </div>

      <WhyEditSlideOver
        open={editTarget !== null}
        target={editTarget}
        projectId={projectId}
        projectSlug={projectSlug}
        personas={personas}
        painPoints={painPoints}
        onClose={closeSlide}
        onSaved={() => router.refresh()}
      />
    </div>
  );
}
