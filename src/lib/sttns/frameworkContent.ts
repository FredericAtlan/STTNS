/**
 * Contenu métier — Framework stratégique STTNS + Application projet.
 * Source FR pour Aide `/help/framework` · `/help/application` et FrameworkViewer.
 *
 * Aligné sur le produit codé (Why · Brouillons · Portfolio · Cycles · Stories/Kanban ·
 * Radar · Spine · Mind Map · Scoring V/E). Les filtres 0 / 0 bis restent des
 * **pratiques d'équipe** — pas des hard-stops système.
 */

export type FrameworkCallout = {
  title: string;
  body: string;
  variant?: "emerald" | "slate" | "red";
};

export type FrameworkMermaid = {
  code: string;
  caption?: string;
};

export type FrameworkSubsection = {
  id: string;
  title: string;
  paragraphs?: string[];
  callouts?: FrameworkCallout[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  funnelSteps?: {
    number: number;
    title: string;
    body: string;
    bullets?: string[];
    formula?: string;
  }[];
  mermaidDiagrams?: FrameworkMermaid[];
};

export type FrameworkSection = {
  id: string;
  title: string;
  subtitle?: string;
  subsections: FrameworkSubsection[];
};

export const FRAMEWORK_STRATEGIQUE: FrameworkSection = {
  id: "strategique",
  title: "Framework stratégique",
  subtitle:
    "Manifeste capital-temps · pratiques d'équipe · garde-fous Spine réellement codés.",
  subsections: [
    {
      id: "manifeste",
      title: "Manifeste — préserver le capital-temps",
      paragraphs: [
        "Le risque mortel d'un produit ambitieux n'est pas de mal coder : c'est d'engager du temps d'ingénierie sur une chose que le marché ne veut pas. Chaque ligne écrite crée de la dette, du coût et une charge de maintenance à vie.",
        "STTNS pose un contrat clair : le **temps** est la ressource la plus rare. Une idée sans douleur ancrée ou sans valeur démontrable doit être **gelée ou abandonnée** — jamais reléguée dans un backlog fantôme.",
        "La ligne directrice reste : $\\text{Impact}_{\\text{équipe}} \\propto \\dfrac{\\text{Valeur livrée}}{\\text{Capital-temps investi}}$. On ne code que pour maximiser ce ratio.",
      ],
      mermaidDiagrams: [
        {
          caption:
            "Esprit du manifeste — pratiques humaines d'abord, puis le Spine qui enforce ce qui est codé.",
          code: `flowchart TD
  Idee["Idée brute"]:::idea
  P0["Pratique Filtre 0<br/>Douleur marché"]:::prac
  Pbis["Pratique Filtre 0 bis<br/>Conformité / expertise"]:::prac
  Spine["Spine STTNS<br/>Why · Brouillons · Portfolio · Exécution"]:::sys
  Code["Code engagé"]:::ok
  Stop["Gel / abandon"]:::stop

  Idee --> P0
  P0 -- "Douleur absente" --> Stop
  P0 -- "Douleur claire" --> Pbis
  Pbis -- "Zone sensible non validée" --> Stop
  Pbis -- "OK équipe" --> Spine
  Spine --> Code

  classDef idea fill:#e2e8f0,stroke:#475569,color:#0f172a,font-weight:bold
  classDef prac fill:#fef3c7,stroke:#d97706,color:#78350f
  classDef sys fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold
  classDef ok fill:#004d40,stroke:#004d40,color:#ffffff,font-weight:bold
  classDef stop fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,font-weight:bold`,
        },
      ],
      callouts: [
        {
          title: "Règle d'or",
          body: "**Pas de douleur, pas de produit. Pas de validation, pas de code.**",
          variant: "emerald",
        },
      ],
    },
    {
      id: "no-pain-no-product",
      title: "Filtre 0 — No Pain, No Product (pratique)",
      paragraphs: [
        "Porte d'entrée **humaine**, avant toute priorisation V/E : l'initiative résout-elle une douleur réelle du marché, ou une préférence interne ?",
        "Dans le produit, cette pratique se matérialise dans la **Matrice Besoins** (`/why`) : personas Spine, Pain Points, JTBD. STTNS n'empêche pas de créer une Feature sans douleur — l'équipe s'engage à passer ce filtre avant Brouillons / Portfolio.",
      ],
      table: {
        headers: ["Question", "Critère attendu"],
        rows: [
          ["La douleur est-elle claire ?", "Elle s'énonce en une phrase, sans jargon interne."],
          ["Est-elle fréquente ?", "Elle revient dans le quotidien du persona."],
          ["Est-elle coûteuse ?", "Temps, argent, confiance ou opportunité — chiffrable."],
          [
            "Bloque-t-elle la promesse produit ?",
            "La résoudre augmente la chance d'atteindre la North Star du projet.",
          ],
        ],
      },
      callouts: [
        {
          title: "Pratique, pas hard-stop",
          body: "Filtre 0 = discipline d'équipe. Le système force ensuite le **lien Feature → JTBD** (`context_type: job`) et le **hard block Impact I:0 → `in_progress`**.",
          variant: "slate",
        },
      ],
    },
    {
      id: "legitimite",
      title: "Filtre 0 bis — Légitimité & conformité (pratique)",
      paragraphs: [
        "Garde-fou pour les zones sensibles : comptabilité, fiscalité, audit, scoring, KYC/AML — tout ce qui engage la responsabilité vis-à-vis d'un tiers régulé.",
        "Le prototypage UX reste autorisé pour apprendre. La **livraison**, elle, dépend d'une validation experte **décidée par l'équipe** — STTNS ne code pas de statut système inventé : les seuls états Spine sont `todo` · `in_progress` · `review` · `done`.",
      ],
      table: {
        headers: ["Question", "Règle simple", "Attitude équipe"],
        rows: [
          [
            "Domaine sensible ?",
            "Compta, audit, scoring, KYC/AML…",
            "Validation experte avant release",
          ],
          ["Règle métier claire ?", "Sourcée ou validée", "On peut engager un cycle"],
          ["Règle ambigüe ?", "Prototype / Spike seulement", "Pas de delivery tant que flou"],
        ],
      },
      callouts: [
        {
          title: "Principe de précaution",
          body: "Pas d'expertise, pas de logique réglementaire. Pas de validation, pas de release.",
          variant: "emerald",
        },
      ],
    },
    {
      id: "systeme-code",
      title: "Ce que STTNS enforce réellement",
      paragraphs: [
        "Après les pratiques 0 / 0 bis, le produit ne reproduit pas un entonnoir OST / KANO. Il enchaîne des **surfaces Spine** et des **garde-fous codés**.",
      ],
      mermaidDiagrams: [
        {
          caption:
            "Flux produit codé — Matrice Besoins → Brouillons → Portfolio → Cycles → Kanban → Radar.",
          code: `flowchart TD
  Why["Matrice Besoins /why<br/>Personas · Pain · JTBD"]:::why
  Disc["Brouillons /discovery<br/>Epic · Feature · Story"]:::disc
  Port["Portfolio /portfolio<br/>Priorisation V/E"]:::port
  Cyc["Cycles /cycles"]:::cyc
  Exec["Stories · Kanban"]:::exec
  Rad["Radar /radar"]:::rad

  Why --> Disc --> Port --> Cyc --> Exec --> Rad
  Rad -. "Retour douleur" .-> Why

  classDef why fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
  classDef disc fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,font-weight:bold
  classDef port fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold
  classDef cyc fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,font-weight:bold
  classDef exec fill:#004d40,stroke:#004d40,color:#ffffff,font-weight:bold
  classDef rad fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,font-weight:bold`,
        },
      ],
      table: {
        headers: ["Surface", "Rôle dans le code", "Garde-fou notable"],
        rows: [
          [
            "**Matrice Besoins**",
            "Personas / Pain Points / JTBD Spine",
            "Socle Why — alimente le lien Feature → JTBD",
          ],
          [
            "**Brouillons**",
            "Tableau de réunion → Epic · Feature · Story → `todo`",
            "JTBD requis pour finaliser une Feature",
          ],
          [
            "**Portfolio**",
            "Arbre Epic → Feature, badges V/E",
            "Ratio Epic calculé — zéro saisie valeur/effort",
          ],
          [
            "**Cycles · Stories · Kanban**",
            "Engagement temporel + exécution",
            "Impact I:0 bloque `in_progress` ; DoD strict sur Story",
          ],
          [
            "**Radar**",
            "Orphelins JTBD, fantômes, stagnation, Impact 0",
            "Signaux d'hygiène — pas un workflow inventé",
          ],
          [
            "**Arbre · Mind Map**",
            "Lecture transverse Spine",
            "Même source de vérité que le reste",
          ],
        ],
      },
    },
    {
      id: "scoring-ve",
      title: "Priorisation Valeur / Effort (codée)",
      paragraphs: [
        "La priorisation produit repose sur la triade **Produit · Tech · Système** — détaillée dans le chapitre Scoring V/E de l'Aide.",
      ],
      bullets: [
        "**Produit** — Impact Feature **I:0–3** + lien JTBD (`context_type: job`) obligatoire.",
        "**Tech** — Jours (0.5–5) + Risque **R:1–3** sur Story (ou Feature en Shape Up).",
        "**Système** — Ratio Epic $\\mathrm{Ratio\\ V/E} = \\dfrac{\\sum \\mathrm{Impact}}{\\sum \\mathrm{Jours}}$ — aucune saisie manuelle.",
      ],
      callouts: [
        {
          title: "Triade uniquement",
          body: "Impact · Jours+Risque · Ratio V/E — **aucune** autre méthode de scoring dans le flux actif. Le chapitre Scoring V/E de l'Aide est la ground truth.",
          variant: "emerald",
        },
      ],
    },
    {
      id: "garde-fous",
      title: "Garde-fous système — non négociables",
      paragraphs: [
        "Trois filets sont **matérialisés dans le code** Spine. Ils ne remplacent pas les pratiques 0 / 0 bis — ils empêchent le gaspillage une fois dans le système.",
      ],
      bullets: [
        "**Hard block Impact I:0** — Feature (et Stories enfants) **ne passent pas en `in_progress`** tant que l'Impact reste à 0.",
        "**JTBD obligatoire** — Feature non finalisable / non pilotable sans job métier lié (`context_type: job`).",
        "**DoD strict sur Story** — critères d'acceptation et lien Feature vérifiés avant `done`.",
      ],
      callouts: [
        {
          title: "Statuts Spine uniquement",
          body: "`todo` · `in_progress` · `review` · `done`. Aucun statut inventé sur le flux actif (pas de READY / DRAFT / EXPERT REVIEW système).",
          variant: "slate",
        },
        {
          title: "Catalogue legacy /personas",
          body: "`/personas` est **gelé** et **redirigé en permanence** vers `/why` (Matrice Besoins). Ne plus l'utiliser pour créer ou éditer.",
          variant: "slate",
        },
        {
          title: "Décisions d'équipe",
          body: "Engager, apprendre (Spike), ou abandonner reste un **jugement humain** — ce ne sont pas des statuts Spine.",
          variant: "emerald",
        },
      ],
    },
  ],
};

export function buildApplicationSection(projectName: string): FrameworkSection {
  return {
    id: "application",
    title: `Application — ${projectName}`,
    subtitle: `Comment incarner le framework STTNS sur ${projectName} — surfaces et garde-fous du produit réel.`,
    subsections: [
      {
        id: "contexte",
        title: `Contexte — ${projectName}`,
        paragraphs: [
          `Sur **${projectName}**, STTNS n'est pas un reporting : c'est le système nerveux de décision. Avant d'engager du capital-temps, l'équipe répond à trois questions :`,
          "1. Quelle douleur marché ancrons-nous dans la Matrice Besoins ?  \n2. Quel Impact (I:0–3) et quel JTBD portent la Feature ?  \n3. Quels Jours et Risque la Tech accepte-t-elle ?",
        ],
        mermaidDiagrams: [
          {
            caption: `Application ${projectName} — même flux que le produit, du Why au Radar.`,
            code: `flowchart TD
  Why["Matrice Besoins"]:::why
  Disc["Brouillons"]:::disc
  Port["Portfolio V/E"]:::port
  Cyc["Cycles"]:::cyc
  Exec["Kanban"]:::exec
  Rad["Radar"]:::rad

  Why --> Disc --> Port --> Cyc --> Exec --> Rad
  Rad -. "Apprentissage" .-> Why

  classDef why fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
  classDef disc fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,font-weight:bold
  classDef port fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold
  classDef cyc fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,font-weight:bold
  classDef exec fill:#004d40,stroke:#004d40,color:#ffffff,font-weight:bold
  classDef rad fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,font-weight:bold`,
          },
        ],
        callouts: [
          {
            title: "Pratiques 0 / 0 bis",
            body: `Sur **${projectName}**, Filtre 0 (douleur) et Filtre 0 bis (conformité) restent des rituels d'équipe — le code enforce ensuite JTBD + Impact.`,
            variant: "slate",
          },
        ],
      },
      {
        id: "nsm",
        title: "North Star & métriques",
        paragraphs: [
          `La page **North Star** (/nsm) porte la boussole partagée de **${projectName}** : une NSM et ses Input Metrics.`,
          "Bonne pratique : chaque Feature devrait pouvoir nommer quelle Input Metric elle déplace. Ce n'est **pas** un hard-stop API — contrairement à Impact 0 et au lien JTBD.",
        ],
        table: {
          headers: ["Question", "Réponse attendue"],
          rows: [
            ["Quelle NSM ?", "Une métrique unique, lisible Produit et Tech."],
            ["Quelle Input Metric ?", "Le levier immédiat que la Feature pousse."],
            ["Où la suivre ?", "Surface `/nsm` du projet — pas un KPI fantôme hors STTNS."],
          ],
        },
      },
      {
        id: "why-spine",
        title: "Matrice Besoins — Why Spine",
        paragraphs: [
          `Pour **${projectName}**, le Why vit exclusivement dans **/why** : personas Spine, Pain Points, JTBD.`,
          "L'ancien catalogue **`/personas`** est **totalement gelé** et **redirigé en permanence** vers **`/why`**. Ne plus créer ni éditer hors Matrice Besoins.",
        ],
        bullets: [
          "**Personas Spine** — archetypes du projet (segment, description, statuts `todo` · `in_progress` · `review` · `done`).",
          "**Pain Points** — frictions rattachées au persona.",
          "**JTBD** — jobs reliés aux Features via `sttns_context_links` (`context_type: job`).",
        ],
        callouts: [
          {
            title: "Lien Feature → JTBD",
            body: "Codé : aucune Feature finalisable sans job métier lié (`context_type: job`). La Matrice Besoins alimente Brouillons et Portfolio.",
            variant: "emerald",
          },
          {
            title: "Legacy /personas",
            body: "Gel + redirection permanente vers `/why`. DRAFT / READY n'existent pas sur le flux Spine actif.",
            variant: "slate",
          },
        ],
      },
      {
        id: "discipline-ve",
        title: "Discipline Valeur / Effort",
        paragraphs: [
          `Sur **${projectName}**, triade stricte : Produit = Impact **I:0–3** · Tech = Jours + Risque **R:1–3** · Système = Ratio V/E Epic.`,
        ],
        table: {
          headers: ["Acteur", "Responsabilité", "Surface"],
          rows: [
            ["**Produit**", "Impact I:0–3 + JTBD (`context_type: job`)", "Brouillons · Portfolio"],
            ["**Tech**", "Jours + Risque R:1–3", "Stories · Cycles · Kanban"],
            ["**Système**", "Ratio V/E + hard-stops", "Portfolio · Radar · Arbre"],
          ],
        },
        callouts: [
          {
            title: "Hard block Impact I:0",
            body: "Codé : Feature (et Stories) bloquées à l'entrée en `in_progress` tant que l'Impact reste à 0. Revaloriser ou archiver.",
            variant: "red",
          },
        ],
      },
      {
        id: "execution-radar",
        title: "Exécution, Shape Up & Radar",
        paragraphs: [
          "Une fois le cycle engagé : Stories découpées (plafond 5 jours), Kanban honnête, Radar en fin de cycle.",
          "Si **Shape Up** est activé (`executionUnit: feature` + `epicEqualsCycle`) : le cycle s'aligne sur la Feature ; l'exécution se lit au Kanban Features — sans court-circuiter JTBD ni Impact.",
        ],
        bullets: [
          "**Cycles** — capacité et objectif.",
          "**Kanban** — flux `todo` → `in_progress` → `review` → `done`.",
          "**Radar** — orphelins JTBD, JTBD fantômes, stagnants, Impact 0 → retour `/why`.",
          "**Arbre / Mind Map** — lecture transverse du même Spine.",
        ],
        callouts: [
          {
            title: `Cap sur ${projectName}`,
            body: "Le chapitre Scoring V/E de l'Aide reste la ground truth de notation. Application n'invente aucune règle locale — elle pointe les surfaces du projet.",
            variant: "emerald",
          },
        ],
      },
    ],
  };
}
