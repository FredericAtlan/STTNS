import { z } from "zod";

const squadProjectRoleEnum = z.enum(["viewer", "editor", "ceo_admin"]);

export const projectGeneralUpdateSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Le nom du projet est obligatoire.")
    .max(120, "Le nom ne peut pas dépasser 120 caractères."),
  description: z
    .string()
    .trim()
    .max(2000, "La description ne peut pas dépasser 2000 caractères.")
    .nullable()
    .optional(),
});

export type ProjectGeneralUpdateInput = z.infer<typeof projectGeneralUpdateSchema>;

export const projectInviteMemberSchema = z
  .object({
    email: z.string().trim().optional(),
    user_id: z.string().trim().optional(),
    project_role: squadProjectRoleEnum,
  })
  .superRefine((data, ctx) => {
    const email = data.email?.trim() ?? "";
    const userId = data.user_id?.trim() ?? "";

    if (!email && !userId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Indiquez un email ou un ID utilisateur.",
        path: ["email"],
      });
      return;
    }

    if (email && !z.string().email().safeParse(email).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Email invalide.",
        path: ["email"],
      });
    }

    if (userId && !z.string().uuid().safeParse(userId).success) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "ID utilisateur invalide.",
        path: ["user_id"],
      });
    }
  });

export type ProjectInviteMemberInput = z.infer<typeof projectInviteMemberSchema>;

export const projectArchiveConfirmSchema = z
  .object({
    confirmationName: z.string().trim().min(1, "Saisissez le nom du projet pour confirmer."),
    projectName: z.string().trim().min(1),
  })
  .refine((data) => data.confirmationName === data.projectName, {
    message: "Le nom saisi ne correspond pas au projet.",
    path: ["confirmationName"],
  });

export type ProjectArchiveConfirmInput = z.infer<typeof projectArchiveConfirmSchema>;

export const executionUnitSchema = z.enum(["story", "feature"]);

export type ExecutionUnit = z.infer<typeof executionUnitSchema>;

/** Paramètres JSONB de gouvernance workflow (colonne sttns_projects.settings). */
export const projectWorkflowSettingsSchema = z.object({
  /** Unité d'exécution : stories (défaut) ou features (mode simplifié). */
  executionUnit: executionUnitSchema.default("story"),
  /** Crée / lie un epic à chaque cycle (mode simplifié). */
  epicEqualsCycle: z.boolean().default(false),
  wipLimit: z
    .number()
    .int("La limite WIP doit être un entier.")
    .min(1, "Minimum 1 story en cours.")
    .max(50, "Maximum 50 stories en cours."),
  strictDoD: z.boolean(),
  stagnationDays: z
    .number()
    .int("Les jours de stagnation doivent être un entier.")
    .min(1, "Minimum 1 jour.")
    .max(90, "Maximum 90 jours."),
  defaultCycleWeeks: z
    .number()
    .int("La durée de cycle doit être un entier.")
    .min(1, "Minimum 1 semaine.")
    .max(12, "Maximum 12 semaines."),
});

export type ProjectWorkflowSettings = z.infer<typeof projectWorkflowSettingsSchema>;

export const DEFAULT_PROJECT_WORKFLOW_SETTINGS: ProjectWorkflowSettings = {
  executionUnit: "story",
  epicEqualsCycle: false,
  wipLimit: 5,
  strictDoD: true,
  stagnationDays: 5,
  defaultCycleWeeks: 2,
};

/** Fusionne les defaults avec le JSONB stocké (partiel ou vide). */
export function parseProjectWorkflowSettings(raw: unknown): ProjectWorkflowSettings {
  const partial =
    typeof raw === "object" && raw !== null && !Array.isArray(raw)
      ? (raw as Record<string, unknown>)
      : {};

  return projectWorkflowSettingsSchema.parse({
    ...DEFAULT_PROJECT_WORKFLOW_SETTINGS,
    ...partial,
  });
}

export const projectWorkflowSettingsUpdateSchema = projectWorkflowSettingsSchema;

export type ProjectWorkflowSettingsUpdateInput = z.infer<
  typeof projectWorkflowSettingsUpdateSchema
>;

export const updateMemberSquadRoleSchema = z.object({
  user_id: z.string().uuid(),
  project_role: squadProjectRoleEnum,
});

export type UpdateMemberSquadRoleInput = z.infer<typeof updateMemberSquadRoleSchema>;

export const SQUAD_PROJECT_ROLE_LABELS: Record<
  z.infer<typeof squadProjectRoleEnum>,
  string
> = {
  viewer: "Lecteur",
  editor: "Éditeur",
  ceo_admin: "Admin projet",
};

/** @deprecated legacy functional labels */
const projectRoleEnum = z.enum(["ceo", "cto", "expert", "pm", "dev"]);

export const PROJECT_ROLE_LABELS: Record<
  z.infer<typeof projectRoleEnum>,
  string
> = {
  ceo: "CEO (Propriétaire)",
  cto: "CTO",
  expert: "Expert",
  pm: "Product Manager",
  dev: "Développeur",
};
