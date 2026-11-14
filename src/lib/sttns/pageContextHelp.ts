/**
 * Textes d'aide par page / écran (legacy NSM, framework, brainstorming…).
 * Import préféré : `PAGE_CONTEXT_HELP` depuis `@/lib/sttns/sttnsContext`.
 * Cartographie : README.md § Cartographie des fichiers de contexte
 */
import type { SttnsContextHelpContent } from "@/lib/sttns/contextHelp";

export const PAGE_CONTEXT_HELP = {
  team: {
    kind: "guide",
    title: "Équipe & rôles",
    body: "Membres du comité, invitations, rôles PM / expert / dev et réglages gouvernance (auto-act, délégation CEO). Unanimité requise — le CEO ou délégué tranche.",
  },
  nsm: {
    kind: "reference",
    title: "North Star Metric",
    body: "Boussole produit (Filtre 1) : NSM et métriques d'impact hiérarchiques. Les ronds sur chaque carte indiquent le nombre d'epics et de user stories validées qui couvrent la métrique (remontée parent incluse). Cliquez pour le détail.",
    href: "/framework",
    hrefLabel: "Framework STTNS",
  },
  nsmCoverageEpic: {
    kind: "definition",
    title: "Epics couvrantes",
    body: "Epics ayant au moins une user story validée (ou en sprint / livrée) qui impacte cette métrique, directement ou via une sous-métrique.",
  },
  nsmCoverageStory: {
    kind: "definition",
    title: "Stories couvrantes",
    body: "User stories validées, en sprint ou livrées, rattachées à cette métrique. Les stories sans epic comptent ici mais pas dans le compteur epic.",
  },
  nsmKpiTreeCoverage: {
    kind: "definition",
    title: "Couverture arbre métrique",
    body: "Calcul : % de nœuds (NSM + chaque métrique L2 et L3) ayant au moins une user story validée, en sprint ou livrée.\n\nSignification : Mesure globale de l'empreinte du backlog sur les objectifs business. (Remontée parent incluse : une story sur une feuille couvre aussi ses ancêtres).\n\nDiagnostic : Une couverture faible indique que la roadmap est trop concentrée sur une seule dimension de croissance.",
  },
  nsmKpiNsmAlignment: {
    kind: "definition",
    title: "Alignement NSM",
    body: "Calcul : Nb d'Epics (E) et de Stories (U) qui touchent DIRECTEMENT la North Star (impacts_north_star).\n\nSignification : Indicateur de traction directe sur la boussole produit reine.\n\nDiagnostic : Si ce chiffre est à 0, le projet fait de l'optimisation périphérique (efficience, etc.) mais ne touche pas au cœur de la valeur.",
  },
  nsmKpiOrphanMetrics: {
    kind: "alerte",
    title: "Métriques orphelines",
    body: "Calcul : Nombre de nœuds de l'arbre NSM sans aucune story validée couvrante.\n\nSignification : Signale un pilier d'impact totalement ignoré par le backlog produit.\n\nDiagnostic : Soit c'est un choix assumé pour ce trimestre, soit c'est un angle mort stratégique à corriger d'urgence.",
  },
  nsmKpiAlignedStories: {
    kind: "definition",
    title: "Stories alignées",
    body: "Calcul : Ratio des stories validées rattachées à au moins une métrique vs toutes les stories éligibles du projet.\n\nSignification : Mesure la discipline de l'équipe à justifier chaque développement par un impact métier.\n\nDiagnostic : Un ratio < 100% révèle des features techniques ou des lubies non justifiées.",
  },
  personas: {
    kind: "guide",
    title: "Catalogue personas",
    body: "Profils cibles, frictions et jobs to be done. Chaque persona doit être lisible en une seconde.",
  },
  userStories: {
    kind: "guide",
    title: "User stories",
    body:
      "Unité d'exécution technique : Effort (0.5–5j) + Risque (1–3, R:3 = alerte POC). " +
      "La Valeur (Impact) est saisie sur la Feature parente.",
  },
  brainstorming: {
    kind: "guide",
    title: "Inbox brainstorming",
    body: "Capture d'idées brutes avant structuration en epics, stories ou features. Brouillon privé ou partage équipe ; assignation projet optionnelle.",
  },
  framework: {
    kind: "reference",
    title: "Framework STTNS",
    body:
      "Playbook Aide STTNS : Scoring Valeur / Effort (ground truth), parcours outil, framework stratégique, application projet. " +
      "RICE déprécié. Entrée sidebar : Aide STTNS.",
    hrefLabel: "Ouvrir le Playbook",
  },
  valueEffortScoring: {
    kind: "reference",
    title: "Architecture Valeur / Effort",
    body:
      "Story = Jours 0.5–5 + Risque R:1–3. Feature = Impact 0–3 + JTBD ; Effort = ∑ Stories ou Shape Up. " +
      "Epic = ∑I / ∑j (zéro saisie). Impact 0 = hard block in_progress. Détail complet dans le Playbook Aide.",
    hrefLabel: "Guide Scoring V/E",
  },
  discovery: {
    kind: "guide",
    title: "Brouillons Epic→Feature→Story",
    body:
      "Tableau de réunion pour créer des brouillons d’objets Spine (Epic · Feature · Story) — au démarrage du projet, ou pour en ajouter ensuite. " +
      "On cadre ensemble ; **Créer au Spine** enregistre les lignes sélectionnées en todo. **Revenir en brouillon** archive le Spine (uniquement si tout est encore todo **et** sans cycle engagé) et déverrouille la ligne.\n\n" +
      "Vues : **Tableau** (saisie) · **Carte** (arbre Epic→Feature→Story) · **Mind Map** (canvas). Collision titre ↔ Spine = surlignage orange.\n\n" +
      "Session navigateur ; badge Sync (local / non sauvé / sync) + **Sauvegarder** toujours visibles ; menu Session pour fichier JSON, dupliquer, gérer. " +
      "Tab entre cellules · j/k entre lignes.\n\n" +
      "Parent [Session] — le parent n’est pas encore dans le Spine : on affiche le titre du brouillon, mis à jour en direct pendant la réunion.\n\n" +
      "Feature — saisissez toujours le JTBD et l’Impact. Sans Story enfant, vous pouvez encore poser Effort et Risque (enveloppe Shape Up). Dès qu’une Story existe, Effort et Risque Feature deviennent un total automatique — affichage seulement, non enregistré à la création Spine.\n\n" +
      "Epic — les badges Impact, Jours et ratio V/E sont calculés depuis les lignes de cette session — aucune saisie manuelle sur l’Epic.\n\n" +
      "Créer au Spine — enregistre en todo. Si la Feature a déjà des Stories, l’enveloppe Effort / Risque Feature n’est pas envoyée : le roll-up Spine (schéma Zod) fait foi.",
    href: "/help/parcours",
    hrefLabel: "Parcours outil",
  },
  why: {
    kind: "guide",
    title: "Matrice Besoins (Why)",
    body:
      "Doctrine Shape Up — fondation avant Appetite :\n" +
      "• Persona : qui souffre ?\n" +
      "• Pain Point : quelle friction ?\n" +
      "• JTBD : quel job résoudre ?\n\n" +
      "Création en statut todo uniquement. Les Features se rattachent ensuite à un JTBD " +
      "(context_links). Export / import ZIP (personas · pain_points · jtbd) via les icônes " +
      "de la barre d’outils. Le cadrage Effort/Risque Feature se fait dans le Tableau de brouillons " +
      "(Shape Up ou roll-up Stories) — ici on ancre uniquement le besoin.\n\n" +
      "Édition via Slide-over unifié ; fermeture = retour à la matrice.",
    href: "/help/framework",
    hrefLabel: "Framework STTNS (Manifeste)",
  },
  portfolio: {
    kind: "guide",
    title: "Portfolio Epics/Features",
    body:
      "Arbre par Epic · colonnes Valeur (Impact / ∑I), Effort (jours), Ratio V/E. " +
      "Clic titre → Inspecteur Structure. Scoring détaillé dans Aide STTNS.",
    hrefLabel: "Guide Scoring V/E",
  },
  cycles: {
    kind: "guide",
    title: "Cycles",
    body:
      "Itérations d'exécution (sprints). Assignez stories ou features selon le mode projet. " +
      "Capacité en jours · cycle actif pour le backlog / Kanban.",
    href: "/help/parcours",
    hrefLabel: "Parcours outil",
  },
  spine: {
    kind: "guide",
    title: "Arbre de Traçabilité",
    body:
      "Vue hiérarchique Spine sous trois angles — Stratégie (Persona→JTBD), Produit (Epic→Story), " +
      "Exécution (cycles). Édition via slide-over ; soft-delete archivé.",
    href: "/help/framework",
    hrefLabel: "Framework STTNS",
  },
  mindmap: {
    kind: "guide",
    title: "Arbre de Relations",
    body:
      "Mind map interactive des liens Spine. Dépliage, assignations, liens Doc — " +
      "même source que l'Arbre de Traçabilité.",
    href: "/help/framework",
    hrefLabel: "Framework STTNS",
  },
  trace: {
    kind: "guide",
    title: "Graphe de Dépendances",
    body:
      "Vue filtrée JTBD ↔ Feature — pont Matrice Besoins × Portfolio. " +
      "Repère les Features orphelines et les JTBD sans Feature liée.",
    href: "/help/framework",
    hrefLabel: "Framework STTNS",
  },
  kanban: {
    kind: "guide",
    title: "Exécution Kanban",
    body:
      "Board WIP (todo → in_progress → review → done). Mode Stories ou Features selon " +
      "executionUnit. Limite WIP configurable dans Paramètres.",
    href: "/help/parcours",
    hrefLabel: "Parcours outil",
  },
  radar: {
    kind: "guide",
    title: "Radar d'Hygiène",
    body:
      "Tour de contrôle : Features sans JTBD, JTBD fantômes, stagnants, gaspillage Impact 0, " +
      "tâches sans Notion. Liens directs vers Matrice Besoins / Portfolio.",
    href: "/help/parcours",
    hrefLabel: "Parcours outil",
  },
  settings: {
    kind: "guide",
    title: "Paramètres du projet",
    body:
      "Gouvernance Squad (CEO Admin), workflow (executionUnit, WIP), équipe, archives. " +
      "Consultation selon votre rôle.",
  },
  importExport: {
    kind: "guide",
    title: "Import / Export Spine",
    body:
      "Hub central des archives ZIP v2 : choisissez les objets (Why, Discovery, cycles, epics, features, stories, tasks). " +
      "Les liaisons reposent sur des UUID — renommer un titre ne casse pas les liens. " +
      "Exports ciblés restent sur Matrice Besoins et Discovery.",
    href: "/help/parcours",
    hrefLabel: "Parcours outil",
  },
  featuresList: {
    kind: "guide",
    title: "Features",
    body:
      "Liste plate des Features Spine (pont Epic ↔ JTBD). Préférez Portfolio pour l'arbre " +
      "et le Tableau de brouillons pour créer / cadrer en réunion avant Portfolio.",
    href: "/help/scoring",
    hrefLabel: "Guide Scoring V/E",
  },
  newFeature: {
    kind: "guide",
    title: "Nouvelle feature",
    body:
      "Pont Epic ↔ JTBD. Saisie Produit : Impact 0–3 (0 = Gaspillage, hard block). " +
      "Sans Stories : Shape Up — Effort + Risque provisoires sur la Feature. Sinon roll-up depuis les Stories.",
  },
  featureDetail: {
    kind: "guide",
    title: "Inspecteur Feature",
    body:
      "Stories rattachées, Impact Produit et roll-up Effort/Risque — même panneau que l'Arbre. " +
      "JTBD lié obligatoire (Constitution Spine).",
    href: "/help/scoring",
    hrefLabel: "Guide Scoring V/E",
  },
  userStoryDetail: {
    kind: "guide",
    title: "Fiche user story",
    body:
      "Domaine Tech : jours d'effort (plafond 5j) et Risque (R:1 Connu · R:2 Probable · R:3 Inconnu). " +
      "Feature parente obligatoire. Impact 0 sur la Feature bloque le passage in_progress.",
  },
  userStoryNew: {
    kind: "guide",
    title: "Nouvelle user story",
    body:
      "Rattachez une Feature, puis estimez Effort (jours) et Risque (1–3). " +
      "Découpez si > 5j. R:3 → envisagez un Spike avant engagement.",
  },
  epicDetail: {
    kind: "guide",
    title: "Fiche epic",
    body:
      "Conteneur macro Portfolio — zéro saisie Valeur/Effort. " +
      "Indicateurs calculés : ∑ Impact Features, ∑ Jours, ratio V/E.",
  },
  epicNew: {
    kind: "guide",
    title: "Nouvelle epic",
    body:
      "Vision stratégique uniquement (titre, description). " +
      "La priorisation vient du roll-up Features (Impact) et Stories (jours) — aucune saisie manuelle de score.",
  },
  summaryValueChain: {
    kind: "guide",
    title: "Cartographie valeur",
    body: "Chaîne Persona → PP → JTBD → User Story → Epic → Feature → Impact. Les KPI portent sur le casting actif ; le graphe peut filtrer les personas actifs et surligne les orphelins en pointillés rose.",
  },
  summaryValueChainHealth: {
    kind: "definition",
    title: "Value Chain Health",
    body: "Calcul : % de User Stories avec une Definition of Ready (DoR) parfaite.\n\nSignification : Connecte la réalité terrain (Persona + JTBD) à la stratégie (Epic + Impact).\n\nDiagnostic : Si < 100%, une partie du backlog est hors-sol (risque de développer sans répondre à un besoin).",
  },
  summaryValueChainOrphans: {
    kind: "alerte",
    title: "Orphan Alert",
    body: "Calcul : Somme des éléments déconnectés (PP ignorés + JTBD sans story + Epics vides + Métriques sans impact).\n\nSignification : Mesure le gaspillage (Waste) conceptuel du projet.\n\nDiagnostic : Révèle les angles morts de la recherche utilisateur ou des coquilles vides créées pour rien.",
  },
  summaryValueChainJtbd: {
    kind: "definition",
    title: "Job Coverage",
    body: "Calcul : % de Jobs-To-Be-Done ciblés par au moins une User Story. Indicateur de Densité : nb stories / nb JTBD.\n\nSignification : Vérifie la traduction de la recherche utilisateur en backlog exécutable.\n\nDiagnostic : Une jauge basse signifie qu'on a identifié ce que veulent les utilisateurs, mais qu'on n'a rien prévu pour y répondre. Une densité trop forte (> 4) signale un risque de sur-ingénierie.",
  },
  summaryValueChainMetrics: {
    kind: "definition",
    title: "Metric Coverage",
    body: "Calcul : % des métriques de l'arbre North Star impactées par le backlog.\n\nSignification : Vérifie l'alignement business des développements en cours. La jauge est scindée en deux : Vert foncé = Couvert par des features Livrées, Vert clair = Couvert par le Backlog.\n\nDiagnostic : Un trou ici signifie que l'équipe travaille, mais que certains leviers de croissance sont totalement ignorés. Le ratio Livré/Backlog permet de voir ce qui génère déjà de la valeur vs ce qui est une promesse.",
  },
  summaryOverview: {
    kind: "guide",
    title: "Vue d'ensemble",
    body: "Tableau de bord du projet : alertes gouvernance, KPI chaîne de valeur (style Story Health) et cartographie Persona → PP → JTBD → Story → Epic → Métrique.",
  },
  summaryHealth: {
    kind: "definition",
    title: "Santé projet",
    body: "Nombre total de features actives dans ce projet (hors archivées). Le badge à droite signale les décisions CEO encore en attente — « OK » si rien ne bloque.",
  },
  summaryStoryOrphans: {
    kind: "alerte",
    title: "Stories orphelines",
    body: "Stories sans Epic rattachée. Le compteur doit revenir à zéro après le verrouillage du workflow.",
  },
  agileFile: {
    kind: "definition",
    title: "File active",
    body: "Features BUILD non déployées dans la file d'exécution ordonnée.",
  },
  agileSprint: {
    kind: "definition",
    title: "Sprint",
    body: "Stories en in_sprint sous epics in_progress ; features en dev ou test.",
  },
  agileDeployed: {
    kind: "statut",
    title: "Déployées",
    body: "Features BUILD passées en production — voir section Livré pour l'historique.",
  },
  agileEpicsDone: {
    kind: "statut",
    title: "Epics terminées",
    body: "Toutes les stories de l'epic sont delivered.",
  },
  governanceCommittee: {
    kind: "regle",
    title: "Gouvernance & comité",
    body: "Unanimité 100 % des votants. Auto-act ou validation CEO selon le réglage projet.",
  },
  governanceAutoAct: {
    kind: "regle",
    title: "Après unanimité",
    body: "Recommandé : CEO obligatoire — le comité aligne, le CEO (ou délégué) acte la décision finale.",
  },
  governanceDelegate: {
    kind: "definition",
    title: "Délégation CEO",
    body: "Personne habilitée à finaliser à la place du CEO sur ce projet.",
  },
  governanceFlow: {
    kind: "regle",
    title: "Flux comité",
    body: "Draft → comité (1 voix / membre) → unanimité ou arbitrage CEO / délégué.",
  },
  moduleComposer: {
    kind: "guide",
    title: "Composer le module",
    body: "Assignez des features depuis la Control Room — phase 1 ou 2 éligibles.",
  },
  brainstormDrafts: {
    kind: "guide",
    title: "Brouillons",
    body: "Idées privées jusqu'au partage. Édition, archivage ou passage en « Shared » quand l'intention est claire.",
  },
  brainstormShared: {
    kind: "guide",
    title: "Idées partagées",
    body: "Visibles par l'équipe. Votes et commentaires indicatifs — structuration ensuite en epic ou feature.",
  },
  brainstormCreate: {
    kind: "guide",
    title: "Capturer une idée",
    body: "Titre + résumé en une phrase. Laissez sans projet pour une idée portefeuille, ou assignez à un projet existant.",
  },
  brainstormArchived: {
    kind: "statut",
    title: "Archives",
    body: "Idées retirées du flux principal — consultables, restaurables ou supprimables.",
  },
  modulesOrphan: {
    kind: "alerte",
    title: "Features non assignées",
    body: "Features BUILD sans module technique — rattachez-les via Composer pour organiser la delivery.",
  },
  modulesEpicsCoverage: {
    kind: "definition",
    title: "Epics couvertes",
    body: "Epics des features rattachées — vérifie que le module couvre bien le périmètre métier attendu.",
  },
  moduleEditorIdentity: {
    kind: "guide",
    title: "Identité du module",
    body: "Brique de delivery : nom lisible, code unique (minuscules, par projet) et ordre d'affichage dans la liste.",
  },
  agileDelivered: {
    kind: "statut",
    title: "Livré",
    body: "Features déployées et epics terminées — historique consultable, hors file active.",
  },
  summaryPreviewPersonas: {
    kind: "definition",
    title: "Aperçu personas",
    body: "Les 3 premiers profils du projet — catalogue complet sur la page Personas.",
  },
  epicStories: {
    kind: "regle",
    title: "Stories liées",
    body: "Definition of Ready : stories validées pour faire avancer l'epic vers Prête.",
  },
  nsmForm: {
    kind: "guide",
    title: "Métriques NSM",
    body: "Arbre NSM → sous-métriques. Sert au Filtre 1 et au rattachement des features.",
  },
  nsmLevel1: {
    kind: "definition",
    title: "North Star Metric",
    body: "Niveau 1 — boussole projet entière. Label et règle d'alignement.",
  },
  nsmLevel2: {
    kind: "definition",
    title: "Impact Metrics",
    body: "Niveau 2 — métriques principales. Chacune peut avoir des sous-métriques (niveau 3+).",
  },
  personaProfilePanel: {
    kind: "guide",
    title: "Profil persona",
    body: "Nom, segment et résumé — carte lisible en une seconde.",
  },
  recommendedFlow: {
    kind: "guide",
    title: "Parcours recommandé",
    body: "Progression idéale du projet : personas → stories → features → comité → exécution.",
  },
  personaKpiPpJtbd: {
    kind: "definition",
    title: "Couverture PP ↔ JTBD",
    body: "Calcul : % de frictions (PP) reliées à au moins un JTBD, sur les personas actifs du casting.\n\nSignification : Mesure si la recherche utilisateur est traduite en objectifs actionnables — chaque douleur doit avoir une réponse.\n\nDiagnostic : < 100 % révèle des frictions ignorées (alerte rouge dans le catalogue). Bloque le statut READY.",
  },
  personaKpiDensity: {
    kind: "definition",
    title: "Indice PP / JTBD",
    body: "Calcul : Ratio JTBD ÷ frictions, agrégé sur le casting actif. Zone saine : 1,0–1,4.\n\nSignification : Densité de la matrice persona — trop peu de jobs = angles morts ; trop de jobs = sur-ingénierie.\n\nDiagnostic : SOUS-SPÉCIFIÉ (< 1) = jobs trop larges ou frictions non découpées. SURCHARGE (> 1,4) = risque de solutions redondantes.",
  },
  personaKpiMatrix: {
    kind: "definition",
    title: "Matrice OK",
    body: "Calcul : Nb de personas actifs sans alerte critique (toutes frictions couvertes, aucun job fantôme).\n\nSignification : Qualité du portefeuille casting — combien de fiches sont prêtes à alimenter le backlog.\n\nDiagnostic : Un persona en alerte bloque sa validation READY et fausse les KPI Vue d'ensemble en aval.",
  },
  personaKpiGhosts: {
    kind: "alerte",
    title: "Jobs fantômes",
    body: "Calcul : Nb de JTBD sans friction associée, sur le casting actif.\n\nSignification : Signale du solutionnisme — des jobs déclarés sans ancrage dans une douleur réelle.\n\nDiagnostic : > 0 = revoir la formulation (anti-feature) ou rattacher le job à un PP existant.",
  },
  personaVocabulary: {
    kind: "guide",
    title: "Référentiel persona",
    body: "Segments et types de jobs propres au projet. Évolutif : ajoutez T5, un type réglementaire, etc. Les fiches persona et la liste utilisent ces libellés.",
  },
  storyKpiDor: {
    kind: "definition",
    title: "Story Health Score",
    body: "Calcul : % de stories conformes à la DoR (Epic + JTBD + description narrative + persona primaire).\n\nSignification : Mesure la maturité du backlog avant validation et moisson epic.\n\nDiagnostic : < 100 % = stories bloquées en DRAFT — risque de développer sans ancrage terrain ni cadre stratégique.",
  },
  storyKpiDensity: {
    kind: "definition",
    title: "Value Density",
    body: "Calcul : Ratio stories ÷ JTBD distincts couverts par le portefeuille.\n\nSignification : Granularité du découpage produit — combien de récits par job utilisateur.\n\nDiagnostic : > 2 = dilution (morcellement, coût d'intégration). < 1 = sous-découpage ou JTBD trop larges.",
  },
  storyKpiOrphans: {
    kind: "alerte",
    title: "Orphan Alert",
    body: "Calcul : Nb de stories sans Epic et/ou sans JTBD cible.\n\nSignification : Signale du développement hors-piste — récits déconnectés de la chaîne valeur.\n\nDiagnostic : > 0 = prioriser le rattachement epic ou la correction JTBD avant validation.",
  },
  storyKpiImpactMatrix: {
    kind: "definition",
    title: "Impact Matrix Status",
    body: "Calcul : Répartition % des stories par pilier d'impact (North Star, Largeur, Profondeur, Fréquence, Efficience).\n\nSignification : Vérifie l'équilibre de l'effort produit vs la stratégie de croissance.\n\nDiagnostic : Dominance d'un seul pilier = déséquilibre — ex. 80 % Efficience sans Largeur.",
  },
  epicKpiCount: {
    kind: "definition",
    title: "Epics",
    body: "Epics actives dans ce projet.",
  },
  epicKpiInProgress: {
    kind: "statut",
    title: "En cours",
    body: "Epics en statut in_progress — stories visibles dans le Cockpit.",
  },
  epicKpiStories: {
    kind: "definition",
    title: "Stories liées",
    body: "User stories rattachées à une epic.",
  },
  epicKpiNoPersona: {
    kind: "alerte",
    title: "Sans persona",
    body: "Epics sans persona principal — à compléter pour la DoR.",
  },
  epicKpiGhost: {
    kind: "alerte",
    title: "Ghost Epics",
    body: "Calcul : Nb d'epics sans aucune user story rattachée (moisson vide).\n\nSignification : Coquilles stratégiques sans ancrage bottom-up — gaspillage de gouvernance.\n\nDiagnostic : > 0 = compléter la moisson ou archiver l'epic fantôme avant READY.",
  },
  epicKpiDor: {
    kind: "definition",
    title: "Epic Health Score",
    body: "Calcul : % d'epics avec DoR complète (nom + définition + ≥ 1 story).\n\nSignification : Qualité du portefeuille epic avant passage Control Room. Personas et impact sont hérités des stories.\n\nDiagnostic : < 100 % = epics incomplètes bloquées en brouillon.",
  },
  epicKpiLifecycle: {
    kind: "statut",
    title: "Portefeuille actif",
    body: "Calcul : Répartition draft / prêtes (READY) / en cours / terminées sur le total epics.\n\nSignification : Pulse du cycle de vie — combien d'epics sont réellement actionnables.\n\nDiagnostic : 0 READY = backlog stratégique figé ; trop de draft = moisson inachevée.",
  },
  epicKpiStoriesCoverage: {
    kind: "definition",
    title: "Couverture backlog",
    body: "Calcul : Ratio stories validées (ou en sprint/livrées) rattachées vs total lié. Alerte cascade = epic en cours sans story validée.\n\nSignification : Cohérence exécution ↔ stratégie — les epics actives ont-elles du concret ?\n\nDiagnostic : CASCADE > 0 = epic in_progress sans story validée — bloquer le passage Cockpit.",
  },
  epicValueMapping: {
    kind: "guide",
    title: "Cartographie valeur",
    body: "Disponible sur la Vue d'ensemble du projet : chaîne Persona → PP → JTBD → User Story → Epic → Métrique. Les nœuds en pointillés rose signalent des orphelins.",
  },
  epicMapOrphanPersona: {
    kind: "alerte",
    title: "Persona sans story",
    body: "Personas du casting sans aucune user story rattachée comme persona principal.",
  },
  epicMapOrphanPain: {
    kind: "alerte",
    title: "PP orpheline",
    body: "Point de friction (pain point) non adressé par un JTBD du même persona.",
  },
  epicMapOrphanJtbd: {
    kind: "alerte",
    title: "JTBD orphelin",
    body: "Job to be done sans user story qui le référence (target_persona_job_id).",
  },
  epicMapOrphanStory: {
    kind: "alerte",
    title: "Story incomplète",
    body: "User story avec au moins un lien manquant : persona, JTBD, epic ou métrique d'impact.",
  },
  epicMapOrphanMetric: {
    kind: "alerte",
    title: "Métrique non couverte",
    body: "Nœud de l'arbre NSM sans story validée, en sprint ou livrée (remontée parent incluse).",
  },
  summaryKpiCeo: {
    kind: "alerte",
    title: "Décision CEO",
    body: "Features en attente de validation CEO ou délégué.",
  },
  summaryKpiCommittee: {
    kind: "alerte",
    title: "Comité ouvert",
    body: "Revues comité non finalisées.",
  },
  summaryKpiBuild: {
    kind: "statut",
    title: "BUILD actés",
    body: "Features validées pour l'exécution.",
  },
  summaryKpiExecution: {
    kind: "statut",
    title: "En cours",
    body: "Features en développement ou en test.",
  },
  summaryKpiKill: {
    kind: "definition",
    title: "Kill rate",
    body: "Part des features tuées sur le total — indicateur de discipline gouvernance.",
  },
  featureKpiSpecs: {
    kind: "definition",
    title: "Specs Complétion",
    body: "Calcul : % de features avec solution technique rédigée (champ specs non vide).\n\nSignification : Maturité des dossiers avant comité — pas de BUILD sans solution décrite.\n\nDiagnostic : < 80 % = dossiers incomplets à finaliser avant arbitrage.",
  },
  featureKpiAlignment: {
    kind: "definition",
    title: "Lien Stratégique",
    body: "Calcul : % de features rattachées à une Epic.\n\nSignification : Discipline d'alignement — chaque solution doit remonter à un objectif stratégique.\n\nDiagnostic : < 90 % = features hors cadre à rattacher ou tuer.",
  },
  featureKpiBuild: {
    kind: "statut",
    title: "Décisions BUILD",
    body: "Calcul : Nb de features actées BUILD par le comité vs total actif. Badge complémentaire : dossiers encore en revue.\n\nSignification : Volume validé pour l'exécution — seul le BUILD entre dans le Cockpit.\n\nDiagnostic : 0 BUILD avec features matures = comité en retard ou arbitrage trop conservateur.",
  },
  featureKpiKillRate: {
    kind: "definition",
    title: "Kill Rate",
    body: "Calcul : % de features rejetées (KILL) sur le total historique actif + tuées.\n\nSignification : Discipline d'arbitrage — capacité à dire non aux mauvaises idées.\n\nDiagnostic : 0 % prolongé = filtre trop permissif. 10–20 % est souvent sain.",
  },
  cockpitKpiBacklog: {
    kind: "statut",
    title: "File Active",
    body: "Calcul : Nb de features BUILD ou LEARN en statut pending (en attente de prise en charge).\n\nSignification : Stock d'exécution prêt — ce qui attend l'équipe produit / dev.\n\nDiagnostic : File qui grossit sans WIP = équipe saturée ou priorisation floue. Les LEARN partagent la même file que les BUILD.",
  },
  cockpitKpiWip: {
    kind: "statut",
    title: "Work In Progress",
    body: "Calcul : Features en développement + en test. Goulet si test >> dev (> 2× et > 2 en test).\n\nSignification : Charge en cours — limite de WIP pour préserver la vélocité.\n\nDiagnostic : Goulet test = QA ou recette bloquante ; WIP élevé = multitâche.",
  },
  cockpitKpiDeployed: {
    kind: "statut",
    title: "Features Livrées",
    body: "Calcul : Nb cumulé de features passées en deployed.\n\nSignification : Output réel en production — preuve de livraison.\n\nDiagnostic : 0 avec BUILD en file = flux bloqué en amont (dev, test ou comité).",
  },
  cockpitKpiEpicsDone: {
    kind: "definition",
    title: "Epics Terminées",
    body: "Calcul : Epics dont toutes les stories liées sont delivered. Complément : epics in_progress et stories en sprint.\n\nSignification : Création de valeur utilisateur bout-en-bout — pas seulement des features isolées.\n\nDiagnostic : Features livrées mais epics non done = stories partiellement couvertes.",
  },
  personaCreatePanel: {
    kind: "guide",
    title: "Créer un persona",
    body: "Profil court, frictions principales puis jobs — une carte lisible en une seconde.",
  },
  personaQuickRead: {
    kind: "alerte",
    title: "Lecture rapide",
    body: "Personas incomplets (jobs ou frictions manquants) à compléter avant les features.",
  },
  personaDesignReminder: {
    kind: "reference",
    title: "Rappel design",
    body: "Titre court, friction visible en premier, jobs en blocs compacts.",
  },
  storyCreatePanel: {
    kind: "guide",
    title: "Créer une story",
    body: "Feature parente + Effort (jours 0.5–5) + Risque (1–3). Intent en une phrase.",
  },
  storyQuickRead: {
    kind: "alerte",
    title: "À compléter",
    body: "Stories sans Feature, sans jours d'effort ou sans Risque (DoR incomplète).",
  },
  storyDesignReminder: {
    kind: "reference",
    title: "Bonnes pratiques",
    body:
      "Effort plafonné à 5j (découpez sinon). R:3 = POC recommandé. La Valeur reste sur la Feature (Impact).",
  },
  summaryPreviewLatest: {
    kind: "definition",
    title: "Derniers éléments",
    body: "Aperçu des 3 derniers enregistrements — liste complète sur la page dédiée.",
  },
  initiativeStepIdentity: {
    kind: "guide",
    title: "Identité & stratégie",
    body: "Epic parent et contexte JTBD obligatoires — pont Spine Feature.",
  },
  initiativeStepPersona: {
    kind: "guide",
    title: "Persona & douleur",
    body: "Le JTBD lié ancre la Feature dans la Matrice Besoins (Persona → Pain Point → Job).",
  },
  initiativeStepSpecs: {
    kind: "regle",
    title: "Specs techniques",
    body: "Markdown et diagrammes Mermaid — aident à calibrer Effort/Risque des Stories.",
  },
  initiativeStepArbitrage: {
    kind: "guide",
    title: "Valeur / Effort (Spine)",
    body:
      "Impact Feature 0–3 (Produit). Stories : jours + Risque. Epic : ∑Impact ÷ ∑Jours (calculé). " +
      "Impact 0 = hard block in_progress. L'ancien RICE/Kano legacy est déprécié.",
  },
  personaDetail: {
    kind: "guide",
    title: "Fiche persona",
    body: "Profil, frictions, jobs et revue d'équipe. Persona complet requis pour les features.",
  },
  newProject: {
    kind: "guide",
    title: "Nouveau projet",
    body: "Vous serez CEO — invitez CTO, devs et experts ensuite.",
  },
} as const satisfies Record<string, SttnsContextHelpContent>;
