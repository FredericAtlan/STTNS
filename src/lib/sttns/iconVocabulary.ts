import type { LucideIcon } from "lucide-react";
import {
  ArrowDownUp,
  AlertTriangle,
  Archive,
  BookOpen,
  Boxes,
  Briefcase,
  Calendar,
  CheckSquare,
  CircleCheck,
  Code2,
  Compass,
  FileText,
  FlaskConical,
  GalleryVertical,
  Ghost,
  Gavel,
  GitBranch,
  GitCompare,
  Hash,
  Hammer,
  HelpCircle,
  Inbox,
  KanbanSquare,
  Layers,
  LayoutDashboard,
  LayoutGrid,
  ListChecks,
  Map,
  Plus,
  Radar,
  Rocket,
  Scale,
  Search,
  Settings2,
  ShieldAlert,
  Skull,
  Tag,
  Table2,
  Target,
  TestTube2,
  UserCircle,
  Users,
  XCircle,
  type LucideProps,
} from "lucide-react";

export type IconVocabEntry = {
  icon: LucideIcon;
  label: string;
  /** Sous-titre optionnel pour tooltips phases */
  hint?: string;
};

/** Regroupements sidebar — navigation orientée métier */
export const PHASE_VOCAB: Record<string, IconVocabEntry> = {
  productSpace: {
    icon: Target,
    label: "Espace Produit",
  },
  deliverySpace: {
    icon: Rocket,
    label: "Espace Delivery",
  },
  controlCenter: {
    icon: ShieldAlert,
    label: "Centre de Contrôle",
  },
  helpSpace: {
    icon: HelpCircle,
    label: "Aide STTNS",
    hint: "Playbook — Scoring V/E, parcours outil, framework, application projet.",
  },
  phase1: {
    icon: Compass,
    label: "Init",
  },
  phase2: {
    icon: Search,
    label: "Produit",
  },
  phase3: {
    icon: Rocket,
    label: "Exécution",
  },
};

export const NAV_VOCAB: Record<string, IconVocabEntry> = {
  summary: { icon: LayoutDashboard, label: "Vue d'ensemble" },
  team: { icon: Users, label: "Équipe & rôles" },
  nsm: { icon: Target, label: "North Star Metric" },
  brainstorming: { icon: Inbox, label: "Brainstorming" },
  personas: { icon: UserCircle, label: "Personas" },
  whySpine: { icon: Briefcase, label: "Pourquoi" },
  epics: { icon: GalleryVertical, label: "Epics" },
  portfolioSpine: { icon: LayoutGrid, label: "Portfolio" },
  userStories: { icon: BookOpen, label: "User stories" },
  modules: { icon: Layers, label: "Modules techniques" },
  features: { icon: Layers, label: "Features" },
  newFeature: { icon: Plus, label: "Nouvelle feature" },
  agile: { icon: Rocket, label: "Kanban" },
  kanbanSpine: { icon: KanbanSquare, label: "Kanban" },
  radarSpine: { icon: Radar, label: "Radar" },
  needsMatrix: { icon: Briefcase, label: "Matrice Besoins" },
  discoveryMatrix: {
    icon: Table2,
    label: "Brouillons Epic→Feature→Story",
    hint: "Tableau de réunion — brouillons Epic/Feature/Story (démarrage ou ajouts), Créer au Spine → todo.",
  },
  portfolioStrategic: { icon: LayoutGrid, label: "Epics/Features" },
  kanbanBoard: { icon: KanbanSquare, label: "Exécution Kanban" },
  storyBacklog: { icon: BookOpen, label: "Stories Backlogs" },
  cyclesSprints: { icon: Calendar, label: "Cycles" },
  projectSettings: { icon: Settings2, label: "Paramètres" },
  hygieneRadar: { icon: Radar, label: "Radar d'Hygiène" },
  importExport: {
    icon: ArrowDownUp,
    label: "Import / Export",
    hint: "Hub Spine v2 — packs ZIP par objet (UUID, liaisons JTBD).",
  },
  spineTree: { icon: GitBranch, label: "Arbre de Traçabilité" },
  mindMap: { icon: Map, label: "Arbre de Relations" },
  postMortem: { icon: Skull, label: "Post-Mortem" },
  allProjects: { icon: LayoutDashboard, label: "Tous les projets" },
  newProject: { icon: Plus, label: "Nouveau projet" },
  framework: { icon: Compass, label: "Framework STTNS" },
  help: {
    icon: HelpCircle,
    label: "Playbook",
    hint: "Playbook d'entreprise — Scoring V/E, parcours, framework, application.",
  },
  workspace: { icon: GitCompare, label: "Workspace" },
  archived: { icon: Archive, label: "Archivés" },
  registry: { icon: ListChecks, label: "Registre" },
  arbitrage: { icon: Scale, label: "Control Room" },
  roadmap: { icon: Map, label: "Roadmap" },
};

