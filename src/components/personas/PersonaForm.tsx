"use client";

/**
 * @deprecated Formulaire catalogue `sttns_personas` DRAFT/READY — Étape B (UI → `/why`).
 * Préférer `components/why/PersonaForm` (Spine). Ne pas supprimer tant que peer-review / CSV dépendent du monde legacy.
 */
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Copy, Loader2, Plus, Save, Trash2, X } from "lucide-react";
import {
  deletePersonaAction,
  duplicatePersonaAction,
  removeLegacyPersonaPhotoAction,
  savePersonaAction,
  uploadLegacyPersonaPhotoAction,
} from "@/app/projects/[slug]/personas/actions";
import { PersonaMatrixHealthPanel } from "@/components/personas/form/PersonaMatrixHealthPanel";
import { PersonaDraftConfirmModal } from "@/components/personas/form/PersonaDraftConfirmModal";
import { PersonaPainPointMultiSelect } from "@/components/personas/form/PersonaPainPointMultiSelect";
import { PersonaPhotoUpload } from "@/components/personas/PersonaPhotoUpload";
import { PersonaSummaryBlock } from "@/components/personas/PersonaSummaryBlock";
import { SttnsPanel } from "@/components/layout/sttns-ui";
import {
  computePersonaCoverage,
  renumberPainPoints,
  stripPainPointFromJobs,
} from "@/lib/personas/personaCoverage";
import {
  buildPersonaFormSchema,
  personaFormDefaultValues,
  type PersonaFormValues,
} from "@/lib/personas/personaFormSchema";
import {
  formValuesToSavePayload,
  personaToFormValues,
} from "@/lib/personas/personaFormMappers";
import { createEmptyJob, createEmptyPainPoint } from "@/lib/personas/personaMatrix.types";
import type { PersonaVocabulary } from "@/lib/personas/personaVocabulary";
import { jobTypePlaceholder } from "@/lib/personas/personaVocabulary";
import type { SttnsPersona } from "@/types/sttns";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  vocabulary: PersonaVocabulary;
  initial?: SttnsPersona;
  suggestedPersonaCode?: string;
  readOnly?: boolean;
}

