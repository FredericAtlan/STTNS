export type FeaturesHubTab = "board" | "registry" | "arbitrage";

export const FEATURES_HUB_TABS: { id: FeaturesHubTab; label: string }[] = [
  { id: "board", label: "Board Releases" },
  { id: "registry", label: "Registre" },
  { id: "arbitrage", label: "Control Room" },
];

export function parseFeaturesHubTab(raw: string | undefined): FeaturesHubTab {
  if (raw === "arbitrage") return raw;
  if (raw === "registry") return raw;
  return "board";
}

export function featuresHubPath(slug: string, tab?: FeaturesHubTab) {
  const base = `/projects/${slug}/features`;
  if (!tab || tab === "board") return base;
  return `${base}?tab=${tab}`;
}