export const KPI_VOCAB = {
  personaCount: { icon: UserCircle, label: "Personas" },
  personaTiers: {
    icon: Tag,
    label: "Segments",
    hint: "Segment métier T1–T4 (priorité ou type de client).",
  },
  personaPain: {
    icon: AlertTriangle,
    label: "Frictions",
    hint: "Points de douleur (pain points) identifiés pour ce persona.",
  },
  personaJobs: {
    icon: Briefcase,
    label: "Jobs",
    hint: "Jobs-to-be-done rattachés au persona.",
  },
  personaMatrixHealth: { icon: CircleCheck, label: "Matrice saine" },
  storyCount: { icon: BookOpen, label: "Stories" },
  backlogStoryTotal: { icon: BookOpen, label: "Total Stories" },
  backlogEffortTotal: { icon: Target, label: "Effort actif" },
  backlogOrphans: { icon: AlertTriangle, label: "Orphelines" },
  backlogUnestimated: { icon: Hash, label: "Non chiffrées" },
  storyActions: { icon: CircleCheck, label: "Avec actions" },
  storyPersonas: { icon: Users, label: "Personas liés" },
  storyImpact: { icon: Target, label: "Impact rédigé" },
  agileQueue: { icon: ListChecks, label: "File active" },
  agileSprint: { icon: Rocket, label: "Sprint" },
  agileDeployed: { icon: CircleCheck, label: "Déployées" },
  agileEpicsDone: { icon: GalleryVertical, label: "Epics terminées" },
  sttnsScore: {
    icon: Scale,
    label: "Valeur / Effort",
    hint: "Priorisation Spine V/E (Impact ÷ Jours). Ancien RICE / Score STTNS déprécié v1.4+.",
  },
  featureEpic: { icon: GalleryVertical, label: "Epic" },
  featureMetric: { icon: Target, label: "Métrique d'impact" },
  featurePersona: { icon: UserCircle, label: "Persona" },
  epicCount: { icon: GalleryVertical, label: "Epics" },
  epicInProgress: { icon: Rocket, label: "En cours" },
  epicStories: { icon: BookOpen, label: "Stories liées" },
  epicNoPersona: { icon: UserCircle, label: "Sans persona" },
  epicGhost: { icon: Ghost, label: "Epics fantômes" },
  summaryCeo: { icon: Gavel, label: "Décision CEO" },
  summaryCommittee: { icon: Users, label: "Comité ouvert" },
  summaryBuild: { icon: CircleCheck, label: "BUILD actés" },
  summaryExecution: { icon: Rocket, label: "En cours" },
  summaryKill: { icon: XCircle, label: "Kill rate" },
  featureCount: { icon: Layers, label: "Features" },
  featureBuild: { icon: CircleCheck, label: "BUILD" },
  featureReview: { icon: Users, label: "Comité" },
  featureNoSpecs: { icon: Code2, label: "Sans specs" },
} satisfies Record<string, IconVocabEntry>;

export type KpiVocabKey = keyof typeof KPI_VOCAB;

export const STATUS_VOCAB: Record<string, IconVocabEntry> = {
  build: { icon: Hammer, label: "BUILD" },
  kill: { icon: XCircle, label: "KILL" },
  learn: { icon: FlaskConical, label: "LEARN" },
  ceo: { icon: Gavel, label: "Décision CEO" },
  committee: { icon: Users, label: "Comité" },
  dev: { icon: Code2, label: "En développement" },
  test: { icon: TestTube2, label: "En test" },
  deployed: { icon: CircleCheck, label: "Déployé" },
};

export function phaseTooltip(entry: IconVocabEntry): string {
  return entry.hint ? `${entry.label} · ${entry.hint}` : entry.label;
}

