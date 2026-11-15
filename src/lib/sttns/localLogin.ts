/**
 * Entrée locale sans mot de passe (développement sur Supabase Docker uniquement).
 *
 * Active seulement si les TROIS conditions sont réunies :
 *  - STTNS_LOCAL_LOGIN=1 dans l'environnement du serveur ;
 *  - NEXT_PUBLIC_SUPABASE_URL pointe sur la machine (localhost / 127.0.0.1) ;
 *  - la requête arrive elle-même sur localhost / 127.0.0.1.
 * Sur une instance hébergée, l'une au moins manque : l'écran de connexion normal s'applique.
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

function isLocalUrl(value: string | undefined | null): boolean {
  if (!value) return false;
  try {
    return LOCAL_HOSTS.has(new URL(value).hostname);
  } catch {
    return false;
  }
}

export function isLocalLoginEnabled(requestUrl: string): boolean {
  return (
    process.env.STTNS_LOCAL_LOGIN === "1" &&
    isLocalUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    isLocalUrl(requestUrl)
  );
}

/** Compte utilisé pour l'entrée locale (par défaut : l'admin fictive du projet de démo). */
export function localLoginEmail(): string {
  return process.env.STTNS_LOCAL_LOGIN_EMAIL?.trim() || "claire.morel@panier-local.test";
}

/** URL publique de la requête, d'après l'en-tête Host (le serveur standalone se voit en 0.0.0.0). */
export function publicRequestUrl(url: string, host: string | null): string {
  const u = new URL(url);
  if (host) {
    try {
      const h = new URL(`http://${host}`);
      u.hostname = h.hostname;
      u.port = h.port;
    } catch {
      /* Host invalide : on garde l'URL brute */
    }
  }
  return u.href;
}
