import { z } from "zod";
import type { PersonaVocabulary } from "@/lib/personas/personaVocabulary";
import { fallbackPersonaVocabulary } from "@/lib/personas/personaVocabulary";

const painPointSchema = z.object({
  id: z.string().min(1),
  shortLabel: z.string(),
  detail: z.string().optional(),
});

const jobSchema = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  label: z.string(),
  resolvedPainPointIds: z.array(z.string()),
});

export function buildPersonaFormSchema(vocabulary?: PersonaVocabulary) {
  const vocab = vocabulary ?? fallbackPersonaVocabulary();
  const tierCodes = vocab.tiers.map((t) => t.code);
  const jobTypeCodes = vocab.jobTypes.map((t) => t.code);

  const tierSchema =
    tierCodes.length > 0
      ? z.enum(tierCodes as [string, ...string[]])
      : z.string().min(1, "Choisissez un segment.");

  const jobTypeSchema =
    jobTypeCodes.length > 0
      ? z.enum(jobTypeCodes as [string, ...string[]])
      : z.string().min(1);

  return z.object({
    personaCode: z
      .string()
      .trim()
      .min(1)
      .regex(/^P\d+$/i, "Format attendu : P1, P2, P10…"),
    name: z.string().trim().min(1, "Le nom du persona est obligatoire."),
    tier: tierSchema,
    projectScope: z.enum(["active", "reference"]),
    summary: z
      .string()
      .trim()
      .min(
        1,
        "Le résumé présente le persona en une phrase (profil, activité, blocage principal)."
      ),
    status: z.enum(["DRAFT", "READY"]),
    painPoints: z.array(painPointSchema).min(1, "Ajoutez au moins une friction."),
    jobs: z.array(
      jobSchema.extend({
        type: jobTypeSchema,
      })
    ),
  });
}

export const personaFormSchema = buildPersonaFormSchema();

export type PersonaFormValues = z.infer<typeof personaFormSchema>;

export function personaFormDefaultValues(vocabulary?: PersonaVocabulary): PersonaFormValues {
  const vocab = vocabulary ?? fallbackPersonaVocabulary();
  const defaultTier = vocab.tiers[0]?.code ?? "T2";

  return {
    personaCode: "P1",
    name: "",
    tier: defaultTier,
    projectScope: "active" as const,
    summary: "",
    status: "DRAFT",
    painPoints: [{ id: "pp-1", shortLabel: "", detail: "" }],
    jobs: vocab.jobTypes.map((section, index) => ({
      id: `jb-${index + 1}`,
      type: section.code,
      label: "",
      resolvedPainPointIds: [] as string[],
    })),
  };
}

/** @deprecated use personaFormDefaultValues(vocabulary) */
export const personaFormDefaultValuesLegacy = personaFormDefaultValues();
