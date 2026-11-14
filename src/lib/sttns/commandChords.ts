/**
 * KF2 — Command Chord Spine.
 *
 * Raccourcis clavier globaux type Linear pour les surfaces projet Spine.
 * Deux accords principaux :
 *   - `g <lettre>` — navigation (goto)
 *   - `n <lettre>` — création rapide (new)
 *
 * Ce module est **pur** (aucun DOM, aucun Router) pour tests unitaires.
 * Le provider React qui consomme ces helpers vit dans
 * `src/components/ui/CommandChordProvider.tsx`.
 */

export type ChordPrefix = "g" | "n";

export type ChordActionKind =
  | "navigate"
  | "quick_action"
  | "open_palette"
  | "open_help";

export interface ChordEntry {
  /** Préfixe (`g` = goto ; `n` = new). */
  prefix: ChordPrefix;
  /** Deuxième touche minuscule. Voir `matchesSecondKey` pour la casse. */
  key: string;
  /** Libellé français court pour l'aide contextuelle. */
  label: string;
  /** Route relative (préfixée par `/projects/{slug}` par le consommateur). */
  navigate?: string;
  /**
   * ID d'action rapide (dispatché via `sttns:open-quick-action`).
   * Reste aligné sur `QuickActionId` du `CommandPalette`.
   */
  quickAction?:
    | "persona"
    | "pain_point"
    | "jtbd"
    | "epic"
    | "feature"
    | "story";
}

/**
 * Table canonique des accords.
 *
 * - `g` (goto) : sidebar 1:1 (Why, Brouillons, Portfolio, Cycles, Kanban, Radar,
 *   Arbre, Mind Map, Paramètres, Aide).
 * - `n` (new) : quick actions déjà présentes dans `CommandPalette` (+ persona).
 */
export const CHORD_TABLE: readonly ChordEntry[] = [
  { prefix: "g", key: "w", label: "Matrice Besoins", navigate: "/why" },
  { prefix: "g", key: "d", label: "Brouillons Epic→Feature→Story", navigate: "/discovery" },
  { prefix: "g", key: "p", label: "Epics / Features", navigate: "/portfolio" },
  { prefix: "g", key: "c", label: "Cycles", navigate: "/cycles" },
  { prefix: "g", key: "u", label: "Stories Backlogs", navigate: "/user-stories" },
  { prefix: "g", key: "k", label: "Exécution Kanban", navigate: "/kanban" },
  { prefix: "g", key: "r", label: "Radar d'Hygiène", navigate: "/radar" },
  { prefix: "g", key: "s", label: "Arbre de Traçabilité", navigate: "/spine" },
  { prefix: "g", key: "m", label: "Arbre de Relations", navigate: "/mindmap" },
  { prefix: "g", key: "t", label: "Paramètres", navigate: "/settings" },
  { prefix: "g", key: "h", label: "Aide STTNS (Playbook)", navigate: "/help" },
  { prefix: "n", key: "u", label: "Nouveau Persona", quickAction: "persona" },
  { prefix: "n", key: "p", label: "Nouveau Pain Point", quickAction: "pain_point" },
  { prefix: "n", key: "j", label: "Nouveau JTBD", quickAction: "jtbd" },
  { prefix: "n", key: "e", label: "Nouvel Epic", quickAction: "epic" },
  { prefix: "n", key: "f", label: "Nouvelle Feature", quickAction: "feature" },
  { prefix: "n", key: "s", label: "Nouvelle Story", quickAction: "story" },
] as const;

/** Fenêtre d'attente entre les deux touches d'un accord (ms). */
export const CHORD_TIMEOUT_MS = 1500;

export type ChordKeyEventLike = {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
};

/** Cible DOM à ignorer (élément de saisie ou contenteditable). */
export type ChordEventTarget = {
  tagName?: string;
  isContentEditable?: boolean;
};

/**
 * Vérifie qu'un event clavier peut initier un accord.
 * Rejette les modifieurs (Ctrl/Meta/Alt) et les cibles de saisie.
 */
export function shouldIgnoreForChord(
  event: ChordKeyEventLike,
  target: ChordEventTarget | null | undefined
): boolean {
  if (event.ctrlKey || event.metaKey || event.altKey) return true;
  if (!target) return false;
  if (target.isContentEditable) return true;
  const tag = (target.tagName ?? "").toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

/** Retourne un préfixe accord si la touche est `g` ou `n` (minuscule stricte). */
export function detectChordPrefix(key: string): ChordPrefix | null {
  if (key === "g") return "g";
  if (key === "n") return "n";
  return null;
}

/**
 * Trouve l'accord correspondant à la seconde touche, sensible à la casse
 * uniquement pour distinguer d'éventuelles collisions futures — aujourd'hui
 * la table est minuscule stricte pour éviter les erreurs Shift.
 */
export function findChord(
  prefix: ChordPrefix,
  secondKey: string
): ChordEntry | null {
  if (secondKey.length !== 1) return null;
  const lower = secondKey.toLowerCase();
  return (
    CHORD_TABLE.find((entry) => entry.prefix === prefix && entry.key === lower) ??
    null
  );
}

/** URL absolue projet à partir d'une entrée `navigate`. */
export function chordNavigateUrl(entry: ChordEntry, projectSlug: string): string | null {
  if (!entry.navigate) return null;
  const base = `/projects/${projectSlug}`;
  return `${base}${entry.navigate}`;
}

export interface KeymapGroup {
  prefix: ChordPrefix;
  title: string;
  entries: ChordEntry[];
}

/** Regroupement affichage aide keymap (`?`). */
export function groupChordsForHelp(): KeymapGroup[] {
  return [
    {
      prefix: "g",
      title: "Aller à (g + touche)",
      entries: CHORD_TABLE.filter((entry) => entry.prefix === "g"),
    },
    {
      prefix: "n",
      title: "Créer (n + touche)",
      entries: CHORD_TABLE.filter((entry) => entry.prefix === "n"),
    },
  ];
}
