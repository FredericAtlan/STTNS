/**
 * Règles HTTP Étape B — source partagée `next.config.mjs` + tests.
 * Chemins relatifs projet : `/projects/:slug/personas…` → `/why`.
 *
 * @typedef {{ source: string; destination: string; permanent: boolean }} LegacyPersonaRedirectRule
 */

/** @type {LegacyPersonaRedirectRule[]} */
export const LEGACY_PERSONA_HTTP_REDIRECTS = [
  {
    source: "/projects/:slug/personas/new",
    destination: "/projects/:slug/why?tab=persona",
    permanent: true,
  },
  {
    source: "/projects/:slug/personas/vocabulary",
    destination: "/projects/:slug/why",
    permanent: true,
  },
  {
    source: "/projects/:slug/personas/:id",
    destination: "/projects/:slug/why",
    permanent: true,
  },
  {
    source: "/projects/:slug/personas",
    destination: "/projects/:slug/why",
    permanent: true,
  },
];

/**
 * Simule le matching Next.js redirects (segments dynamiques `:slug`, `:id`).
 * @param {string} pathname ex. `/projects/demo/personas` ou `/projects/demo/personas/123`
 * @returns {{ destination: string; permanent: boolean; statusCode: 308 } | null}
 */
export function matchLegacyPersonaHttpRedirect(pathname) {
  const path = pathname.split("?")[0] ?? pathname;
  for (const rule of LEGACY_PERSONA_HTTP_REDIRECTS) {
    const keys = [];
    const pattern = rule.source.replace(/:([A-Za-z_]+)/g, (_, key) => {
      keys.push(key);
      return "([^/]+)";
    });
    const re = new RegExp(`^${pattern}$`);
    const m = path.match(re);
    if (!m) continue;
    const params = Object.fromEntries(keys.map((k, i) => [k, m[i + 1]]));
    let destination = rule.destination;
    for (const [k, v] of Object.entries(params)) {
      destination = destination.replaceAll(`:${k}`, v);
    }
    return {
      destination,
      permanent: rule.permanent,
      statusCode: 308,
    };
  }
  return null;
}
