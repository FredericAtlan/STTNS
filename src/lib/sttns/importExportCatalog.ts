/**
 * Hub Import / Export — catalogue et manifest STTNS Spine v2.
 * Les liaisons reposent sur des UUID stables (parent_id, context_links, solves).
 */

export const STTNS_EXPORT_FORMAT = "sttns-spine-pack-v2" as const;

export type ExportEntityKey =
  | "why"
  | "discovery"
  | "cycles"
  | "epics"
  | "features"
  | "stories"
  | "tasks";

export type ExportManifest = {
  format: typeof STTNS_EXPORT_FORMAT;
  version: 2;
  projectName: string;
  projectSlug: string;
  exportDate: string;
  exportedBy: string;
  entities: ExportEntityKey[];
  files: string[];
  counts: Partial<Record<ExportEntityKey | "jtbd_solves" | "feature_context", number>>;
  linkColumns: {
    parent_id: string;
    feature_context: string;
    jtbd_solves: string;
  };
};

export const EXPORT_ENTITY_CATALOG: {
  key: ExportEntityKey;
  label: string;
  description: string;
  surface: string;
  /** Fichiers ZIP (chemins relatifs) */
  files: string[];
  includesLinks?: boolean;
}[] = [
  {
    key: "why",
    label: "Matrice Besoins",
    description: "Personas, Pain Points, JTBD (Spine Why).",
    surface: "/why",
    files: ["why/personas.csv", "why/pain_points.csv", "why/jtbd.csv", "links/jtbd_solves.csv"],
    includesLinks: true,
  },
  {
    key: "discovery",
    label: "Sessions Brouillons",
    description: "Sessions Discovery partagées (JSON — pas encore au Spine).",
    surface: "/discovery",
    files: ["discovery/sessions.json"],
  },
  {
    key: "epics",
    label: "Epics",
    description: "Work items type epic.",
    surface: "/portfolio",
    files: ["spine/epics.csv"],
  },
  {
    key: "features",
    label: "Features",
    description: "Features + liens JTBD (context_links).",
    surface: "/portfolio",
    files: ["spine/features.csv", "links/feature_context.csv"],
    includesLinks: true,
  },
  {
    key: "stories",
    label: "Stories",
    description: "Stories Spine (parent = feature, cycle optionnel).",
    surface: "/user-stories",
    files: ["spine/stories.csv"],
  },
  {
    key: "tasks",
    label: "Tasks",
    description: "Tâches enfants des stories.",
    surface: "/kanban",
    files: ["spine/tasks.csv"],
  },
  {
    key: "cycles",
    label: "Cycles",
    description: "Planification (dates, capacité).",
    surface: "/cycles",
    files: ["cycles/cycles.csv"],
  },
];

export const ALL_EXPORT_ENTITY_KEYS: ExportEntityKey[] = EXPORT_ENTITY_CATALOG.map(
  (e) => e.key
);

export function filesForEntitySelection(selected: ExportEntityKey[]): string[] {
  const set = new Set<string>();
  for (const key of selected) {
    const entry = EXPORT_ENTITY_CATALOG.find((e) => e.key === key);
    if (entry) {
      for (const f of entry.files) set.add(f);
    }
  }
  return Array.from(set).sort();
}

export function parseMetadataJson(raw: unknown): Record<string, unknown> {
  if (raw == null || raw === "") return {};
  if (typeof raw === "object" && !Array.isArray(raw)) {
    return raw as Record<string, unknown>;
  }
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      return {};
    }
  }
  return {};
}

export function workItemRowToCsv(row: {
  id: string;
  type: string;
  title: string;
  code: string | null;
  status: string;
  parent_id: string | null;
  cycle_id: string | null;
  sort_order: number | null;
  assignee_id?: string | null;
  metadata: unknown;
}) {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    code: row.code ?? "",
    status: row.status,
    parent_id: row.parent_id ?? "",
    cycle_id: row.cycle_id ?? "",
    sort_order: row.sort_order ?? 0,
    assignee_id: row.assignee_id ?? "",
    metadata_json: JSON.stringify(row.metadata ?? {}),
  };
}
