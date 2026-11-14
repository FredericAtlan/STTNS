import type { PersonaFormValues } from "@/lib/personas/personaFormSchema";
import type { JobToBeDone } from "@/lib/personas/personaMatrix.types";
import type { PersonaVocabulary } from "@/lib/personas/personaVocabulary";
import { resolveTierCode } from "@/lib/personas/personaVocabulary";
import type { SttnsPersona, SttnsPersonaJob, SttnsPersonaPainPoint } from "@/types/sttns";
import { jobsForPersona, painPointsForPersona } from "@/lib/sttns/personas";

function painClientKey(point: SttnsPersonaPainPoint, index: number): string {
  const row = point as SttnsPersonaPainPoint & { client_key?: string | null };
  return row.client_key?.trim() || `pp-${index + 1}`;
}

function jobClientKey(job: SttnsPersonaJob, index: number): string {
  const row = job as SttnsPersonaJob & { client_key?: string | null };
  return row.client_key?.trim() || `jb-${index + 1}`;
}

export function personaToFormValues(
  persona?: SttnsPersona,
  vocabulary?: PersonaVocabulary,
  suggestedCode?: string
): PersonaFormValues {
  const tierCodes = vocabulary?.tiers.map((t) => t.code) ?? ["T1", "T2", "T3", "T4"];
  const jobTypeCodes = vocabulary?.jobTypes.map((t) => t.code) ?? [
    "functional",
    "social",
    "emotional",
  ];

  if (!persona) {
    return {
      personaCode: suggestedCode ?? "P1",
      name: "",
      tier: tierCodes[1] ?? tierCodes[0] ?? "T2",
      projectScope: "active",
      summary: "",
      status: "DRAFT",
      painPoints: [{ id: "pp-1", shortLabel: "", detail: "" }],
      jobs: jobTypeCodes.map((code, index) => ({
        id: `jb-${index + 1}`,
        type: code,
        label: "",
        resolvedPainPointIds: [],
      })),
    };
  }

  const pains = painPointsForPersona(persona);
  const jobs = jobsForPersona(persona);

  const painKeyToId = new Map<string, string>();
  const painPoints = pains.length
    ? pains.map((point, index) => {
        const clientKey = painClientKey(point, index);
        painKeyToId.set(point.id, clientKey);
        return {
          id: clientKey,
          shortLabel: point.label,
          detail: point.description ?? "",
        };
      })
    : [{ id: "pp-1", shortLabel: "", detail: "" }];

  const dbJobRows = jobs as (SttnsPersonaJob & {
    client_key?: string | null;
    resolved_pain_point_ids?: string[] | null;
  })[];

  const formJobs: JobToBeDone[] = dbJobRows.length
    ? dbJobRows.map((job, index) => {
        const clientKey = jobClientKey(job, index);
        const resolvedDbIds = job.resolved_pain_point_ids ?? [];
        const resolvedPainPointIds = resolvedDbIds
          .map((dbId) => {
            for (const [painDbId, painClient] of Array.from(painKeyToId.entries())) {
              if (painDbId === dbId) return painClient;
            }
            return null;
          })
          .filter((id): id is string => !!id);

        return {
          id: clientKey,
          type: job.job_type,
          label: job.description,
          resolvedPainPointIds,
        };
      })
    : jobTypeCodes.map((code, index) => ({
        id: `jb-${index + 1}`,
        type: code,
        label: "",
        resolvedPainPointIds: [] as string[],
      }));

  const row = persona as SttnsPersona & { persona_status?: string | null };
  const status = row.persona_status === "READY" ? "READY" : "DRAFT";

  return {
    personaCode: persona.persona_code?.trim() || suggestedCode || "P1",
    name: persona.name,
    tier: resolveTierCode(persona.tier_label, tierCodes),
    projectScope: persona.project_scope === "reference" ? "reference" : "active",
    summary: persona.profile_summary ?? "",
    status,
    painPoints,
    jobs: formJobs,
  };
}

export function formValuesToSavePayload(values: PersonaFormValues) {
  return {
    persona_code: values.personaCode.trim().toUpperCase(),
    project_scope: values.projectScope,
    name: values.name.trim(),
    tier_label: values.tier,
    profile_summary: values.summary.trim(),
    persona_status: values.status,
    pain_points: values.painPoints
      .filter((p) => p.shortLabel.trim())
      .map((p, index) => ({
        client_key: p.id,
        label: p.shortLabel.trim(),
        description: p.detail?.trim() || null,
        sort_order: index + 1,
      })),
    jobs: values.jobs
      .filter((j) => j.label.trim())
      .map((j, index) => ({
        client_key: j.id,
        job_type: j.type,
        description: j.label.trim(),
        sort_order: index + 1,
        resolved_pain_client_keys: j.resolvedPainPointIds,
      })),
  };
}

export type PersonaSavePayload = ReturnType<typeof formValuesToSavePayload>;
