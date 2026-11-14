import { featuresHubPath } from "@/lib/sttns/featuresHub";

export function projectPath(slug: string, segment = "") {
  const base = `/projects/${slug}`;
  return segment ? `${base}/${segment.replace(/^\//, "")}` : base;
}

/** Page d'accueil projet — Matrice Besoins (Spine /why). */
export function projectHomePath(slug: string) {
  return projectPath(slug, "why");
}

export function featuresPath(slug: string, segment?: "new" | "arbitrage" | string) {
  if (!segment) return projectPath(slug, "features");
  if (segment === "new") return projectPath(slug, "features/new");
  if (segment === "arbitrage") return featuresHubPath(slug, "arbitrage");
  return projectPath(slug, `features/${segment}`);
}

export { featuresHubPath };

export function modulesPath(slug: string, segment?: "new" | string) {
  if (!segment) return projectPath(slug, "modules");
  if (segment === "new") return projectPath(slug, "modules/new");
  return projectPath(slug, `modules/${segment}`);
}
