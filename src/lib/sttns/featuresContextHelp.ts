/**
 * Textes d'aide — hub Features legacy (registre, Control Room).
 * Scoring actif Spine (v1.4+) : Valeur/Effort — voir `/portfolio`, forms Feature/Story.
 * Les vues RICE/Kano ci-dessous sont des surfaces de transition (dépréciées).
 * Import préféré : `@/lib/sttns/sttnsContext`.
 */
import type { SttnsContextHelpContent } from "@/lib/sttns/contextHelp";
import { COMMITTEE_SUBMIT_TOOLTIP } from "@/lib/sttns/initiativeCommitteeReady";

const LEGACY_RICE_NOTE =
  " [Legacy] Scoring actif = Valeur/Effort Spine (Impact Feature 0–3, Effort/Risque Stories, ratio Epic).";

export const FEATURES_HUB_HELP = {
  registry: {
    kind: "guide",
    title: "Registre des initiatives",
    body:
      "Liste legacy des dossiers feature. Pour le scoring Produit/Tech, utilisez Epics/Features (Impact) et Stories (jours + Risque)." +
      LEGACY_RICE_NOTE,
  },
  arbitrage: {
    kind: "guide",
    title: "Control Room — arbitrage",
    body:
      "Kanban gouvernance (BUILD / LEARN / KILL). La matrice associée est un outil legacy ; la priorisation opérationnelle se lit sur le Portfolio V/E et l'Arbre." +
      LEGACY_RICE_NOTE,
  },
  roadmap: {
    kind: "guide",
    title: "Roadmap stratégique",
    body: "Placement des features par Epic et typologie V1 MVP / V2 Scale. Pills BUILD et LEARN, traçabilité Git. Création contextualisée depuis les cellules vides.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;

export const FEATURES_WORKSPACE_HELP = {
  registryFilters: {
    kind: "definition",
    title: "Filtres registre",
    body: "Affinez par workflow, bucket gouvernance, auteur et période. Le compteur reflète le jeu filtré, pas le total projet.",
  },
  registryTable: {
    kind: "guide",
    title: "Vue registre",
    body: "Table paginée pour la saisie et la revue PM. Cliquez une ligne pour ouvrir le dossier. Export CSV via le menu en-tête.",
  },
  controlRoomFilters: {
    kind: "definition",
    title: "Filtres Control Room",
    body: "Recherche, statut workflow, bucket gouvernance et persona — le kanban et la matrice reflètent le jeu filtré.",
  },
  controlRoomKanban: {
    kind: "guide",
    title: "Kanban gouvernance",
    body: "Pipeline Brouillon → Comité → Validation CEO → BUILD · LEARN · KILL. Glissez une carte vers BUILD / LEARN / KILL pour voter (comité) ou confirmer (CEO).",
  },
  controlRoomMatrix: {
    kind: "definition",
    title: "Matrice de priorisation (legacy)",
    body:
      "Vues God View / RICE / Kano — transition uniquement." +
      LEGACY_RICE_NOTE +
      " Préférez Epics/Features (colonnes Valeur | Effort | Ratio).",
  },
  controlRoomLink: {
    kind: "regle",
    title: "Survol Kanban ↔ matrice",
    body: "Survoler une carte ou une bulle met en surbrillance la feature correspondante dans l'autre vue.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;

export const MATRIX_VIEW_HELP = {
  godView: {
    kind: "guide",
    title: "God View — synthèse (legacy)",
    body:
      "Vue legacy Impact × Effort. Scoring actif Spine : Impact Feature (0–3) et jours Stories ; Epic = ratio V/E." +
      LEGACY_RICE_NOTE,
  },
  kano: {
    kind: "guide",
    title: "Matrice Kano",
    body: "Positionnement qualitatif projeté : satisfaction client (vertical) × maturité fonctionnelle (horizontal). Compare les attractive vs must-be.",
  },
  rice: {
    kind: "guide",
    title: "Scatter RICE (legacy)",
    body:
      "Ancien scatter Impact vs Effort (1–10)." +
      LEGACY_RICE_NOTE,
  },
  axisImpact: {
    kind: "definition",
    title: "Axe Impact (legacy)",
    body:
      "Sur Spine : Impact Feature 0 (Gaspillage) · 1 Moyen · 2 Fort · 3 Vital. Hard block si Impact 0." +
      LEGACY_RICE_NOTE,
  },
  axisEffort: {
    kind: "definition",
    title: "Axe Effort (legacy)",
    body:
      "Sur Spine : Effort = jours (0.5–5) saisis sur les Stories (ou Feature Shape Up sans stories)." +
      LEGACY_RICE_NOTE,
  },
  axisSatisfaction: {
    kind: "definition",
    title: "Satisfaction client",
    body: "Niveau de satisfaction projeté après livraison (Delighted → Dissatisfied). Renseigné dans l'arbitrage Kano du dossier.",
  },
  axisFunctionality: {
    kind: "definition",
    title: "Fonctionnalité",
    body: "Maturité fonctionnelle prévue (None → Best). Croisée avec le type Kano pour le positionnement stratégique.",
  },
  quadrantQuickWins: {
    kind: "reference",
    title: "Gains rapides",
    body: "Fort impact, faible effort — candidats prioritaires (équivalent Spine : Impact élevé / peu de jours).",
  },
  quadrantStrategic: {
    kind: "reference",
    title: "Stratégique",
    body: "Fort impact, effort élevé — investissements structurants à planifier.",
  },
  quadrantFillIns: {
    kind: "reference",
    title: "Secondaires",
    body: "Impact modéré, effort faible — à traiter si capacité disponible.",
  },
  quadrantMoneyPits: {
    kind: "reference",
    title: "Évitables",
    body: "Faible impact, effort élevé — à challenger (Impact 0 = Gaspillage bloqué).",
  },
  legendKanoColor: {
    kind: "definition",
    title: "Couleur Kano",
    body: "Must-be = attente de base ; Performance = plus c'est bon, plus les clients sont satisfaits ; Attractive = différenciant surprise.",
  },
  legendGovernanceColor: {
    kind: "definition",
    title: "Couleur gouvernance",
    body: "Reflet du bucket comité : brouillon, en revue, BUILD acté, LEARN ou KILL.",
  },
  legendGodViewSize: {
    kind: "definition",
    title: "Taille Score STTNS (legacy)",
    body:
      "Sur Spine, comparez plutôt le ratio V/E Epic et l'Impact Feature. Affichage legacy normalisé 0–100." +
      LEGACY_RICE_NOTE,
  },
} as const satisfies Record<string, SttnsContextHelpContent>;

export const FEATURE_DETAIL_HELP = {
  sttnsScore: {
    kind: "definition",
    title: "Valeur / Effort (Spine)",
    body:
      "Modèle actif v1.4+ :\n" +
      "• Feature : Impact 0–3 (Produit)\n" +
      "• Stories : Effort jours 0.5–5 + Risque 1–3 (Tech)\n" +
      "• Epic : ∑Impact ÷ ∑Jours (calculé, zéro saisie)\n" +
      "• Impact 0 = hard block in_progress\n\n" +
      "L'ancien score RICE (Reach×Impact×Confiance)/Effort est déprécié — ne plus l'utiliser pour prioriser.",
  },
  epic: {
    kind: "definition",
    title: "Epic rattachée",
    body: "Conteneur macro obligatoire. Le ratio V/E de l'Epic est calculé depuis ses Features — aucune saisie manuelle de score sur l'Epic.",
  },
  metric: {
    kind: "definition",
    title: "Métrique d'impact",
    body: "KPI projet ou lien North Star prouvant l'alignement stratégique du dossier.",
  },
  persona: {
    kind: "definition",
    title: "Persona cible",
    body: "Utilisateur principal — via le JTBD lié (Matrice Besoins).",
  },
  execution: {
    kind: "guide",
    title: "Exécution tech",
    body: "Stories Kanban / Cycles : Effort et Risque sur chaque Story. Shape Up : Effort/Risque provisoires sur la Feature tant qu'il n'y a pas de Stories.",
  },
  committee: {
    kind: "regle",
    title: "Check-list comité",
    body:
      "DoR Spine : Epic, JTBD, Impact Feature renseigné, Stories estimées (jours + Risque) ou Feature Shape Up complète.",
  },
  committeeSubmit: {
    kind: "alerte",
    title: "Soumission comité",
    body: COMMITTEE_SUBMIT_TOOLTIP,
  },
  peerReview: {
    kind: "guide",
    title: "Avis du comité",
    body: "CEO, CTO et expert votent BUILD, LEARN ou KILL. Si le mode gouvernance l'exige, le CEO confirme une seconde fois après unanimité.",
  },
  specs: {
    kind: "guide",
    title: "Spécifications techniques",
    body: "Architecture, flux et diagrammes Mermaid — aident à calibrer Effort (jours) et Risque des Stories.",
  },
  linkedStory: {
    kind: "statut",
    title: "User story liée",
    body: "Story avec Effort + Risque. Statut visible ici ; édition sur la fiche story ou le backlog.",
  },
  reopenRevision: {
    kind: "guide",
    title: "Nouveau cycle comité",
    body: "Après validation CEO ou KILL, l'auteur peut rouvrir en brouillon, modifier le dossier et resoumettre au comité.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;

export const INITIATIVE_FORM_HELP = {
  riceAxes: {
    kind: "guide",
    title: "Axes legacy RICE (déprécié)",
    body:
      "Ne plus saisir Reach/Impact/Confiance/Effort RICE pour prioriser." +
      LEGACY_RICE_NOTE +
      "\n\nUtilisez Impact Feature (0–3) et Effort/Risque Stories.",
  },
  sttnsScore: FEATURE_DETAIL_HELP.sttnsScore,
} as const satisfies Record<string, SttnsContextHelpContent>;

export const PEER_REVIEW_HELP = {
  initiative: FEATURE_DETAIL_HELP.peerReview,
  persona: {
    kind: "guide",
    title: "Validation persona (#1)",
    body: "Comité BUILD / LEARN / KILL sur le dossier PP + JTBD. Unanimité ou validation CEO selon les paramètres projet.",
  },
  user_story: {
    kind: "guide",
    title: "Validation user story (#2)",
    body: "Comité BUILD / LEARN / KILL — unanimité ou validation CEO. Story estimée (jours + Risque) recommandée.",
  },
  epic: {
    kind: "guide",
    title: "Validation epic (#3)",
    body: "Comité sur le conteneur macro. Priorisation = ratio V/E calculé depuis les Features.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;

export const MODULES_PAGE_HELP = {
  kind: "guide",
  title: "Modules techniques",
  body: "Découpage implémentation par module. Priorisation V/E dans Epics/Features ; exécution dans le Kanban.",
} as const satisfies SttnsContextHelpContent;

export const EPICS_PAGE_HELP = {
  kind: "guide",
  title: "Epics métier",
  body:
    "Conteneurs Portfolio — zéro saisie V/E. Indicateurs : ∑ Impact Features, ∑ Jours, ratio V/E. Détail sur Epics/Features et l'Arbre.",
} as const satisfies SttnsContextHelpContent;

export const SUMMARY_ALERTS_HELP = {
  kind: "guide",
  title: "Alertes & pilotage",
  body: "Indicateurs actionnables. Cliquez une tuile pour ouvrir Epics/Features, le Radar ou le Kanban.",
} as const satisfies SttnsContextHelpContent;

export const ROADMAP_MATRIX_HELP = {
  filters: {
    kind: "definition",
    title: "Filtres roadmap",
    body: "Masquez brouillons ou KILL pour focaliser la planification release. Compteurs en en-tête = jeu filtré.",
  },
  grid: {
    kind: "guide",
    title: "Grille Epic × version",
    body: "Chaque cellule regroupe les features BUILD ou LEARN par typologie V1 MVP / V2 Scale. Survol d'une pill pour le détail.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;
