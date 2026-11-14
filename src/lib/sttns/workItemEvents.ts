export type WorkItemEventType =
  | "created"
  | "status_changed"
  | "assignee_changed"
  | "parent_changed"
  | "priority_changed"
  | "title_changed"
  | "archived"
  | "restored"
  | "updated"
  | "link_added"
  | "link_removed";

export type WorkItemEventRow = {
  id: string;
  work_item_id: string;
  actor_id: string | null;
  event_type: WorkItemEventType;
  field_name: string | null;
  old_value: string | null;
  new_value: string | null;
  payload: Record<string, unknown> | null;
  created_at: string;
  actor_name?: string | null;
};

const EVENT_LABELS: Record<string, string> = {
  created: "Création",
  status_changed: "Statut",
  assignee_changed: "Assignation",
  parent_changed: "Parent",
  priority_changed: "Priorité",
  title_changed: "Titre",
  archived: "Archivage",
  restored: "Restauration",
  updated: "Modification",
  link_added: "Lien ajouté",
  link_removed: "Lien retiré",
};

const STATUS_LABELS: Record<string, string> = {
  todo: "À faire",
  in_progress: "En cours",
  review: "Revue",
  done: "Terminé",
};

export function formatEventType(eventType: string): string {
  return EVENT_LABELS[eventType] ?? eventType;
}

export function formatEventValue(fieldName: string | null, value: string | null): string {
  if (value === null || value === "null") return "—";
  if (fieldName === "status") return STATUS_LABELS[value] ?? value;
  return value;
}

export function describeEvent(event: WorkItemEventRow): string {
  switch (event.event_type) {
    case "created":
      return "Item créé dans le Spine";
    case "status_changed":
      return `${formatEventValue("status", event.old_value)} → ${formatEventValue("status", event.new_value)}`;
    case "updated":
      return event.field_name === "title"
        ? `Titre modifié`
        : event.field_name === "metadata"
          ? "Métadonnées mises à jour"
          : "Contenu mis à jour";
    case "archived":
      return "Item archivé (soft delete)";
    case "restored":
      return "Item restauré";
    case "link_added":
      return `Lien « ${event.field_name ?? "solves"} » → ${event.new_value ?? "?"}`;
    case "link_removed":
      return `Lien « ${event.field_name ?? "solves"} » retiré`;
    default:
      if (event.old_value || event.new_value) {
        return `${formatEventValue(event.field_name, event.old_value)} → ${formatEventValue(event.field_name, event.new_value)}`;
      }
      return formatEventType(event.event_type);
  }
}