export function PersonaForm({
  projectId,
  projectSlug,
  vocabulary,
  initial,
  suggestedPersonaCode,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDraftOpen, setConfirmDraftOpen] = useState(false);
  const [pendingDraftValues, setPendingDraftValues] = useState<PersonaFormValues | null>(null);

  const schema = useMemo(() => buildPersonaFormSchema(vocabulary), [vocabulary]);
  const defaultValues = useMemo(
    () =>
      personaToFormValues(initial, vocabulary, suggestedPersonaCode) ??
      personaFormDefaultValues(vocabulary),
    [initial, vocabulary, suggestedPersonaCode]
  );

  const form = useForm<PersonaFormValues>({
    resolver: zodResolver(schema),
    defaultValues,
    mode: "onChange",
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    formState: { errors },
  } = form;

  const painFields = useFieldArray({ control, name: "painPoints" });
  const jobFields = useFieldArray({ control, name: "jobs" });

  const watchedPains = useWatch({ control, name: "painPoints" }) ?? [];
  const watchedJobs = useWatch({ control, name: "jobs" }) ?? [];
  const watchedSummary = useWatch({ control, name: "summary" }) ?? "";
  const watchedPersonaCode = useWatch({ control, name: "personaCode" }) ?? "";
  const watchedName = useWatch({ control, name: "name" }) ?? "";

  const isNewPersona = !initial?.id;

  const coverage = useMemo(
    () => computePersonaCoverage(watchedPains, watchedJobs),
    [watchedPains, watchedJobs]
  );

  async function persist(values: PersonaFormValues) {
    setLoading(true);
    setError(null);
    const payload = formValuesToSavePayload(values);
    const result = await savePersonaAction(projectId, projectSlug, {
      id: initial?.id,
      ...payload,
    });
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/projects/${projectSlug}/personas/${result.id}`);
    router.refresh();
  }

  function submitDraft(values: PersonaFormValues) {
    const draftValues = { ...values, status: "DRAFT" as const };
    if (coverage.criticals.length > 0 || coverage.warnings.length > 0) {
      setPendingDraftValues(draftValues);
      setConfirmDraftOpen(true);
      return;
    }
    void persist(draftValues);
  }

  function submitReady(values: PersonaFormValues) {
    if (!coverage.readyAllowed) return;
    void persist({ ...values, status: "READY" });
  }

  function addPainPoint() {
    painFields.append(createEmptyPainPoint(getValues("painPoints")));
  }

  function removePainPoint(index: number) {
    if (painFields.fields.length <= 1) return;
    const painId = getValues(`painPoints.${index}.id`);
    const renumbered = renumberPainPoints(
      getValues("painPoints").filter((_, i) => i !== index),
      stripPainPointFromJobs(painId, getValues("jobs"))
    );
    setValue("painPoints", renumbered.painPoints);
    setValue("jobs", renumbered.jobs);
  }

  function addJob(type: PersonaFormValues["jobs"][number]["type"]) {
    jobFields.append(createEmptyJob(getValues("jobs"), type));
  }

  function removeJob(index: number) {
    const job = getValues(`jobs.${index}`);
    if (getValues("jobs").filter((j) => j.type === job.type).length <= 1) return;
    jobFields.remove(index);
  }

  async function handleDelete() {
    if (!initial?.id) return;
    if (!confirm(`Archiver le persona « ${initial.name} » ?`)) return;
    setDeleting(true);
    const result = await deletePersonaAction(initial.id, projectId, projectSlug);
    if (!result.ok) {
      setError(result.error);
      setDeleting(false);
      return;
    }
    router.push(`/projects/${projectSlug}/personas`);
    router.refresh();
  }

  async function handleDuplicate() {
    if (!initial?.id) return;
    setLoading(true);
    const result = await duplicatePersonaAction(initial.id, projectId, projectSlug);
    setLoading(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push(`/projects/${projectSlug}/personas/${result.id}?edit=1`);
    router.refresh();
  }

  return (
    <>
      <form className="space-y-8 pb-28" onSubmit={handleSubmit(submitDraft)} noValidate>
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        <fieldset disabled={readOnly} className="space-y-8 border-0 p-0 m-0 min-w-0">
          <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
            <SttnsPanel title="Profil">
              <div className="mb-4 border-b border-zinc-100 pb-4">
                <PersonaPhotoUpload
                  avatarUrl={initial?.avatar_url ?? null}
                  displayName={watchedName || initial?.name || "Persona"}
                  readOnly={readOnly}
                  disabledReason={
                    isNewPersona
                      ? "Enregistrez le persona pour ajouter une photo."
                      : undefined
                  }
                  uploadAction={uploadLegacyPersonaPhotoAction.bind(
                    null,
                    projectId,
                    projectSlug,
                    initial?.id ?? ""
                  )}
                  removeAction={removeLegacyPersonaPhotoAction.bind(
                    null,
                    projectId,
                    projectSlug,
                    initial?.id ?? ""
                  )}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="sttns-label" htmlFor="persona-code-display">
                    Réf.
                  </label>
                  <input type="hidden" {...register("personaCode")} />
                  <div
                    id="persona-code-display"
                    className={cn(
                      "mt-1 rounded-lg border border-dashed px-3 py-2 font-mono text-sm font-bold uppercase tracking-wide",
                      isNewPersona
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                        : "border-slate-200 bg-slate-50 text-slate-800"
                    )}
                    aria-live="polite"
                  >
                    {watchedPersonaCode.trim() || suggestedPersonaCode || "P—"}
                  </div>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {isNewPersona
                      ? "Attribuée automatiquement à l'enregistrement · valeur indicative"
                      : "Code persona figé (P1, P2…)"}
                  </p>
                  {errors.personaCode && (
                    <p className="mt-1 text-xs text-red-600">{errors.personaCode.message}</p>
                  )}
                </div>
                <div>
                  <label className="sttns-label" htmlFor="persona-name">
                    Nom *
                  </label>
                  <input
                    id="persona-name"
                    className="sttns-input"
                    {...register("name")}
                    placeholder="ex. Adja Cissé"
                  />
                  {errors.name && (
                    <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="sttns-label" htmlFor="persona-tier">
                    Segment *
                  </label>
                  <select id="persona-tier" className="sttns-input" {...register("tier")}>
                    {vocabulary.tiers.map((opt) => (
                      <option key={opt.code} value={opt.code}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="sttns-label" htmlFor="persona-scope">
                    Scope projet
                  </label>
                  <select id="persona-scope" className="sttns-input" {...register("projectScope")}>
                    <option value="active">Actif — pilote le projet</option>
                    <option value="reference">Inactif — hors casting / phase ultérieure</option>
                  </select>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    Les personas inactifs restent visibles ici mais sont exclus des KPI et
                    sélecteurs produit.
                  </p>
                </div>
              </div>
              <p className="mt-3 text-xs text-zinc-500">
                <Link
                  href={`/projects/${projectSlug}/personas/vocabulary`}
                  className="font-semibold text-emerald-800 hover:underline"
                >
                  Configurer segments & types →
                </Link>
              </p>
              <div className="mt-4">
                <label className="sttns-label" htmlFor="persona-summary">
                  Résumé *
                </label>
                <p className="mb-2 text-xs text-sttns-muted">
                  Une phrase lisible en tête de fiche — profil, activité, contrainte clé. Affiché
                  sous le nom une fois enregistré.
                </p>
                <textarea
                  id="persona-summary"
                  className="sttns-input min-h-[112px]"
                  {...register("summary")}
                  placeholder={`35 ans, gère « Les Délices d'Adja » (traiteur, Abidjan, CA ~15 k$). Opère sur WhatsApp et cahier papier. Bloquée par l'absence d'historique pour obtenir un micro-crédit de 2 000 $.`}
                />
                {errors.summary && (
                  <p className="mt-1 text-xs text-red-600">{errors.summary.message}</p>
                )}
                {watchedSummary.trim() && (
                  <div className="mt-3">
                    <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-400">
                      Aperçu fiche
                    </p>
                    <PersonaSummaryBlock text={watchedSummary} />
                  </div>
                )}
              </div>
            </SttnsPanel>

            <PersonaMatrixHealthPanel report={coverage} />
          </section>

          <section className="sttns-card border-l-4 border-l-amber-500 p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-lg font-bold">Frictions (Pain Points)</h3>
                <p className="mt-1 text-sm text-sttns-muted">
                  Décrivez les douleurs — pas les solutions. Chaque friction reçoit un id local
                  (pp-1, pp-2…).
                </p>
              </div>
              <button type="button" onClick={addPainPoint} className="sttns-btn-secondary py-2 text-xs">
                <Plus className="h-3.5 w-3.5" />
                Ajouter une friction
              </button>
            </div>

            <ul className="mt-4 space-y-3">
              {painFields.fields.map((field, index) => (
                <li key={field.id} className="rounded-xl border border-zinc-200 bg-zinc-50/60 p-4">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wide text-amber-800">
                      {getValues(`painPoints.${index}.id`)}
                    </span>
                    {painFields.fields.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePainPoint(index)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:underline"
                      >
                        <X className="h-3.5 w-3.5" />
                        Retirer
                      </button>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="sttns-label">Libellé court *</label>
                      <input
                        className="sttns-input"
                        {...register(`painPoints.${index}.shortLabel`)}
                        placeholder="ex. Missing Middle — pas de financement sans liasse certifiée"
                      />
                    </div>
                    <div>
                      <label className="sttns-label">Détail (optionnel)</label>
                      <textarea
                        className="sttns-input min-h-[72px]"
                        {...register(`painPoints.${index}.detail`)}
                        placeholder="Situation concrète au quotidien…"
                      />
                    </div>
                  </div>
                  {coverage.criticals.some(
                    (c) => c.painId === getValues(`painPoints.${index}.id`)
                  ) && (
                    <p className="mt-2 text-xs font-semibold text-red-700">
                      🚨 Friction non couverte par un job.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>

          <section className="sttns-card border-l-4 border-l-emerald-500 p-5">
            <h3 className="font-display text-lg font-bold">Ambitions (Jobs To Be Done)</h3>
            <p className="mt-1 text-sm text-sttns-muted">
              Chaque job doit résoudre au moins une friction saisie ci-dessus — anti-solutionnisme.
            </p>

            <div className="mt-6 space-y-8">
              {vocabulary.jobTypes.map((section) => {
                const indices = watchedJobs
                  .map((job, index) => ({ job, index }))
                  .filter(({ job }) => job.type === section.code);

                return (
                  <div key={section.code}>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-bold text-zinc-800">{section.title}</h4>
                        <p className="text-xs text-zinc-500">{section.hint}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => addJob(section.code)}
                        className="text-xs font-bold text-sttns-accent hover:underline"
                      >
                        + Ajouter un job
                      </button>
                    </div>
                    <ul className="space-y-4">
                      {indices.map(({ index }) => (
                        <li
                          key={jobFields.fields[index]?.id ?? `job-${index}`}
                          className="rounded-xl border border-zinc-200 bg-white p-4"
                        >
                          <div className="mb-2 flex items-center justify-between gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wide text-emerald-800">
                              {getValues(`jobs.${index}.id`)}
                            </span>
                            {indices.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeJob(index)}
                                className="rounded-lg p-1.5 text-red-600 hover:bg-red-50"
                                aria-label="Retirer le job"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            <div className="sm:col-span-2">
                              <label className="sttns-label">Libellé du job</label>
                              <textarea
                                className="sttns-input min-h-[64px]"
                                {...register(`jobs.${index}.label`)}
                                placeholder={jobTypePlaceholder(section.code)}
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="sttns-label">Frictions résolues *</label>
                              <PersonaPainPointMultiSelect
                                painPoints={watchedPains}
                                value={getValues(`jobs.${index}.resolvedPainPointIds`) ?? []}
                                onChange={(ids) =>
                                  setValue(`jobs.${index}.resolvedPainPointIds`, ids, {
                                    shouldDirty: true,
                                    shouldValidate: true,
                                  })
                                }
                              />
                            </div>
                          </div>
                          {coverage.warnings.some(
                            (w) => w.jobId === getValues(`jobs.${index}.id`)
                          ) &&
                            getValues(`jobs.${index}.label`)?.trim() && (
                              <p className="mt-2 text-xs font-semibold text-amber-800">
                                ⚠️ Job fantôme — aucune friction liée.
                              </p>
                            )}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
          </section>
        </fieldset>

        {!readOnly && (
          <div className="sticky bottom-0 z-40 -mx-1 flex flex-wrap items-center gap-3 border-t border-zinc-200 bg-sttns-cream/95 px-1 py-4 backdrop-blur-sm">
            <button type="submit" disabled={loading} className="sttns-btn-secondary">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Enregistrer en brouillon (DRAFT)
            </button>
            <button
              type="button"
              disabled={loading || !coverage.readyAllowed}
              title={
                !coverage.readyAllowed
                  ? "Couvrez toutes les frictions avant de passer en READY."
                  : undefined
              }
              className="sttns-btn-primary disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleSubmit(submitReady)}
            >
              Publier (READY)
            </button>
            {initial && (
              <>
                <button
                  type="button"
                  onClick={handleDuplicate}
                  disabled={loading}
                  className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  <Copy className="h-4 w-4" />
                  Dupliquer
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={deleting}
                  className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Archiver
                </button>
              </>
            )}
          </div>
        )}
      </form>

      <PersonaDraftConfirmModal
        open={confirmDraftOpen}
        criticalCount={coverage.criticals.length}
        warningCount={coverage.warnings.length}
        onCancel={() => {
          setConfirmDraftOpen(false);
          setPendingDraftValues(null);
        }}
        onConfirm={() => {
          setConfirmDraftOpen(false);
          if (pendingDraftValues) void persist(pendingDraftValues);
          setPendingDraftValues(null);
        }}
      />
    </>
  );
}
