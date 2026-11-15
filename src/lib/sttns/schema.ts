import { z } from "zod";
import {
  complexitySchema,
  effortDaysSchema,
  impactSchema,
} from "@/lib/sttns/valueEffort";
import { isHttpUrl } from "@/lib/security/urls";

export const WORK_ITEM_CONTEXT_TYPES = ["persona", "pain_point", "job", "metric"] as const;

export const workItemStatusSchema = z.enum(["todo", "in_progress", "review", "done"]);

/** Soft delete Spine : préférer `archived_at` (datetime ISO) plutôt qu'un statut workflow. */
export const workItemArchiveAtSchema = z.string().datetime().nullable().optional();

export const dbWorkItemTypeSchema = z.enum([
  "persona",
  "job",
  "epic",
  "feature",
  "story",
  "task",
]);

export const contextTypeSchema = z.enum(WORK_ITEM_CONTEXT_TYPES);

/** @deprecated Remplacé par effortDaysSchema (matrice Jours / Risque). */
export const fibonacciEffortSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(5),
  z.literal(8),
  z.literal(13),
]);

/** @deprecated Remplacé par le ratio Valeur/Effort (valueEffort.ts). */
export const riceMetadataSchema = z.object({
  reach: z.number().min(0),
  impact: z.number().min(0),
  confidence: z.number().min(1).max(100),
  effort: z.number().min(0),
});

export { effortDaysSchema, complexitySchema, impactSchema };

export const workItemContextLinkSchema = z.object({
  type: contextTypeSchema,
  context_id: z.string().uuid(),
});

const saveBaseSchema = {
  id: z.string().uuid().optional(),
  project_id: z.string().uuid(),
  status: workItemStatusSchema.default("todo"),
  assignee_id: z.string().uuid().nullable().optional(),
  priority: z.number().int().min(1).max(5).default(3),
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  code: z.string().trim().min(1).max(255).nullable().optional(),
  sort_order: z.number().int().default(0),
  archived_at: workItemArchiveAtSchema,
  context_links: z.array(workItemContextLinkSchema).optional(),
};

export const metadataDocUrlSchema = z
  .string()
  .trim()
  .refine((v) => v === "" || isHttpUrl(v), "URL de documentation invalide (http ou https).")
  .optional()
  .nullable();

export const personaMetadataSchema = z.object({
  segment: z.string().trim().optional(),
  description: z.string().trim().optional(),
  avatar_url: z.string().trim().refine(isHttpUrl, "URL invalide (http ou https).").optional().nullable(),
  doc_url: metadataDocUrlSchema,
});

export const painPointMetadataSchema = z.object({
  severity: z.enum(["low", "medium", "high", "critical"]),
  label: z.string().trim().min(1, "Le libellé du Pain Point est obligatoire."),
});

export const jobMetadataSchema = z.object({
  situation: z.string().trim().optional(),
  motivation: z.string().trim().optional(),
  outcome: z.string().trim().optional(),
});

export const epicMetadataSchema = z.object({
  persona_id: z.string().uuid().optional(),
  /** Lien 1:1 cycle ↔ epic (mode simplifié). */
  cycle_id: z.string().uuid().optional(),
  description: z.string().trim().optional().nullable(),
  doc_url: metadataDocUrlSchema,
  archived_reason: z.string().optional(),
  archived_reason_details: z.string().nullable().optional(),
  archived_at: z.string().optional(),
  archived_by: z.string().optional(),
});

export const featureMetadataSchema = z.object({
  /** Valeur métier 0–3 (0 = Gaspillage, hard block in_progress). */
  impact: impactSchema.optional(),
  /** Fallback Shape Up : jours quand la feature n'a pas de stories. */
  effort_days: effortDaysSchema.optional(),
  /** Fallback Shape Up : Risque (clé DB complexity) quand la feature n'a pas de stories. */
  complexity: complexitySchema.optional(),
  description: z.string().nullable().optional(),
  doc_url: metadataDocUrlSchema,
  archived_reason: z.string().optional(),
  archived_reason_details: z.string().nullable().optional(),
  archived_at: z.string().optional(),
  archived_by: z.string().optional(),
});

export const storyMetadataSchema = z.object({
  effort_days: effortDaysSchema.optional(),
  complexity: complexitySchema.optional(),
  description: z.string().nullable().optional(),
  doc_url: metadataDocUrlSchema,
  archived_reason: z.string().optional(),
  archived_reason_details: z.string().nullable().optional(),
  archived_at: z.string().optional(),
  archived_by: z.string().optional(),
});

export const taskMetadataSchema = z.object({
  notion_url: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "URL invalide (http ou https).").optional().nullable(),
});

export const personaSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("persona"),
    parent_id: z.null().optional(),
    metadata: personaMetadataSchema.default({}),
  })
  .strict();

