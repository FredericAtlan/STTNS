/**
 * Hub Aide STTNS (Playbook) — chapitres et routes.
 * Contenu :
 *  - Scoring V/E : `valueEffortGuide.ts`
 *  - Parcours outil : `helpParcours.ts`
 *  - Framework stratégique : `frameworkContent.ts` (FRAMEWORK_STRATEGIQUE)
 *  - Application projet : `frameworkContent.ts` (buildApplicationSection)
 */

import {
  FRAMEWORK_STRATEGIQUE,
  buildApplicationSection,
  type FrameworkSection,
} from "@/lib/sttns/frameworkContent";
import { HELP_PARCOURS } from "@/lib/sttns/helpParcours";
import { FRAMEWORK_VALUE_EFFORT } from "@/lib/sttns/valueEffortGuide";

export const HELP_CHAPTER_SLUGS = [
  "scoring",
  "parcours",
  "framework",
  "application",
] as const;

export type HelpChapterSlug = (typeof HELP_CHAPTER_SLUGS)[number];

export type HelpChapterMeta = {
  slug: HelpChapterSlug;
  title: string;
  shortTitle: string;
  description: string;
  status: "ready" | "draft";
};

export const HELP_CHAPTERS: HelpChapterMeta[] = [
  {
    slug: "scoring",
    title: "Scoring Valeur / Effort",
    shortTitle: "Scoring V/E",
    description:
      "Triade Produit · Tech · Système — Impact, Jours, Risque, Ratio Epic et garde-fous.",
    status: "ready",
  },
  {
    slug: "parcours",
    title: "Parcours outil",
    shortTitle: "Parcours",
    description:
      "De la Matrice Besoins au Radar — intentions, rituels et boucle d'apprentissage.",
    status: "ready",
  },
  {
    slug: "framework",
    title: "Framework stratégique",
    shortTitle: "Framework",
    description:
      "Manifeste capital-temps, pratiques Filtre 0 / 0 bis, surfaces Spine et garde-fous codés.",
    status: "ready",
  },
  {
    slug: "application",
    title: "Application projet",
    shortTitle: "Application",
    description:
      "Déclinaison terrain du framework sur le projet courant.",
    status: "ready",
  },
];

export function isHelpChapterSlug(value: string): value is HelpChapterSlug {
  return (HELP_CHAPTER_SLUGS as readonly string[]).includes(value);
}

export function helpChapterPath(projectSlug: string, chapter: HelpChapterSlug): string {
  return `/projects/${projectSlug}/help/${chapter}`;
}

export function helpHubPath(projectSlug: string): string {
  return `/projects/${projectSlug}/help`;
}

export function getScoringHelpSection(): FrameworkSection {
  return FRAMEWORK_VALUE_EFFORT;
}

export function getParcoursHelpSection(): FrameworkSection {
  return HELP_PARCOURS;
}

export function getFrameworkHelpSection(): FrameworkSection {
  return FRAMEWORK_STRATEGIQUE;
}

export function getApplicationHelpSection(projectName: string): FrameworkSection {
  return buildApplicationSection(projectName);
}

export const HELP_PLACEHOLDER_BODY =
  "Contenu en cours de rédaction…\n\nCe chapitre du Playbook STTNS sera complété prochainement. En attendant, consultez le **Scoring Valeur / Effort** pour la ground truth de notation.";