/** En-têtes de colonnes des tableaux catalogue — libellé court + description au survol. */
export const TABLE_COLUMN_VOCAB = {
  epicTitle: {
    icon: GalleryVertical,
    label: "Epic",
    hint: "Nom, objectif stratégique et accès à la fiche epic.",
  },
  epicDor: {
    icon: CheckSquare,
    label: "DoR",
    hint: "Definition of Ready : définition renseignée et au moins une story rattachée.",
  },
  epicPersonas: {
    icon: UserCircle,
    label: "Personas",
    hint: "Personas hérités des user stories rattachées à l'epic.",
  },
  epicImpact: {
    icon: Target,
    label: "Impact",
    hint: "Métrique d'impact dominante héritée des stories.",
  },
  epicStatus: {
    icon: Rocket,
    label: "Statut",
    hint: "Cycle de vie de l'epic (brouillon, en cours, terminée…).",
  },
  epicStories: {
    icon: BookOpen,
    label: "Stories",
    hint: "Avancement des stories validées par rapport au total rattaché.",
  },
  epicFeatures: {
    icon: Boxes,
    label: "Features",
    hint: "Initiatives rattachées, groupées V1 MVP (bleu) et V2 Scale (orange), avec gouvernance.",
  },
  personaRef: {
    icon: Hash,
    label: "Réf.",
    hint: "Code court unique du persona dans le projet.",
  },
  personaScope: {
    icon: Tag,
    label: "Scope",
    hint: "Cast actif ou inactif dans la matrice du projet.",
  },
  personaName: {
    icon: UserCircle,
    label: "Nom",
    hint: "Identité du persona et statut dans la matrice (actif / inactif).",
  },
  personaSummary: {
    icon: FileText,
    label: "Résumé",
    hint: "Synthèse du profil en une phrase.",
  },
  personaHealth: {
    icon: ShieldAlert,
    label: "Santé",
    hint: "Cohérence matrice PP ↔ JTBD : frictions et jobs couverts.",
  },
  storyHealth: {
    icon: Target,
    label: "DoR",
    hint: "DoR Spine : feature parente + effort (jours) + Risque (1–3) = prête pour le Kanban.",
  },
  storyTitle: {
    icon: BookOpen,
    label: "Story",
    hint: "Titre, contexte et fil de valeur de la user story.",
  },
  storyEpic: {
    icon: GalleryVertical,
    label: "Epic",
    hint: "Epic parente ; une alerte signale les stories orphelines.",
  },
  storyPersonaJtbd: {
    icon: UserCircle,
    label: "Persona & JTBD",
    hint: "Persona primaire et job-to-be-done adressé par la story.",
  },
  storyImpact: {
    icon: Target,
    label: "Métrique d'impact",
    hint: "Indicateur de succès attendu pour valider la story.",
  },
  storyStatus: {
    icon: GalleryVertical,
    label: "Livraison",
    hint: "Statut backlog : proposée, validée, en sprint ou livrée.",
  },
  featureTitle: {
    icon: Layers,
    label: "Feature",
    hint: "Code et nom de l'initiative produit.",
  },
  featureEpic: {
    icon: GalleryVertical,
    label: "Epic",
    hint: "Epic stratégique porteuse de la feature.",
  },
  featurePersona: {
    icon: UserCircle,
    label: "Persona",
    hint: "Persona principal ciblé par la feature.",
  },
  featureScore: {
    icon: Scale,
    label: "Valeur / Effort",
    hint: "Priorisation Spine : Impact Feature (0–3) et roll-up jours. Epic = ratio V/E calculé.",
  },
  featureKano: {
    icon: Scale,
    label: "Kano",
    hint: "Typologie Kano : must-have, performance, attractive…",
  },
  featureSpecs: {
    icon: Code2,
    label: "Specs",
    hint: "Présence d'une spécification technique rédigée.",
  },
  featureGovernance: {
    icon: Gavel,
    label: "Gouvernance",
    hint: "Décision comité : BUILD, Comité, LEARN ou KILL.",
  },
  featureExecution: {
    icon: Rocket,
    label: "Exécution",
    hint: "Statut de développement : attente, en cours, test ou déployé.",
  },
  actions: {
    icon: Settings2,
    label: "Actions",
    hint: "Renommer, supprimer ou ouvrir la fiche détail.",
  },
} satisfies Record<string, IconVocabEntry>;

export function tableColumnTooltip(entry: IconVocabEntry): string {
  return entry.hint ?? entry.label;
}

export function iconSizeClass(size: "xs" | "sm" | "md" = "sm"): string {
  return size === "xs" ? "h-3.5 w-3.5" : size === "md" ? "h-5 w-5" : "h-4 w-4";
}

/** Types d'objets Spine — icônes canoniques dans toute l'application. */
export type SpineObjectKind =
  | "persona"
  | "pain_point"
  | "jtbd"
  | "epic"
  | "feature"
  | "story"
  | "task"
  | "cycle";

export type SpineObjectVocabEntry = IconVocabEntry & {
  toneClass: string;
};

export const SPINE_OBJECT_VOCAB: Record<SpineObjectKind, SpineObjectVocabEntry> = {
  persona: { icon: UserCircle, label: "Persona", toneClass: "text-indigo-500" },
  /** Pas d'amber/orange — réservés au token warning (R:3). */
  pain_point: { icon: AlertTriangle, label: "Pain Point", toneClass: "text-fuchsia-600" },
  jtbd: { icon: Briefcase, label: "JTBD", toneClass: "text-sky-600" },
  epic: { icon: GalleryVertical, label: "Epic", toneClass: "text-violet-600" },
  /** Teal désaturé — emerald réservé au primary / success. */
  feature: { icon: Layers, label: "Feature", toneClass: "text-teal-600" },
  /** Cyan — pas d'orange (conflit warning). */
  story: { icon: BookOpen, label: "User Story", toneClass: "text-cyan-600" },
  task: { icon: CheckSquare, label: "Task", toneClass: "text-zinc-500" },
  cycle: { icon: Calendar, label: "Cycle", toneClass: "text-blue-600" },
};

const SPINE_OBJECT_ALIASES: Record<string, SpineObjectKind> = {
  job: "jtbd",
  user_story: "story",
  initiative: "feature",
  painpoint: "pain_point",
};

/** Résout un type DB vers le kind Spine canonique. */
export function normalizeSpineObjectKind(type: string): SpineObjectKind | null {
  if (type in SPINE_OBJECT_VOCAB) return type as SpineObjectKind;
  return SPINE_OBJECT_ALIASES[type] ?? null;
}

export function spineObjectEntry(type: string): SpineObjectVocabEntry | null {
  const kind = normalizeSpineObjectKind(type);
  return kind ? SPINE_OBJECT_VOCAB[kind] : null;
}

export type { LucideProps };
