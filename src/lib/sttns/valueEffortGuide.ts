/**
 * Aide métier — Scoring Valeur / Effort.
 * Source de vérité UI : Hub Aide `/help/scoring` · export `sttns-aide-scoring.md`.
 */

import type { FrameworkSection } from "@/lib/sttns/frameworkContent";
import { STTNS_APP_VERSION_LABEL } from "@/lib/sttns/productVersion";

/**
 * Playbook Scoring V/E — triade Produit · Tech · Système.
 * Statuts Spine uniquement : todo · in_progress · review · done.
 */
export const FRAMEWORK_VALUE_EFFORT: FrameworkSection = {
  id: "scoring-ve",
  title: `Scoring Valeur / Effort (${STTNS_APP_VERSION_LABEL})`,
  subtitle:
    "Triade stricte Produit · Tech · Système — Impact, Jours + Risque, Ratio V/E. Aucune autre méthode de scoring.",
  subsections: [
    {
      id: "philosophie",
      title: "1. Philosophie — la triade Produit · Tech · Système",
      paragraphs: [
        "STTNS pose une règle simple : personne ne détient toute la vérité, et personne ne peut saisir à la fois la Valeur et le Coût. Trois rôles, trois responsabilités, trois zones de saisie **strictement disjointes**.",
        "**Produit** = Impact **I:0–3**. **Tech** = Jours + Risque **R:1–3**. **Système** = Ratio V/E Epic (roll-up automatique, zéro saisie).",
        "```mermaid\nflowchart TD\n  Produit[\"Produit\\nImpact I:0–3\\nSens & valeur métier\"]:::produit\n  Tech[\"Tech\\nJours & Risque R:1–3\\nCoût & incertitude\"]:::tech\n  Systeme[\"Système STTNS\\nRatio V/E Epic\\nRoll-up automatique\"]:::systeme\n  Produit --> Systeme\n  Tech --> Systeme\n  classDef produit fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:2px;\n  classDef tech fill:#fde68a,stroke:#d97706,color:#78350f,stroke-width:2px;\n  classDef systeme fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px;\n```",
      ],
      callouts: [
        {
          title: "Règle d'or",
          body: "Deux mains ne saisissent jamais le même score. Le Produit ne fixe pas les jours ; la Tech ne fixe pas l'Impact ; le Système ne fixe rien.",
          variant: "emerald",
        },
        {
          title: "Une seule boussole",
          body: "La priorisation Spine repose uniquement sur cette triade. Toute autre grille de scoring héritée est **hors doctrine** — ne plus la saisir ni l'utiliser pour arbitrer.",
          variant: "red",
        },
      ],
    },
    {
      id: "objets-spine",
      title: "2. Les objets Spine — Story · Feature · Epic",
      paragraphs: [
        "Trois strates, une seule constitution. Chaque objet a un rôle défini et un seul saisisseur légitime. Statuts d'exécution : **`todo` · `in_progress` · `review` · `done`** uniquement.",
        "```mermaid\nflowchart TD\n  Epic[\"Epic\\nCompass macro-stratégique\\n∑ Impact · ∑ Jours · Ratio V/E\"]:::epic\n  F1[\"Feature\\nUnité de valeur produit\\nImpact I · JTBD lié\"]:::feature\n  F2[\"Feature\\nUnité de valeur produit\\nImpact I · JTBD lié\"]:::feature\n  S1[\"Story\\nUnité d'exécution tech\\nJours · Risque\"]:::story\n  S2[\"Story\\nUnité d'exécution tech\\nJours · Risque\"]:::story\n  S3[\"Story\\nUnité d'exécution tech\\nJours · Risque\"]:::story\n  Epic --> F1\n  Epic --> F2\n  F1 --> S1\n  F1 --> S2\n  F2 --> S3\n  classDef epic fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px;\n  classDef feature fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:2px;\n  classDef story fill:#fde68a,stroke:#d97706,color:#78350f,stroke-width:2px;\n```",
      ],
      table: {
        headers: ["Objet", "Rôle produit", "Qui saisit quoi"],
        rows: [
          [
            "**Story**",
            "Unité d'exécution technique — lot livrable en quelques jours.",
            "**Tech** : Jours (0.5 à 5) + Risque (R:1 · R:2 · R:3).",
          ],
          [
            "**Feature**",
            "Unité de valeur produit — bénéfice utilisateur rattaché à un JTBD.",
            "**Produit** : Impact (I:0 à I:3) + lien JTBD (`context_type: job`) obligatoire.",
          ],
          [
            "**Epic**",
            "Compass stratégique — chantier lisible en un ratio.",
            "**Système** : ∑ Impact, ∑ Jours et Ratio V/E — aucune saisie manuelle.",
          ],
        ],
      },
      callouts: [
        {
          title: "Mode Shape Up",
          body: "Quand un Epic vaut un cycle et qu'aucune Story n'est encore posée, la Feature porte temporairement Jours + Risque, jusqu'à l'apparition des Stories.",
          variant: "slate",
        },
        {
          title: "Statuts Spine",
          body: "Seuls `todo`, `in_progress`, `review`, `done` existent en exécution. Pas de statut système READY / DRAFT sur le flux Spine actif.",
          variant: "slate",
        },
      ],
    },
    {
      id: "valeur-impact",
      title: "3. La Valeur — Impact I:0 à I:3 (Produit)",
      paragraphs: [
        "L'Impact vit sur la Feature. C'est le vote produit : combien ce chantier déplace l'aiguille métier. Une seule dimension — pas de reach, pas de confiance moyennée, pas d'effort dilué dedans.",
        "Quatre paliers volontaires. Le zéro existe explicitement pour dire non sans détour.",
      ],
      table: {
        headers: ["Palier", "Libellé", "Sens produit"],
        rows: [
          ["**I:0**", "Gaspillage", "Aucun impact démontrable — revaloriser, archiver, ou sortir du MVP."],
          ["**I:1**", "Moyen", "Confort marginal ou dette contenue — utile mais jamais prioritaire."],
          ["**I:2**", "Fort", "Débloque une adoption, une rétention ou une conversion mesurable."],
          ["**I:3**", "Vital", "Sans cette Feature, la promesse produit s'effondre."],
        ],
      },
      callouts: [
        {
          title: "Impact = propriété du Produit",
          body: "Même dans le Tableau de brouillons, l'Impact est un vote assumé. Aucun ticket ne migre en cycle sans note Produit.",
          variant: "emerald",
        },
        {
          title: "Hard block I:0 → `in_progress`",
          body: "Codé : une Feature à **I:0** (et ses Stories) **ne peut pas** passer en `in_progress`. Revaloriser l'Impact, ou archiver.",
          variant: "red",
        },
      ],
    },
    {
      id: "effort-risque",
      title: "4. Effort & Risque — Tech (Jours + R:1–3)",
      paragraphs: [
        "L'Effort se pose en jours. Plafond volontaire **5 jours** par Story : tout dépassement signale un mauvais découpage.",
        "Le Risque est l'inconnu opérationnel (R:1 Connu · R:2 Probable · R:3 Inconnu) — pas une « complexité » abstraite.",
        "```mermaid\nflowchart TD\n  Start[\"Story en todo\"]:::start\n  Jours{{\"Effort ≤ 5 jours ?\"}}\n  Couper[\"Découper en micro-stories\"]:::danger\n  Risque{{\"Niveau de Risque ?\"}}\n  R1[\"R:1 Connu\"]:::ok\n  R2[\"R:2 Probable\"]:::warn\n  R3[\"R:3 Inconnu\\nSpike / POC\"]:::danger\n  Start --> Jours\n  Jours -- Non --> Couper\n  Jours -- Oui --> Risque\n  Risque --> R1\n  Risque --> R2\n  Risque --> R3\n  classDef start fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px;\n  classDef ok fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:2px;\n  classDef warn fill:#fde68a,stroke:#d97706,color:#78350f,stroke-width:2px;\n  classDef danger fill:#fecaca,stroke:#dc2626,color:#7f1d1d,stroke-width:2px;\n```",
      ],
      table: {
        headers: ["Palier", "Libellé", "Recommandation"],
        rows: [
          ["**R:1**", "Connu", "Techno maîtrisée — exécution linéaire."],
          ["**R:2**", "Probable", "Documenté mais jamais livré par l'équipe — cadrer avant."],
          ["**R:3**", "Inconnu", "Spike / POC avant engagement calendaire fort."],
        ],
      },
      bullets: [
        "**Story > 5 jours** → couper.",
        "**Effort Feature** = ∑ Jours des Stories dès qu'une Story existe (plus de saisie manuelle).",
        "**R:3** = drapeau visible, pas un hard block d'exécution.",
      ],
    },
    {
      id: "ratio-epic",
      title: "5. Ratio V/E — Système (Epic)",
      paragraphs: [
        "L'Epic n'accepte aucune saisie de valeur ou d'effort. Le Système agrège Impact des Features et Jours des Stories, puis divise.",
        "Boussole comparative entre Epics — le jugement stratégique reste humain.",
      ],
      callouts: [
        {
          title: "Formule V/E Epic",
          body: "$$\\mathrm{Ratio}_{\\mathrm{V/E}} = \\frac{\\sum \\mathrm{Impact}_{\\mathrm{Features}}}{\\sum \\mathrm{Jours}_{\\mathrm{Stories}}}$$\n\nAffiche « — » si l'effort agrégé est nul.",
          variant: "emerald",
        },
      ],
      table: {
        headers: ["Fourchette", "Lecture", "Attitude typique"],
        rows: [
          ["**≥ 2**", "Fort rendement par jour", "Engager le cycle en priorité."],
          ["**1 – 2**", "Rendement standard", "Séquencer normalement."],
          ["**< 1**", "Coûteux pour l'impact promis", "Redécouper, revoir l'Impact, ou justifier stratégiquement."],
        ],
      },
    },
    {
      id: "garde-fous",
      title: "6. Garde-fous codés",
      paragraphs: [
        "Filets **matérialisés dans le code** — pas des alertes cosmétiques.",
        "```mermaid\nflowchart TD\n  Entry[\"Passage vers in_progress\"]:::start\n  G1{{\"Impact Feature ≥ 1 ?\"}}\n  G2{{\"JTBD lié\\ncontext_type: job ?\"}}\n  Block[\"Hard block\"]:::danger\n  Go[\"in_progress autorisé\"]:::ok\n  Entry --> G1\n  G1 -- Non --> Block\n  G1 -- Oui --> G2\n  G2 -- Non --> Block\n  G2 -- Oui --> Go\n  classDef start fill:#e2e8f0,stroke:#475569,color:#0f172a,stroke-width:2px;\n  classDef ok fill:#d1fae5,stroke:#059669,color:#064e3b,stroke-width:2px;\n  classDef danger fill:#fecaca,stroke:#dc2626,color:#7f1d1d,stroke-width:2px;\n```",
      ],
      callouts: [
        {
          title: "Hard block Impact I:0",
          body: "Feature (et Stories enfants) bloquées à l'entrée en `in_progress` tant que l'Impact reste à **0**.",
          variant: "red",
        },
        {
          title: "JTBD obligatoire (`context_type: job`)",
          body: "Aucune Feature finalisable / pilotable sans lien job métier. Pas de JTBD → pas de finalisation des brouillons / pas d'exécution saine.",
          variant: "red",
        },
        {
          title: "Catalogue legacy /why",
          body: "L'ancien catalogue `/personas` (statuts DRAFT/READY) est **gelé** et **redirigé en permanence** vers `/why` (Matrice Besoins Spine).",
          variant: "slate",
        },
      ],
    },
    {
      id: "decisions",
      title: "7. Jugement d'équipe — engager, apprendre, abandonner",
      paragraphs: [
        "Engager un cycle, Spike / apprendre, ou abandonner reste un **jugement humain**. Ces verbes ne sont **pas** des statuts Spine — les seuls états d'exécution restent `todo` · `in_progress` · `review` · `done`.",
      ],
      table: {
        headers: ["Attitude", "Déclencheur V/E typique", "Action"],
        rows: [
          ["**Engager**", "Impact ≥ 2, risque R:1–R:2", "Cycle / Kanban — passage vers `in_progress` si garde-fous OK."],
          ["**Apprendre**", "Impact incertain ou R:3 dominant", "Spike, test terrain — rester en `todo` / Spike dédié."],
          ["**Abandonner**", "Impact 0 ou JTBD introuvable", "Archiver — ne jamais forcer `in_progress`."],
        ],
      },
      callouts: [
        {
          title: "La boussole reste humaine",
          body: "Le Ratio V/E objective ; il ne remplace pas le jugement stratégique.",
          variant: "emerald",
        },
      ],
    },
  ],
};
