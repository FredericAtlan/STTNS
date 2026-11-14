import type { SttnsInitiative, SttnsModule, SttnsModuleCode } from "@/types/sttns";

export const LEGACY_MODULE_CODES: SttnsModuleCode[] = [
  "ingestion",
  "accounting",
  "scoring_web3",
  "platform",
];

export function moduleEnumFromCode(code: string): SttnsModuleCode {
  return LEGACY_MODULE_CODES.includes(code as SttnsModuleCode)
    ? (code as SttnsModuleCode)
    : "platform";
}

export function slugifyModuleCode(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "")
    .slice(0, 48);
}

/** Match initiative to a module row (module_id preferred, legacy enum fallback). */
export function initiativeBelongsToModule(
  init: Pick<SttnsInitiative, "module_id" | "module">,
  mod: Pick<SttnsModule, "id" | "code">
): boolean {
  if (init.module_id) return init.module_id === mod.id;
  return init.module === mod.code;
}

export function initiativesForModule(
  initiatives: SttnsInitiative[],
  mod: SttnsModule
): SttnsInitiative[] {
  return initiatives.filter((i) => initiativeBelongsToModule(i, mod));
}

export function unassignedInitiatives(
  modules: SttnsModule[],
  initiatives: SttnsInitiative[]
): SttnsInitiative[] {
  return initiatives.filter(
    (i) => !modules.some((m) => initiativeBelongsToModule(i, m))
  );
}

export function moduleById(
  modules: SttnsModule[],
  id: string | null | undefined
): SttnsModule | undefined {
  if (!id) return undefined;
  return modules.find((m) => m.id === id);
}

const LEGACY_MODULE_LABELS: Record<SttnsModuleCode, string> = {
  ingestion: "Ingestion OCR",
  accounting: "Moteur comptable",
  scoring_web3: "Scoring & Web3",
  platform: "Plateforme",
};

/** Display label for initiative target module (column in arbitrage, not grouping). */
export function initiativeModuleLabel(
  init: Pick<SttnsInitiative, "module_id" | "module">,
  modules: SttnsModule[]
): string {
  const mod = moduleById(modules, init.module_id);
  if (mod) return mod.name;
  if (init.module && init.module in LEGACY_MODULE_LABELS) {
    return LEGACY_MODULE_LABELS[init.module as SttnsModuleCode];
  }
  return init.module ?? "—";
}
