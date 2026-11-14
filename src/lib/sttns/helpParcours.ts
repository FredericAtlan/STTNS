/**
 * Aide métier — chapitre « Parcours outil ».
 * De la douleur (`/why`) au delivery (`/kanban`), avec Spine / Mindmap en cartes.
 */

import type { FrameworkSection } from "@/lib/sttns/frameworkContent";

export const HELP_PARCOURS: FrameworkSection = {
  id: "parcours",
  title: "Parcours outil STTNS",
  subtitle:
    "De la douleur au delivery — six surfaces linéaires, deux cartes transverses. L'intention avant les clics.",
  subsections: [
    {
      id: "intention",
      title: "L'intention du parcours",
      paragraphs: [
        "STTNS ne se lit pas comme un tableau de bord : il se lit comme un **flux d'apprentissage**. Le parcours va de la douleur à la livraison, puis boucle par le Radar pour corriger le cap.",
        "Six surfaces linéaires portent la décision. Deux cartes transverses (Arbre et Mind Map) donnent la lecture d'ensemble à tout moment. Chaque surface a un rôle unique — on ne mélange pas la douleur et la priorisation, ni la priorisation et l'exécution.",
      ],
      mermaidDiagrams: [
        {
          caption:
            "Parcours canonique — Matrice Besoins → Brouillons → Portfolio → Cycles → Stories & Kanban → Radar. Le Radar renvoie vers la Matrice Besoins : c'est une boucle.",
          code: `flowchart TD
  Why["Matrice Besoins<br/>Douleur · Personas · JTBD"]:::why
  Disc["Brouillons<br/>Tableau de réunion"]:::disc
  Portf["Portfolio<br/>Priorisation Valeur / Effort"]:::portf
  Cyc["Cycles<br/>Engagement dans le temps"]:::cyc
  Sto["Stories & Kanban<br/>Exécution disciplinée"]:::sto
  Rad["Radar<br/>Hygiène & apprentissage"]:::rad

  Why --> Disc --> Portf --> Cyc --> Sto --> Rad
  Rad -. "Retour douleur" .-> Why

  classDef why fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
  classDef disc fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,font-weight:bold
  classDef portf fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold
  classDef cyc fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,font-weight:bold
  classDef sto fill:#004d40,stroke:#004d40,color:#ffffff,font-weight:bold
  classDef rad fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,font-weight:bold`,
        },
      ],
      callouts: [
        {
          title: "Principe",
          body: "Une surface = une intention. *Pourquoi ?* → Matrice Besoins. *Quoi prioriser ?* → Portfolio. *Qui fait quoi maintenant ?* → Kanban. Aucun raccourci.",
          variant: "emerald",
        },
      ],
    },
    {
      id: "matrice-besoins",
      title: "Matrice Besoins — comprendre la douleur",
      paragraphs: [
        "Point d'entrée du parcours. On y matérialise les **personas Spine**, leurs Pain Points et leurs Jobs-To-Be-Done. La question posée est : **pour qui souffre-t-on, et de quelle douleur ?**",
        "L'ancien catalogue **`/personas`** est **totalement gelé** et **redirigé en permanence** vers **`/why`** (Matrice Besoins). Ne plus créer ni éditer hors Spine Why.",
      ],
      bullets: [
        "**Intention** — rendre la douleur explicite et opposable ; sortir de la préférence personnelle.",
        "**Sortie attendue** — personas ancrés, Pain Points clairs, JTBD reliés à la promesse produit.",
        "**Signal d'échec** — Feature sans lien JTBD (`context_type: job`) → hard block à la finalisation / exécution.",
      ],
      callouts: [
        {
          title: "Legacy /personas",
          body: "Gel + redirection permanente vers `/why`. Les anciens statuts DRAFT / READY n'appartiennent pas au flux Spine actif.",
          variant: "slate",
        },
      ],
    },
    {
      id: "discovery",
      title: "Brouillons Epic→Feature→Story — cadrer en réunion",
      paragraphs: [
        "Tableau de réunion pour **créer des brouillons** Epic · Feature · Story — au démarrage du projet, ou pour en ajouter ensuite. On cadre ensemble ; **Créer au Spine** pousse les lignes en todo. La question posée est : **qu'est-ce qu'on formalise maintenant ?**",
      ],
      bullets: [
        "**Intention** — préparer des objets Spine en brouillon, sans coder.",
        "**Sortie attendue** — Features avec Impact **I:0–3** et un lien JTBD (`context_type: job`) explicite.",
        "**Discipline** — engager, Spike / apprendre, ou abandonner : **jugement d'équipe** — ce ne sont pas des statuts Spine.",
        "**Garde-fou** — Impact **I:0** bloque le passage en `in_progress` une fois en exécution.",
      ],
    },
    {
      id: "portfolio",
      title: "Portfolio — prioriser avec la boussole V/E",
      paragraphs: [
        "Salle de priorisation stratégique. On compare des Epics via leur Ratio Valeur / Effort. La question posée est : **où mettre le prochain jour d'ingénierie ?**",
      ],
      bullets: [
        "**Intention** — arbitrer sur des agrégats lisibles, pas sur des convictions.",
        "**Sortie attendue** — une short-list d'Epics candidats au cycle suivant.",
        "**Garde-fou** — une Feature à Impact **I:0** ne passe pas en `in_progress`, même si son Epic est bien classé.",
        "**Triade** — Produit = Impact I:0–3 · Tech = Jours + Risque R:1–3 · Système = Ratio V/E — seule boussole de scoring.",
      ],
      callouts: [
        {
          title: "Boussole Portfolio",
          body: "$$\\text{Ratio V/E}_{\\text{Epic}} = \\dfrac{\\sum \\text{Impact}_{\\text{Feature}}}{\\sum \\text{Jours}_{\\text{Story}}}$$",
          variant: "slate",
        },
      ],
    },
    {
      id: "cycles",
      title: "Cycles — engager la capacité",
      paragraphs: [
        "Cadre temporel d'engagement. On transforme la priorité Portfolio en promesse réaliste (capacité, focus, objectif). La question posée est : **qu'est-ce qui est vraiment livrable dans ce cycle ?**",
      ],
      bullets: [
        "**Intention** — protéger la capacité de l'équipe contre les entrées de dernière minute.",
        "**Sortie attendue** — un cycle avec un objectif clair et un budget en jours honnête.",
        "**Mode Shape Up** — le cycle peut s'aligner sur la Feature ; l'exécution se lit alors au Kanban Features.",
      ],
    },
    {
      id: "execution",
      title: "Stories & Kanban — exécuter sans dériver",
      paragraphs: [
        "Salle d'exécution disciplinée. Les Stories portent la réalisation et l'incertitude technique (**Jours + Risque**). Le Kanban montre l'état réel, pas l'état rêvé.",
      ],
      bullets: [
        "**Intention Stories** — décrire un incrément testable, relié à sa Feature parente.",
        "**Intention Kanban** — voir où l'on bloque, pas décorer un rapport.",
        "**Flux Spine** — `todo` → `in_progress` → `review` → `done`. Quatre états canoniques, pas plus.",
        "**DoD strict** — critères d'acceptation et lien Feature vérifiés avant `done`.",
      ],
    },
    {
      id: "radar",
      title: "Radar — apprendre après avoir livré",
      paragraphs: [
        "Boucle d'apprentissage. On lit l'hygiène du produit : orphelins, stagnation, gaspillage Impact 0, JTBD fantômes. La question posée est : **qu'est-ce que la réalité nous a appris depuis le dernier cycle ?**",
      ],
      bullets: [
        "**Intention** — repérer les signaux faibles avant qu'ils deviennent des dettes.",
        "**Sortie attendue** — un ou deux insights réinjectés dans la Matrice Besoins.",
        "**Rythme** — lecture systématique en début de cycle suivant.",
      ],
    },
    {
      id: "cartes-transverses",
      title: "Cartes transverses — Arbre & Mind Map",
      paragraphs: [
        "Deux cartes complémentaires, utilisables à tout moment du parcours sans casser la séquence :",
      ],
      bullets: [
        "**Arbre** — vue clinique Epic → Feature → Story ; Inspecteur pour éditer sans perdre le contexte.",
        "**Mind Map** — vue réseau pour raconter le produit ou détecter les zones orphelines.",
        "**Aide** — ce playbook ; le Scoring V/E y est la ground truth de notation.",
        "**Paramètres** — équipe, gouvernance, archives ; hors flux de décision.",
      ],
      mermaidDiagrams: [
        {
          caption: "Deux lectures du même Spine — hiérarchie clinique (Arbre) vs réseau narratif (Mind Map).",
          code: `flowchart TD
  Spine["Spine produit<br/>Epic · Feature · Story · Why"]:::spine
  Tree["Arbre<br/>Hiérarchie & Inspecteur"]:::tree
  Map["Mind Map<br/>Réseau & narration"]:::map

  Spine --> Tree
  Spine --> Map

  classDef spine fill:#e2e8f0,stroke:#475569,color:#0f172a,font-weight:bold
  classDef tree fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold
  classDef map fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,font-weight:bold`,
        },
      ],
    },
    {
      id: "rituels",
      title: "Rituels Produit · Tech · Système",
      paragraphs: [
        "Le parcours vit grâce à trois rituels courts. STTNS n'invente pas la cadence — il la rend lisible pour les trois acteurs.",
      ],
      table: {
        headers: ["Rituel", "Fréquence", "Surface", "Sortie attendue"],
        rows: [
          [
            "**Sync Produit**",
            "Hebdo",
            "Matrice Besoins + Brouillons",
            "Douleurs & JTBD à jour ; jugement engager / Spike / abandonner",
          ],
          [
            "**Sync Tech**",
            "Début de cycle",
            "Cycles + Stories",
            "Capacité honnête, Stories découpées, R:3 identifiés",
          ],
          [
            "**Revue Radar**",
            "Fin de cycle",
            "Radar → Matrice Besoins",
            "Insights terrain réinjectés dans la douleur",
          ],
        ],
      },
      mermaidDiagrams: [
        {
          caption:
            "Boucle des rituels — Produit alimente les Brouillons, Tech engage la capacité, le Radar renvoie l'apprentissage vers la douleur.",
          code: `flowchart TD
  Prod["Sync Produit<br/>Hebdo"]:::prod
  Disc["Brouillons<br/>Tableau · Impact · JTBD"]:::disc
  Tech["Sync Tech<br/>Début de cycle"]:::tech
  Exec["Cycle<br/>todo · in_progress · review · done"]:::exec
  Rev["Revue Radar<br/>Fin de cycle"]:::rev
  Why["Matrice Besoins /why"]:::why

  Prod --> Disc --> Tech --> Exec --> Rev
  Rev --> Why
  Why -. "Nouveau tour" .-> Prod

  classDef prod fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
  classDef disc fill:#ede9fe,stroke:#7c3aed,color:#4c1d95,font-weight:bold
  classDef tech fill:#e0f2fe,stroke:#0284c7,color:#0c4a6e,font-weight:bold
  classDef exec fill:#004d40,stroke:#004d40,color:#ffffff,font-weight:bold
  classDef rev fill:#fee2e2,stroke:#b91c1c,color:#7f1d1d,font-weight:bold
  classDef why fill:#ecfdf5,stroke:#059669,color:#064e3b,font-weight:bold`,
        },
      ],
      callouts: [
        {
          title: "Anti-rituel",
          body: "Un rituel qui ne produit pas de décision est supprimé. STTNS n'existe pas pour remplir des cases.",
          variant: "red",
        },
      ],
    },
  ],
};