export const painPointSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("pain_point"),
    parent_id: z.string().uuid(),
    metadata: painPointMetadataSchema,
  })
  .strict();

export const jobSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("job"),
    parent_id: z.string().uuid(),
    metadata: jobMetadataSchema.default({}),
    solved_pain_points: z.array(z.string().uuid()).optional(),
  })
  .strict();

export const epicSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("epic"),
    parent_id: z.null().optional(),
    metadata: epicMetadataSchema,
  })
  .strict();

export const featureSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("feature"),
    parent_id: z.string().uuid(),
    cycle_id: z.string().uuid().nullable().optional(),
    metadata: featureMetadataSchema.default({}),
  })
  .strict();

export const storySaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("story"),
    parent_id: z.string().uuid(),
    cycle_id: z.string().uuid().nullable().optional(),
    metadata: storyMetadataSchema.optional().default({}),
  })
  .strict();

export const taskSaveSchema = z
  .object({
    ...saveBaseSchema,
    type: z.literal("task"),
    parent_id: z.string().uuid(),
    metadata: taskMetadataSchema.optional().default({}),
  })
  .strict();

export function parseTaskMetadata(metadata: unknown) {
  return taskMetadataSchema.parse(metadata ?? {});
}

export function readTaskNotionUrl(metadata: unknown): string | null {
  const parsed = taskMetadataSchema.safeParse(metadata ?? {});
  if (!parsed.success) return null;
  return parsed.data.notion_url?.trim() || null;
}

export const saveWorkItemSchema = z.discriminatedUnion("type", [
  personaSaveSchema,
  painPointSaveSchema,
  jobSaveSchema,
  epicSaveSchema,
  featureSaveSchema,
  storySaveSchema,
  taskSaveSchema,
]);

export function parseSaveWorkItemInput(data: unknown) {
  return saveWorkItemSchema.parse(data);
}

/** Schéma lecture ligne DB (avant discrimination logique pain_point). */
export const workItemRowSchema = z.object({
  id: z.string().uuid(),
  project_id: z.string().uuid(),
  type: z.enum(["epic", "feature", "story", "task", "persona", "job"]),
  parent_id: z.string().uuid().nullable(),
  status: workItemStatusSchema,
  assignee_id: z.string().uuid().nullable(),
  priority: z.number().int().min(1).max(5),
  title: z.string(),
  code: z.string().nullable(),
  sort_order: z.number().int(),
  tree_path: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  archived_at: z.string().datetime().nullable(),
  created_by: z.string().uuid().nullable(),
  updated_by: z.string().uuid().nullable(),
  cycle_id: z.string().uuid().nullable(),
  effort_points: z.number().int().min(0),
  rice_reach: z.number(),
  rice_impact: z.number(),
  rice_confidence: z.number(),
  rice_effort: z.number(),
  rice_score: z.number(),
  metadata: z.record(z.string(), z.unknown()).nullable().optional(),
});

// ---------------------------------------------------------------------------
// Schémas formulaires « Pourquoi » (porte d'entrée UI — distincts du save Spine)
// ---------------------------------------------------------------------------

const jtbdSyntaxRegex = /^Quand\s+\[.+\],\s+je\s+veux\s+\[.+\]\s+afin\s+de\s+\[.+\]$/i;

export const personaInputSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1, "Le nom du persona est obligatoire."),
  code: z.string().trim().min(1).max(10).optional(),
  description: z.string().trim().optional(),
  segment: z.string().trim().optional(),
  doc_url: z.string().trim().refine((v) => v === "" || isHttpUrl(v), "URL invalide (http ou https).").optional(),
});

export const jtbdInputSchema = z.object({
  id: z.string().uuid().optional(),
  persona_id: z.string().uuid({ message: "Un JTBD doit être rattaché à un Persona." }),
  job_statement: z
    .string()
    .trim()
    .min(1, "Le Job Statement est obligatoire.")
    .regex(
      jtbdSyntaxRegex,
      'Syntaxe stricte requise : "Quand [Situation], je veux [Motivation] afin de [Résultat]"'
    ),
  situation: z.string().trim().optional(),
  motivation: z.string().trim().optional(),
  outcome: z.string().trim().optional(),
  /** Liens solves : UUIDs de Pain Points du même persona (validés serveur). */
  solved_pain_points: z.array(z.string().uuid()).optional(),
});

export const painPointInputSchema = z.object({
  id: z.string().uuid().optional(),
  persona_id: z.string().uuid(),
  label: z.string().trim().min(1, "Le libellé du Pain Point est obligatoire."),
  severity: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

/**
 * Soft-delete Why (Persona / PP / JTBD).
 * Cascade Persona → enfants `type=job` : appliquée dans `archiveWorkItemAction`.
 */
export const archiveWhyItemIdSchema = z
  .string()
  .uuid({ message: "Identifiant Why invalide." });
