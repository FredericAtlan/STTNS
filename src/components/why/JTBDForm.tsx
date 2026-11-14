"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save, Trash2, AlertCircle } from "lucide-react";
import { saveJTBDAction, archiveJTBDAction } from "@/app/projects/[slug]/why/actions";
import { WorkItemHistory } from "@/components/spine/WorkItemHistory";
import { SeverityBadge } from "@/components/ui/SeverityBadge";
import { WhyArchiveConfirmModal } from "@/components/why/WhyArchiveConfirmModal";

interface Props {
  projectId: string;
  projectSlug: string;
  personas: { id: string; title: string; code: string | null }[];
  painPoints?: {
    id: string;
    title: string;
    severity: "low" | "medium" | "high" | "critical";
    persona_id: string;
  }[];
  initialData?: {
    id?: string;
    title: string;
    parent_id: string | null;
    solved_pain_points?: string[];
  };
  onSuccess?: () => void;
  /** Masquer le titre si le Slide-over parent l'affiche déjà. */
  showHeading?: boolean;
}

export function JTBDForm({
  projectId,
  projectSlug,
  personas,
  painPoints = [],
  initialData,
  onSuccess,
  showHeading = true,
}: Props) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syntaxError, setSyntaxError] = useState<string | null>(null);

  const initialParsed = initialData ? parseJtbdString(initialData.title) : null;

  const [personaId, setPersonaId] = useState<string>(initialData?.parent_id ?? "");
  const [situation, setSituation] = useState(initialParsed?.situation ?? "");
  const [motivation, setMotivation] = useState(initialParsed?.motivation ?? "");
  const [outcome, setOutcome] = useState(initialParsed?.outcome ?? "");
  const [solvedPainPoints, setSolvedPainPoints] = useState<string[]>(
    initialData?.solved_pain_points ?? []
  );

  const personaPainPoints = useMemo(
    () => painPoints.filter((pp) => pp.persona_id === personaId),
    [painPoints, personaId]
  );

  const isEdit = !!initialData?.id;
  const isBusy = isSubmitting || isArchiving;

  function togglePainPoint(ppId: string) {
    setSolvedPainPoints((prev) =>
      prev.includes(ppId) ? prev.filter((id) => id !== ppId) : [...prev, ppId]
    );
  }

  function parseJtbdString(str: string): { situation: string; motivation: string; outcome: string } | null {
    const matches = str.match(/\[([^\]]+)\]/g);
    if (!matches || matches.length < 3) return null;
    return {
      situation: matches[0].replace(/[\[\]]/g, ""),
      motivation: matches[1].replace(/[\[\]]/g, ""),
      outcome: matches[2].replace(/[\[\]]/g, ""),
    };
  }

  function buildJtbdStatement(): string {
    return `Quand [${situation}], je veux [${motivation}] afin de [${outcome}]`;
  }

  function validateSyntax(): boolean {
    const statement = buildJtbdStatement();
    const regex = /^Quand\s+\[.+\],\s+je\s+veux\s+\[.+\]\s+afin\s+de\s+\[.+\]$/i;
    if (!regex.test(statement)) {
      setSyntaxError(
        'Syntaxe invalide. Format requis : "Quand [Situation], je veux [Motivation] afin de [Résultat]"'
      );
      return false;
    }
    setSyntaxError(null);
    return true;
  }

  async function handleSubmit() {
    if (isBusy) return;
    if (!validateSyntax()) return;
    if (!personaId) {
      setError("Un JTBD doit obligatoirement être rattaché à un Persona (Constitution Spine).");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const result = await saveJTBDAction(projectId, projectSlug, {
      id: initialData?.id,
      persona_id: personaId,
      job_statement: buildJtbdStatement(),
      situation,
      motivation,
      outcome,
      solved_pain_points: solvedPainPoints,
    });

    if (!result.ok) {
      setIsSubmitting(false);
      setError(result.error || "Erreur lors de la sauvegarde");
      return;
    }

    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsSubmitting(false);
    router.push(`/projects/${projectSlug}/why`);
    router.refresh();
  }

  async function handleArchive() {
    if (!initialData?.id || isBusy) return;

    setIsArchiving(true);
    setError(null);

    const result = await archiveJTBDAction(initialData.id, projectId, projectSlug);

    if (!result.ok) {
      setIsArchiving(false);
      setArchiveOpen(false);
      setError(result.error || "Erreur lors de l'archivage");
      return;
    }

    setArchiveOpen(false);
    if (onSuccess) {
      onSuccess();
      router.refresh();
      return;
    }

    setIsArchiving(false);
    router.push(`/projects/${projectSlug}/why`);
    router.refresh();
  }

  const preview = situation || motivation || outcome ? buildJtbdStatement() : "";

  return (
    <div className="space-y-4">
      {showHeading && (
        <h2 className="text-lg font-semibold text-foreground">
          {isEdit ? "Modifier le JTBD" : "Nouveau Job-To-Be-Done"}
        </h2>
      )}

      {error && (
        <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="sttns-label" htmlFor="jtbd-persona">
            Persona parent *
          </label>
          <select
            id="jtbd-persona"
            value={personaId}
            onChange={(e) => {
              setPersonaId(e.target.value);
              setSolvedPainPoints([]);
            }}
            disabled={isBusy}
            className="sttns-input"
            required
          >
            <option value="">Sélectionnez un persona…</option>
            {personas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code ? `[${p.code}] ` : ""}
                {p.title}
              </option>
            ))}
          </select>
          {!personaId && (
            <p className="mt-1 flex items-center gap-1 text-xs text-warning">
              <AlertCircle className="h-3 w-3 shrink-0" />
              Obligatoire selon la Constitution Spine (héritage forcé)
            </p>
          )}
        </div>

        {personaId && (
          <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
            <p className="sttns-label !mb-0">Pain Points adressés par ce JTBD</p>
            {personaPainPoints.length === 0 ? (
              <p className="text-xs text-muted-foreground italic">
                Aucun Pain Point pour ce persona. Créez-en un depuis la matrice.
              </p>
            ) : (
              <ul className="space-y-2">
                {personaPainPoints.map((pp) => (
                  <li key={pp.id}>
                    <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
                      <input
                        type="checkbox"
                        checked={solvedPainPoints.includes(pp.id)}
                        onChange={() => togglePainPoint(pp.id)}
                        className="mt-0.5 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
                        <span className="min-w-0">{pp.title}</span>
                        <SeverityBadge severity={pp.severity} />
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Syntaxe stricte : Quand [Situation], je veux [Motivation] afin de [Résultat]
          </p>

          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="jtbd-situation">
              Situation (Quand)
            </label>
            <input
              id="jtbd-situation"
              type="text"
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              disabled={isBusy}
              className="sttns-input"
              placeholder="ex: je reçois une facture fournisseur"
            />
          </div>

          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="jtbd-motivation">
              Motivation (Je veux)
            </label>
            <input
              id="jtbd-motivation"
              type="text"
              value={motivation}
              onChange={(e) => setMotivation(e.target.value)}
              disabled={isBusy}
              className="sttns-input"
              placeholder="ex: l'enregistrer sans erreur"
            />
          </div>

          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="jtbd-outcome">
              Résultat (Afin de)
            </label>
            <input
              id="jtbd-outcome"
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              disabled={isBusy}
              className="sttns-input"
              placeholder="ex: payer à temps et préserver la trésorerie"
            />
          </div>
        </div>

        {preview && (
          <div className="rounded-md border border-success/20 bg-success/10 px-3 py-2">
            <p className="mb-1 text-xs font-medium text-success">Aperçu du Job Statement</p>
            <p className="text-sm font-medium text-foreground">
              Quand [{situation}], je veux [{motivation}] afin de [{outcome}]
            </p>
          </div>
        )}

        {syntaxError && (
          <div className="rounded-md border border-destructive/20 bg-destructive/10 px-3 py-2 text-xs text-destructive">
            {syntaxError}
          </div>
        )}

        <div className="rounded-md border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
          <strong className="font-semibold">Constitution Spine :</strong> héritage forcé vers
          Persona, statut auto « todo », compatible tree_path pour Features.
        </div>
      </div>

      {isEdit && initialData?.id && (
        <WorkItemHistory workItemId={initialData.id} />
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            isBusy ||
            !personaId ||
            !situation.trim() ||
            !motivation.trim() ||
            !outcome.trim()
          }
          className="sttns-btn-primary sttns-btn-md"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          <Save className="h-4 w-4" />
          {isEdit ? "Mettre à jour" : "Créer le JTBD"}
        </button>

        {isEdit && (
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            disabled={isBusy}
            className="sttns-btn-destructive sttns-btn-md"
          >
            <Trash2 className="h-4 w-4" />
            Archiver
          </button>
        )}
      </div>

      <WhyArchiveConfirmModal
        open={archiveOpen}
        title="Archiver ce JTBD ?"
        description="Ce Job-To-Be-Done sera soft-supprimé (archived_at). Les Features qui y sont liées pourront apparaître dans le Radar."
        busy={isArchiving}
        confirmLabel="Archiver le JTBD"
        onCancel={() => {
          if (!isArchiving) setArchiveOpen(false);
        }}
        onConfirm={() => void handleArchive()}
      />
    </div>
  );
}
