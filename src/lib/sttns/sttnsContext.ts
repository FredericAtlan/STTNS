/**
 * Point d'entrée unique — types et contenus d'aide UI (tooltips « ? »).
 * Ne pas confondre avec `spineEditContext.ts` (listes pour slide-overs Spine).
 * Cartographie complète : README.md § Cartographie des fichiers de contexte
 */
export type { SttnsContextHelpKind, SttnsContextHelpContent } from "@/lib/sttns/contextHelp";
export { STTNS_CONTEXT_HELP_KIND, STTNS_CONTEXT_HELP_USAGE } from "@/lib/sttns/contextHelp";

export { PAGE_CONTEXT_HELP } from "@/lib/sttns/pageContextHelp";
export { FRAMEWORK_VALUE_EFFORT } from "@/lib/sttns/valueEffortGuide";

export {
  FEATURES_HUB_HELP,
  FEATURES_WORKSPACE_HELP,
  MATRIX_VIEW_HELP,
  FEATURE_DETAIL_HELP,
  INITIATIVE_FORM_HELP,
  PEER_REVIEW_HELP,
  MODULES_PAGE_HELP,
  EPICS_PAGE_HELP,
  SUMMARY_ALERTS_HELP,
  ROADMAP_MATRIX_HELP,
} from "@/lib/sttns/featuresContextHelp";
