import type { SttnsSquadProjectRole } from "@/types/sttns";

export const SQUAD_ROLE_LABELS: Record<SttnsSquadProjectRole, string> = {
  viewer: "Lecteur",
  editor: "Éditeur",
  ceo_admin: "Admin projet",
};

export const SQUAD_ROLE_DESCRIPTIONS: Record<SttnsSquadProjectRole, string> = {
  viewer: "Lecture seule — Vision, Epics/Features et Exécution Kanban sans modification.",
  editor: "Écriture sur le Spine — Why, Epics/Features, Exécution (pas les paramètres).",
  ceo_admin: "Gouvernance complète — équipe, workflow et archivage.",
};

export const SQUAD_ROLE_BADGE_CLASS: Record<SttnsSquadProjectRole, string> = {
  viewer: "bg-zinc-100 text-zinc-700 ring-zinc-200",
  editor: "bg-sky-100 text-sky-800 ring-sky-200",
  ceo_admin: "bg-emerald-100 text-emerald-800 ring-emerald-200",
};

const RANK: Record<SttnsSquadProjectRole, number> = {
  viewer: 0,
  editor: 1,
  ceo_admin: 2,
};

export function maxSquadRole(roles: SttnsSquadProjectRole[]): SttnsSquadProjectRole {
  if (roles.length === 0) return "editor";
  return roles.reduce((best, r) => (RANK[r] > RANK[best] ? r : best), roles[0]);
}

export function canAssignSquadRole(
  actorRole: SttnsSquadProjectRole,
  targetRole: SttnsSquadProjectRole
): boolean {
  if (actorRole !== "ceo_admin") return false;
  if (targetRole === "ceo_admin") return true;
  return true;
}
