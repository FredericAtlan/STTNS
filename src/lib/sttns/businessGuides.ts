/** Identifiants des guides métier (panneau coulissant). */
export type BusinessGuideId =
  | "epic-new"
  | "epic-detail"
  | "epic-list"
  | "story-new"
  | "agile-cockpit";

export type BusinessGuideSection = {
  heading: string;
  body?: string;
  mermaid?: string;
};

export type BusinessGuide = {
  id: BusinessGuideId;
  title: string;
  eyebrow: string;
  sections: BusinessGuideSection[];
};

export const BUSINESS_GUIDES: Record<BusinessGuideId, BusinessGuide> = {
  "epic-new": {
    id: "epic-new",
    eyebrow: "Guide métier",
    title: "Nouvelle Épic Stratégique",
    sections: [
      {
        heading: "Alignement produit — Epic comme agrégat de User Stories",
        body: "Une Epic n'est **pas** une entité stratégique autonome : c'est une **vue produit** qui regroupe des user stories déjà capturées (ou en cours de capture). Elle ne livre rien seule — elle **organise la valeur** avant l'arbitrage des Features en Control Room.\n\nPensez-y comme une **coquille thématique** : vous nommez le fil rouge, vous rattachez les stories terrain, et le système calcule le reste.",
        mermaid: `flowchart LR
  subgraph terrain [Terrain · saisie story]
    P[Persona · JTBD · impact]
    US[User Story]
    P --> US
  end
  subgraph epic_layer [Epic · agrégat produit]
    E[Nom + définition]
    H[Héritage dérivé]
    US -->|rattachement| E
    E --> H
  end
  subgraph suite [Suite cascade]
    H --> R[READY]
    R --> CR[Control Room]
    CR --> F[Features BUILD]
  end`,
      },
      {
        heading: "Ce que vous saisissez vs ce qui est dérivé",
        body: "| | **Saisie humaine** | **Dérivé (lecture seule)** |\n| --- | --- | --- |\n| Identité | Nom de l'Epic | Personas (multi-badges) |\n| Valeur | Définition / objectif | Segments (via personas) |\n| Moisson | Sélection des stories | JTBD couverts |\n| — | — | Profil d'impact agrégé |\n| — | — | Touche NSM si une story impacte la North Star |\n\n**Phase 1** : l'impact Epic est **100 % hérité** des stories — pas de pilier d'impact ni KPI cible à saisir sur l'Epic.",
      },
      {
        heading: "Héritage automatique — comment le profil se calcule",
        body: "À chaque coche / décoche de story, le panneau **« Héritage des stories »** se met à jour :\n\n- **Personas** = union des personas primaires de chaque story rattachée (ex. Adja + Yao → deux badges).\n- **Segments** = union des segments de maturité des personas couverts.\n- **JTBD** = liste des jobs-to-be-done liés aux stories sélectionnées.\n- **Impact** = répartition en % (Efficience, North Star, Largeur, Profondeur, Fréquence) selon l'impact déclaré sur chaque story.\n\nÀ la sauvegarde, ces données alimentent aussi le **cache** de la fiche (persona principal, segments, racine d'impact) pour la liste et les filtres.",
        mermaid: `flowchart TB
  S1["Story A · Adja · PME · JTBD collecte · impact efficience"]
  S2["Story B · Yao · Audit · JTBD conformité · impact North Star"]
  S1 --> AGG[Agrégation Epic]
  S2 --> AGG
  AGG --> PB[Personas multi-badges]
  AGG --> TI[Segments union]
  AGG --> JB[JTBD couverts]
  AGG --> IM[Barre impact % · dominant]
  AGG --> NSM[Flag touche NSM]`,
      },
      {
        heading: "Trois parcours supportés — même écran, même modèle",
        body: "Un seul formulaire couvre trois usages réels ; le modèle de données ne change pas :\n\n1. **Top-down** — Poser d'abord la coquille (nom + définition), sauver en brouillon, puis moissonner les stories orphelines.\n2. **Bottom-up** — Partir des stories 🚨 ORPHAN du backlog, créer l'Epic et les rattacher en bloc (cas MarketChain : US-T1-01 + US-AUDIT-01).\n3. **Compléter une Epic incomplète** — Ouvrir une epic fantôme (0 story) ou un brouillon partiel, ajouter / retirer des stories : le profil dérivé se recalcule à chaque modification.\n\nDans les trois cas : **nom + définition + moisson** sur le même écran.",
        mermaid: `flowchart TB
  subgraph top [1 · Top-down]
    T1[Nom + définition] --> T2[Brouillon · epic fantôme OK]
    T2 --> T3[Moisson stories]
  end
  subgraph bottom [2 · Bottom-up]
    B1[Stories orphelines backlog] --> B2[Créer Epic]
    B2 --> B3[Rattacher en bloc]
  end
  subgraph complete [3 · Compléter]
    C1[Epic existante incomplète] --> C2[Ajouter / retirer stories]
    C2 --> C3[Profil hérité recalculé]
  end
  top --> ECRAN[Même écran · même modèle]
  bottom --> ECRAN
  complete --> ECRAN
  ECRAN --> DOR[DoR · READY si complet]`,
      },
      {
        heading: "Diagramme relationnel complet",
        body: "Liens entre les objets du Decision OS — l'Epic se situe **entre** le backlog stories et l'arbitrage features.",
        mermaid: `erDiagram
  PERSONA ||--o{ USER_STORY : persona_primaire
  JTBD ||--o{ USER_STORY : target_job
  USER_STORY }o--o| EPIC : epic_id
  EPIC ||--o{ FEATURE : epic_id
  USER_STORY }o--o| FEATURE : initiative_liee
  METRIC ||--o{ USER_STORY : impact_metric
  METRIC ||--o| METRIC : parent_NSM
  EPIC }o--o{ PERSONA : heritage_union
  EPIC }o--o{ JTBD : heritage_union`,
      },
      {
        heading: "Lecture cascade de valeur",
        body: "De la capture terrain à la livraison — l'Epic est le **pivot** entre backlog et exécution :\n\n1. **JTBD + Persona** → capture du besoin réel.\n2. **User Story** → unité de valeur testable (DoR story en amont).\n3. **Epic** → regroupement thématique + profil hérité.\n4. **Feature BUILD** → décision comité / CEO en Control Room.\n5. **Sprint** → Cockpit, cascade story → epic en cours.\n6. **Livraison** → stories delivered, epic done.",
        mermaid: `flowchart TD
  JTBD[JTBD · persona terrain] --> US[User Story · backlog]
  US -->|moisson| EP[Epic · agrégat READY]
  EP --> CR[Control Room · arbitrage]
  CR --> FE[Feature BUILD actée]
  FE --> SP[Story in_sprint]
  SP --> EP2[Epic in_progress]
  SP --> LV[Story delivered]
  LV --> ED[Epic done]`,
      },
      {
        heading: "Comment ça se remplit — pas à pas sur cet écran",
        body: "**Étape 1 — Identité** (vous)\n- *Nom* : thématique courte (ex. « E1 — Smart Audit Automation »).\n- *Définition* : bénéfice écosystème en prose (ex. réduire le temps de collecte des pièces).\n\n**Étape 2 — Moisson** (vous)\n- Cochez les stories 🚨 ORPHAN (sans epic) — ou celles déjà liées si vous éditez.\n- Chaque rattachement met à jour le panneau héritage à droite.\n\n**Panneau héritage** (système)\n- Se remplit dès qu'au moins 1 story est cochée ; sinon message *epic fantôme*.\n\n**DoR widget** (système)\n- 🟢 Nom · 🟢 Définition · 🟢 ≥ 1 story → bouton **READY** débloqué.\n\n**Sauvegarde** (système)\n- Sync des liens epic sur les stories + cache persona / segments / impact pour la liste.",
      },
      {
        heading: "Epic fantôme & Definition of Ready",
        body: "**Epic fantôme** = 0 story rattachée. Brouillon autorisé (parcours top-down), visible dans le KPI « Fantômes » de la liste.\n\n**READY** exige les 3 critères : nom + définition + ≥ 1 story. Pas de persona pilote ni KPI Epic à saisir — tout vient des stories.\n\nEnsuite : arbitrage des Features en Control Room, puis Cockpit.",
        mermaid: `stateDiagram-v2
  [*] --> draft: Création
  draft --> draft: Epic fantôme OK
  draft --> ready: DoR complète
  ready --> in_progress: Feature BUILD + sprint
  in_progress --> done: Stories livrées
  draft --> [*]: Archivage`,
      },
    ],
  },
  "epic-detail": {
    id: "epic-detail",
    eyebrow: "Guide métier",
    title: "Piloter une Epic",
    sections: [
      {
        heading: "Alignement produit — Epic comme agrégat",
        body: "Cette fiche est le **hub** d'une Epic : elle agrège des user stories, affiche le profil hérité et pilote le passage en Prête. L'Epic ne remplace pas les stories — elle les **organise** pour la suite cascade (Features → Sprint).",
        mermaid: `flowchart LR
  US[Stories liées] --> EP[Fiche Epic]
  EP --> H[Héritage dérivé]
  EP --> DOR[DoR · READY]
  DOR --> CR[Control Room]
  CR --> AG[Cockpit]`,
      },
      {
        heading: "Ce que vous saisissez vs ce qui est dérivé",
        body: "| **Saisie humaine** | **Dérivé (lecture seule)** |\n| --- | --- |\n| Nom · définition | Personas multi-badges |\n| Moisson stories | Segments · JTBD couverts |\n| — | Profil d'impact agrégé |\n| — | Touche NSM |\n\nModifier la moisson **recalcule tout** avant sauvegarde. Phase 1 : impact 100 % hérité des stories.",
      },
      {
        heading: "Héritage automatique (lecture seule)",
        body: "Le panneau **Héritage des stories** reflète l'état actuel des stories cochées :\n\n- **Personas** : union des personas primaires.\n- **Segments** : segments des personas couverts.\n- **JTBD** : jobs liés aux stories.\n- **Impact** : % par pilier + dominant.\n- **NSM** : flag si au moins une story touche la North Star.",
        mermaid: `flowchart TB
  MOD[Modifier moisson stories] --> RECALC[Recalcul profil dérivé]
  RECALC --> AFF[Affichage panneau héritage]
  SAVE[Sauvegarder] --> DB[Cache DB · liste et filtres]
  AFF --> SAVE`,
      },
      {
        heading: "Trois parcours — même fiche",
        body: "Que vous arriviez en **top-down**, **bottom-up** ou pour **compléter** une epic incomplète, vous utilisez cette même fiche : identité + moisson + panneaux DoR / héritage. Une epic fantôme se complète ici en ajoutant des stories.",
        mermaid: `flowchart LR
  TD[Top-down · coquille] --> FICHE[Fiche Epic]
  BU[Bottom-up · orphelines] --> FICHE
  CP[Compléter fantôme] --> FICHE`,
      },
      {
        heading: "Lecture cascade de valeur",
        body: "Une fois READY, l'Epic alimente la Control Room. Les Features BUILD actées déclenchent la cascade agile : story in_sprint → epic in_progress → stories delivered → epic done.",
        mermaid: `flowchart TD
  F[Feature BUILD actée] --> S[Story in_sprint]
  S --> E[Epic in_progress]
  D[Toutes features BUILD déployées] --> SD[Story delivered]
  SD --> ED[Epic done]`,
      },
      {
        heading: "Diagramme relationnel",
        body: "L'Epic relie le backlog stories au portefeuille features — sans dupliquer les attributs des stories.",
        mermaid: `erDiagram
  USER_STORY }o--o| EPIC : epic_id
  EPIC ||--o{ FEATURE : epic_id
  PERSONA ||--o{ USER_STORY : persona_primaire
  JTBD ||--o{ USER_STORY : target_job
  EPIC }o--o{ PERSONA : heritage
  EPIC }o--o{ JTBD : heritage`,
      },
      {
        heading: "Definition of Ready & archivage",
        body: "Brouillon → **Prête** : nom + définition + ≥ 1 story. Le bouton READY reste bloqué tant qu'un critère manque.\n\n**Archivage** : retire l'Epic de la liste active. Les Features ne sont pas tuées automatiquement — le KILL reste une décision comité.",
      },
    ],
  },
  "epic-list": {
    id: "epic-list",
    eyebrow: "Guide métier",
    title: "Tour de contrôle Epics",
    sections: [
      {
        heading: "Alignement produit — vue portefeuille",
        body: "Cette page liste les **agrégats** Epic du projet. Chaque ligne résume le profil **hérité** des stories (persona principal en cache, volume stories, statut) — pas une saisie stratégique autonome.",
        mermaid: `flowchart LR
  US[User Stories backlog] --> EP[Epics · agrégats]
  EP --> KPI[KPI santé portefeuille]
  EP --> CR[Control Room]`,
      },
      {
        heading: "Lecture rapide des lignes",
        body: "Par epic : personas hérités (cache), statut (brouillon / prête / en cours / done), progression des stories validées, volume de Features BUILD rattachées. **Gérer** ouvre la fiche complète (moisson + héritage + cascade).",
      },
      {
        heading: "KPI Epics fantômes",
        body: "Compte les epics **sans aucune story** rattachée. Brouillon acceptable (parcours top-down), mais à compléter avant READY. Compléter = ouvrir la fiche et moissonner des stories orphelines.",
        mermaid: `flowchart TD
  G[Epic fantôme · 0 story] -->|Moisson| S[≥ 1 story]
  S --> H[Profil hérité rempli]
  H --> R[DoR READY possible]`,
      },
      {
        heading: "Lecture cascade de valeur",
        body: "Les epics READY alimentent la Control Room. Les epics « En cours » supposent des stories validées en sprint — signal orange si incohérence.",
        mermaid: `flowchart TD
  LIST[Liste Epics] --> R[READY → Control Room]
  LIST --> IP[In progress → Cockpit]
  IP --> WARN[Alerte si 0 story validée]`,
      },
      {
        heading: "Cartographie valeur",
        body: "Sur la **Vue d'ensemble** du projet : chaîne Persona → PP → JTBD → Story → Epic → Métrique, avec KPI style Story Health. Les nœuds en pointillés rose signalent les orphelins (friction ignorée, JTBD sans story, epic fantôme, métrique non couverte).",
        mermaid: `flowchart LR
  P[Persona] --> PP[Pain Point]
  PP --> J[JTBD]
  J --> US[User Story]
  US --> E[Epic]
  US --> M[Métrique]`,
      },
      {
        heading: "Alerte incohérence & action Gérer",
        body: "Epic « En cours » sans story validée = signal orange — la cascade agile suppose des stories validées avant l'exécution.\n\n**Gérer** ouvre la fiche Epic (identité, moisson, panneau héritage, DoR, suivi cascade).",
      },
    ],
  },
  "story-new": {
    id: "story-new",
    eyebrow: "Guide métier",
    title: "User Story",
    sections: [
      {
        heading: "Triptyque obligatoire",
        body: "En tant que (persona) · Je veux · Afin de · JTBD · lien epic · lien feature · indicateur d'impact.",
      },
      {
        heading: "Personas secondaires",
        body: "Liez les personas impactés via la liste de personas liés (en plus du persona principal).",
      },
    ],
  },
  "agile-cockpit": {
    id: "agile-cockpit",
    eyebrow: "Guide métier",
    title: "Cockpit",
    sections: [
      {
        heading: "File d'exécution",
        body: "Seules les Features BUILD actées entrent dans la file. Démarrer le dev déclenche la cascade story → epic.",
      },
      {
        heading: "Livraison",
        mermaid: `stateDiagram-v2
  [*] --> pending
  pending --> in_development: Démarrer dev
  in_development --> in_test: Dev terminé
  in_test --> deployed: Déployé`,
      },
    ],
  },
};

export function getBusinessGuide(id: BusinessGuideId): BusinessGuide {
  return BUSINESS_GUIDES[id];
}
