"use client";

/**
 * @deprecated Éditeur vocabulaire tiers/jobs legacy UI — Étape B (redirect `/why`).
 * Tables `*_defs` conservées pour le pont segment Why.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { GripVertical, Loader2, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import {
  resetPersonaVocabularyAction,
  savePersonaVocabularyAction,
} from "@/app/projects/[slug]/personas/vocabulary/actions";
import type { PersonaJobTypeDefInput, PersonaTierDefInput } from "@/lib/sttns/types";
import { SttnsPanel } from "@/components/layout/sttns-ui";
import {
  DEFAULT_PERSONA_JOB_TYPE_DEFS,
  DEFAULT_PERSONA_TIER_DEFS,
  normalizePersonaVocabularyCode,
} from "@/lib/personas/personaVocabulary";
import type { SttnsPersonaJobTypeDef, SttnsPersonaTierDef } from "@/types/sttns";

type TierRow = PersonaTierDefInput & { key: string };
type JobTypeRow = PersonaJobTypeDefInput & { key: string };

function toTierRows(rows: SttnsPersonaTierDef[]): TierRow[] {
  return rows
    .filter((row) => !row.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      key: row.id,
      id: row.id,
      code: row.code,
      title: row.title,
      description: row.description,
      sort_order: row.sort_order,
    }));
}

function toJobTypeRows(rows: SttnsPersonaJobTypeDef[]): JobTypeRow[] {
  const active = rows
    .filter((row) => !row.archived_at)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((row) => ({
      key: row.id,
      id: row.id,
      code: row.code,
      title: row.title,
      hint: row.hint,
      sort_order: row.sort_order,
    }));

  if (active.length > 0) return active;

  return DEFAULT_PERSONA_JOB_TYPE_DEFS.map((row, index) => ({
    key: `default-job-${row.code}`,
    code: row.code,
    title: row.title,
    hint: row.hint,
    sort_order: row.sort_order ?? index + 1,
  }));
}

function toTierRowsWithFallback(rows: SttnsPersonaTierDef[]): TierRow[] {
  const active = toTierRows(rows);
  if (active.length > 0) return active;

  return DEFAULT_PERSONA_TIER_DEFS.map((row, index) => ({
    key: `default-tier-${row.code}`,
    code: row.code,
    title: row.title,
    description: row.description,
    sort_order: row.sort_order ?? index + 1,
  }));
}

function suggestTierCode(existing: TierRow[]): string {
  const nums = existing
    .map((row) => /^T(\d+)$/.exec(row.code.trim().toUpperCase())?.[1])
    .filter(Boolean)
    .map(Number);
  const next = nums.length ? Math.max(...nums) + 1 : existing.length + 1;
  return `T${next}`;
}

interface Props {
  projectId: string;
  projectSlug: string;
  initialTiers: SttnsPersonaTierDef[];
  initialJobTypes: SttnsPersonaJobTypeDef[];
}

export function PersonaVocabularyEditor({
  projectId,
  projectSlug,
  initialTiers,
  initialJobTypes,
}: Props) {
  const router = useRouter();
  const [tiers, setTiers] = useState<TierRow[]>(() => toTierRowsWithFallback(initialTiers));
  const [jobTypes, setJobTypes] = useState<JobTypeRow[]>(() => toJobTypeRows(initialJobTypes));
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTiers(toTierRowsWithFallback(initialTiers));
    setJobTypes(toJobTypeRows(initialJobTypes));
  }, [initialTiers, initialJobTypes]);

  const tierPreview = useMemo(
    () => tiers.map((row) => `${row.code} — ${row.title}`).join(" · "),
    [tiers]
  );

  function updateTier(index: number, patch: Partial<TierRow>) {
    setTiers((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function updateJobType(index: number, patch: Partial<JobTypeRow>) {
    setJobTypes((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function addTier() {
    const code = suggestTierCode(tiers);
    setTiers((prev) => [
      ...prev,
      {
        key: `new-tier-${Date.now()}`,
        code,
        title: "",
        description: null,
        sort_order: prev.length + 1,
      },
    ]);
  }

  function addJobType() {
    setJobTypes((prev) => [
      ...prev,
      {
        key: `new-job-${Date.now()}`,
        code: "",
        title: "",
        hint: null,
        sort_order: prev.length + 1,
      },
    ]);
  }

  function removeTier(index: number) {
    if (tiers.length <= 1) return;
    setTiers((prev) =>
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
    );
  }

  function removeJobType(index: number) {
    if (jobTypes.length <= 1) return;
    setJobTypes((prev) =>
      prev.filter((_, i) => i !== index).map((row, i) => ({ ...row, sort_order: i + 1 }))
    );
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    const res = await savePersonaVocabularyAction(projectId, projectSlug, {
      tiers: tiers.map((row, index) => ({
        id: row.id,
        code: row.code.trim().toUpperCase(),
        title: row.title.trim(),
        description: row.description?.trim() || null,
        sort_order: index + 1,
      })),
      jobTypes: jobTypes.map((row, index) => ({
        id: row.id,
        code: normalizePersonaVocabularyCode(row.code || row.title),
        title: row.title.trim(),
        hint: row.hint?.trim() || null,
        sort_order: index + 1,
      })),
    });

    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setMessage("Référentiel enregistré — les fiches persona utilisent ces valeurs.");
    router.refresh();
  }

  async function handleReset() {
    if (!window.confirm("Réinitialiser aux segments T1–T4 et types fonctionnel / social / émotionnel ?")) {
      return;
    }
    setResetting(true);
    setError(null);
    setMessage(null);
    const res = await resetPersonaVocabularyAction(projectId, projectSlug);
    setResetting(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={handleSave} className="space-y-8">
      <div className="rounded-xl border border-emerald-200/70 bg-emerald-50/50 px-4 py-3 text-sm text-zinc-700">
        <p>
          Ce référentiel est <strong>propre au projet</strong> et évolutif : ajoutez un segment T5,
          un type « réglementaire », etc. Les personas existants conservent leur code ; les
          libellés affichés suivent cette configuration.
        </p>
        {tierPreview && (
          <p className="mt-2 text-xs text-zinc-500">
            Aperçu segments : {tierPreview}
          </p>
        )}
      </div>

      <SttnsPanel title="Segments persona">
        <p className="mb-4 text-sm text-sttns-muted">
          Segmentation stratégique (décideur, opérationnel, partenaire…). Le code (ex. T1) est
          stocké sur chaque persona.
        </p>
        <ul className="space-y-3">
          {tiers.map((row, index) => (
            <li
              key={row.key}
              className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-[auto_96px_1fr_1fr_auto]"
            >
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-zinc-300" aria-hidden />
              <div>
                <label className="sttns-label">Code</label>
                <input
                  className="sttns-input font-mono text-sm uppercase"
                  value={row.code}
                  onChange={(e) => updateTier(index, { code: e.target.value.toUpperCase() })}
                  placeholder="T1"
                  required
                />
              </div>
              <div>
                <label className="sttns-label">Libellé</label>
                <input
                  className="sttns-input"
                  value={row.title}
                  onChange={(e) => updateTier(index, { title: e.target.value })}
                  placeholder="Décideur / CEO"
                  required
                />
              </div>
              <div>
                <label className="sttns-label">Description</label>
                <input
                  className="sttns-input"
                  value={row.description ?? ""}
                  onChange={(e) => updateTier(index, { description: e.target.value || null })}
                  placeholder="Rôle dans la chaîne de valeur…"
                />
              </div>
              <button
                type="button"
                onClick={() => removeTier(index)}
                disabled={tiers.length <= 1}
                className="self-end rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label="Retirer le segment"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addTier} className="sttns-btn-secondary mt-4 text-sm">
          <Plus className="h-4 w-4" />
          Ajouter un segment
        </button>
      </SttnsPanel>

      <SttnsPanel title="Types de jobs (JTBD)">
        <p className="mb-4 text-sm text-sttns-muted">
          Sections du formulaire persona — chaque type peut regrouper plusieurs jobs. Le code
          technique (ex. functional) est généré à l&apos;enregistrement si vide.
        </p>
        <ul className="space-y-3">
          {jobTypes.map((row, index) => (
            <li
              key={row.key}
              className="grid gap-3 rounded-xl border border-zinc-200 bg-zinc-50/60 p-4 sm:grid-cols-[auto_120px_1fr_1fr_auto]"
            >
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-zinc-300" aria-hidden />
              <div>
                <label className="sttns-label">Code</label>
                <input
                  className="sttns-input font-mono text-xs"
                  value={row.code}
                  onChange={(e) => updateJobType(index, { code: e.target.value })}
                  placeholder="functional"
                />
              </div>
              <div>
                <label className="sttns-label">Titre section</label>
                <input
                  className="sttns-input"
                  value={row.title}
                  onChange={(e) => updateJobType(index, { title: e.target.value })}
                  placeholder="Jobs fonctionnels"
                  required
                />
              </div>
              <div>
                <label className="sttns-label">Indication</label>
                <input
                  className="sttns-input"
                  value={row.hint ?? ""}
                  onChange={(e) => updateJobType(index, { hint: e.target.value || null })}
                  placeholder="Ce que la persona doit accomplir…"
                />
              </div>
              <button
                type="button"
                onClick={() => removeJobType(index)}
                disabled={jobTypes.length <= 1}
                className="self-end rounded-lg p-2 text-red-600 hover:bg-red-50 disabled:opacity-30"
                aria-label="Retirer le type"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
        <button type="button" onClick={addJobType} className="sttns-btn-secondary mt-4 text-sm">
          <Plus className="h-4 w-4" />
          Ajouter un type de job
        </button>
      </SttnsPanel>

      <div className="flex flex-wrap items-center gap-3 border-t border-zinc-200 pt-4">
        <button type="submit" disabled={loading} className="sttns-btn-primary">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Enregistrer le référentiel
        </button>
        <button
          type="button"
          disabled={resetting}
          onClick={handleReset}
          className="sttns-btn-secondary text-sm"
        >
          {resetting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RotateCcw className="h-4 w-4" />
          )}
          Réinitialiser STTNS par défaut
        </button>
        {message && <p className="text-sm font-medium text-emerald-700">{message}</p>}
        {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      </div>
    </form>
  );
}
