/**
 * Garde-fous d'URL partagés (redirections et liens saisis par les utilisateurs).
 */

/**
 * Chemin interne sûr pour une redirection après connexion : renvoie `fallback` si `next`
 * pointerait hors de l'origine (`//evil.com`, `/\evil.com`, `https://…`, caractères de contrôle).
 */
export function safeInternalPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || /[\\\u0000-\u001f]/.test(next)) return fallback;
  try {
    const base = "http://interne.invalid";
    const url = new URL(next, base);
    if (url.origin !== base) return fallback;
    return url.pathname + url.search + url.hash;
  } catch {
    return fallback;
  }
}

/** Vrai pour une URL absolue http(s) — à utiliser dans la validation des liens saisis. */
export function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value.trim());
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Lien affichable dans un `href` : n'accepte que http(s) et mailto ; sinon `undefined`
 * (neutralise `javascript:`, `data:`… déjà stockés en base).
 */
export function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const v = value.trim();
  try {
    const { protocol } = new URL(v);
    return protocol === "http:" || protocol === "https:" || protocol === "mailto:" ? v : undefined;
  } catch {
    return undefined;
  }
}
