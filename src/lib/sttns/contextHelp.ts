/**
 * Taxonomie des contenus d'aide STTNS — tooltips « ? » in-app (survol / focus).
 * Contenus : `pageContextHelp.ts`, `featuresContextHelp.ts` — import via `sttnsContext.ts`.
 * Cartographie : README.md § Cartographie des fichiers de contexte
 */
export type SttnsContextHelpKind =
  | "definition"
  | "guide"
  | "regle"
  | "statut"
  | "alerte"
  | "reference";

export type SttnsContextHelpContent = {
  kind: SttnsContextHelpKind;
  title: string;
  body: string;
  /** Lien optionnel vers doc interne (framework, NSM…) */
  href?: string;
  hrefLabel?: string;
};

export const STTNS_CONTEXT_HELP_KIND: Record<
  SttnsContextHelpKind,
  { label: string; chipClass: string; accentClass: string }
> = {
  definition: {
    label: "Définition",
    chipClass: "bg-zinc-100 text-zinc-600 ring-zinc-200/80",
    accentClass: "border-l-zinc-400",
  },
  guide: {
    label: "Guide",
    chipClass: "bg-sky-50 text-sky-800 ring-sky-200/80",
    accentClass: "border-l-sky-500",
  },
  regle: {
    label: "Règle métier",
    chipClass: "bg-amber-50 text-amber-900 ring-amber-200/80",
    accentClass: "border-l-amber-500",
  },
  statut: {
    label: "Statut",
    chipClass: "bg-violet-50 text-violet-800 ring-violet-200/80",
    accentClass: "border-l-violet-500",
  },
  alerte: {
    label: "Attention",
    chipClass: "bg-rose-50 text-rose-800 ring-rose-200/80",
    accentClass: "border-l-rose-500",
  },
  reference: {
    label: "Référence",
    chipClass: "bg-emerald-50 text-emerald-800 ring-emerald-200/80",
    accentClass: "border-l-emerald-600",
  },
};

/** Quand utiliser chaque type (charte rédactionnelle) */
export const STTNS_CONTEXT_HELP_USAGE: Record<SttnsContextHelpKind, string> = {
  definition:
    "Sens d'un terme, acronyme ou champ de formulaire. Une phrase, vocabulaire métier STTNS.",
  guide:
    "Comment accomplir une action sur cet écran. Étapes courtes, impératif professionnel.",
  regle:
    "Contrainte gouvernance, cascade agile, validation CEO. Ce qui se passe automatiquement.",
  statut:
    "Signification d'un badge ou d'une valeur d'énumération dans le pipeline.",
  alerte:
    "Prérequis manquant, blocage, risque si l'action est ignorée.",
  reference:
    "Renvoi méthodologique (framework, NSM, SYSCOHADA…) sans recopier la doc.",
};
