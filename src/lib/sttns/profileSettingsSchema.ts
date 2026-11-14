import { z } from "zod";

export const profileUpdateSchema = z.object({
  first_name: z
    .string()
    .trim()
    .min(1, "Le prénom est obligatoire.")
    .max(60, "Le prénom ne peut pas dépasser 60 caractères."),
  last_name: z
    .string()
    .trim()
    .min(1, "Le nom est obligatoire.")
    .max(60, "Le nom ne peut pas dépasser 60 caractères."),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

export const changePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères.")
      .max(128, "Le mot de passe ne peut pas dépasser 128 caractères."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export function splitFullName(fullName: string | null | undefined): {
  first_name: string;
  last_name: string;
} {
  const trimmed = fullName?.trim() ?? "";
  if (!trimmed) return { first_name: "", last_name: "" };
  const spaceIdx = trimmed.indexOf(" ");
  if (spaceIdx === -1) return { first_name: trimmed, last_name: "" };
  return {
    first_name: trimmed.slice(0, spaceIdx),
    last_name: trimmed.slice(spaceIdx + 1).trim(),
  };
}

export function joinFullName(firstName: string, lastName: string): string {
  return [firstName.trim(), lastName.trim()].filter(Boolean).join(" ");
}
