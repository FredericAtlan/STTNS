/** Map Supabase Auth errors to clear French copy for PME/demo users. */
export function authErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();

  if (lower.includes("rate limit") || lower.includes("email rate")) {
    return (
      "Limite d'envoi d'emails Supabase atteinte (environ 4 emails/heure en gratuit). " +
      "Attendez une heure, demandez à l'admin plateforme un lien de réinitialisation manuel, " +
      "ou réinitialisez le mot de passe depuis Supabase → Auth → Users."
    );
  }

  if (lower.includes("invalid login credentials")) {
    return "Email ou mot de passe incorrect.";
  }

  if (lower.includes("user already registered")) {
    return "Un compte existe déjà avec cet email — connectez-vous ou utilisez mot de passe oublié.";
  }

  if (lower.includes("signup is disabled")) {
    return "Les inscriptions sont désactivées. Contactez l'administrateur.";
  }

  return raw;
}

export function isEmailRateLimitError(raw: string): boolean {
  const lower = raw.toLowerCase();
  return lower.includes("rate limit") || lower.includes("email rate");
}
