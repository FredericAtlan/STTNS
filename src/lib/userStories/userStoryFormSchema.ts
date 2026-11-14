import { z } from "zod";

export const userStoryDraftSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire."),
  context_label: z.string().optional(),
  epic_id: z.string().nullable(),
  primary_persona_id: z.string().nullable(),
  target_persona_job_id: z.string().nullable(),
  persona_ids: z.array(z.string()),
  sprint_want: z.string(),
  sprint_so_that: z.string(),
  impact_metric_id: z.string().nullable(),
  impacts_north_star: z.boolean(),
  impact_description: z.string(),
  initiative_id: z.string().nullable(),
  notes: z.string(),
});

export const userStoryPublishSchema = userStoryDraftSchema
  .extend({
    primary_persona_id: z.string().trim().min(1, "Persona principal requis."),
    target_persona_job_id: z.string().trim().min(1, "Objectif JTBD visé requis."),
    sprint_want: z.string().trim().min(1, "« Je veux » est obligatoire."),
    sprint_so_that: z.string().trim().min(1, "« Afin de » est obligatoire."),
    persona_ids: z.array(z.string()).min(1, "Sélectionnez au moins un persona."),
    epic_id: z.string().trim().min(1, "Lien epic requis."),
    initiative_id: z.string().trim().min(1, "Lien feature requis."),
  })
  .refine((data) => data.impacts_north_star || !!data.impact_metric_id?.trim(), {
    message: "Indicateur d'impact requis.",
    path: ["impact_metric_id"],
  });

export type UserStoryFormInput = z.infer<typeof userStoryDraftSchema>;

export function validateUserStorySave(
  input: UserStoryFormInput,
  intent: "draft" | "publish"
): { ok: true } | { ok: false; error: string } {
  const schema = intent === "publish" ? userStoryPublishSchema : userStoryDraftSchema;
  const result = schema.safeParse(input);
  if (result.success) return { ok: true };
  const first = result.error.issues[0];
  return { ok: false, error: first?.message ?? "Formulaire incomplet." };
}
