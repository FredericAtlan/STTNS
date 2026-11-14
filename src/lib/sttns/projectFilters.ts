import type { SttnsProject } from "@/types/sttns";

export type ProjectTimeframePreset = "7d" | "30d" | "quarter" | "12m" | "all" | "custom";
export type ProjectHealthBand = "all" | "good" | "watch" | "risk";
export type ProjectValidationMode = "all" | "peer_ceo" | "hierarchical";
export type ProjectStatusFilter = "all" | "active" | "inactive";

export interface ProjectFilterState {
  name: string;
  status: ProjectStatusFilter;
  health: ProjectHealthBand;
  mode: ProjectValidationMode;
  range: ProjectTimeframePreset;
  from: string;
  to: string;
}

export function parseProjectFilters(
  raw: Record<string, string | string[] | undefined>
): ProjectFilterState {
  const read = (key: string) => {
    const value = raw[key];
    return Array.isArray(value) ? value[0] : value;
  };

  return {
    name: (read("name") ?? "").trim(),
    status: normalizeStatus(read("status")),
    health: normalizeHealthBand(read("health")),
    mode: normalizeValidationMode(read("mode")),
    range: normalizePreset(read("range"), read("from"), read("to")),
    from: normalizeDate(read("from")),
    to: normalizeDate(read("to")),
  };
}

export function applyProjectFilters(projects: SttnsProject[], filters: ProjectFilterState) {
  return projects.filter((project) => {
    if (filters.name) {
      const haystack = [
        project.name,
        project.slug,
        project.nsm_label,
        project.nsm_description ?? "",
        project.description ?? "",
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(filters.name.toLowerCase())) return false;
    }

    if (filters.status !== "all") {
      const expected = filters.status === "active";
      if (project.is_active !== expected) return false;
    }

    if (filters.mode !== "all" && project.validation_mode !== filters.mode) {
      return false;
    }

    if (filters.health !== "all") {
      const band = getHealthBand(project.consensus_percent);
      if (band !== filters.health) return false;
    }

    const { from, to } = resolveDateBounds(filters);
    if (from || to) {
      const createdAt = new Date(project.created_at);
      if (from && createdAt < from) return false;
      if (to && createdAt > to) return false;
    }

    return true;
  });
}

export function resolveDateBounds(filters: Pick<ProjectFilterState, "range" | "from" | "to">) {
  if (filters.range === "all") return { from: null as Date | null, to: null as Date | null };

  if (filters.range === "custom") {
    const from = filters.from ? startOfDay(filters.from) : null;
    const to = filters.to ? endOfDay(filters.to) : null;
    return { from, to };
  }

  const now = new Date();
  const to = endOfDay(toDateInputValue(now));
  const from = startOfDay(toDateInputValue(now));

  switch (filters.range) {
    case "7d":
      from.setDate(from.getDate() - 6);
      return { from, to };
    case "30d":
      from.setDate(from.getDate() - 29);
      return { from, to };
    case "quarter":
      from.setMonth(from.getMonth() - 3);
      return { from, to };
    case "12m":
      from.setMonth(from.getMonth() - 12);
      return { from, to };
    default:
      return { from: null, to: null };
  }
}

export function getHealthBand(consensusPercent: number): ProjectHealthBand {
  if (consensusPercent >= 80) return "good";
  if (consensusPercent >= 60) return "watch";
  return "risk";
}

export function projectHealthLabel(band: ProjectHealthBand) {
  switch (band) {
    case "good":
      return "Healthy";
    case "watch":
      return "Watch";
    case "risk":
      return "At risk";
    default:
      return "All health";
  }
}

export function projectModeLabel(mode: ProjectValidationMode) {
  switch (mode) {
    case "peer_ceo":
      return "Peer CEO";
    case "hierarchical":
      return "Hierarchical";
    default:
      return "All modes";
  }
}

export function projectStatusLabel(status: ProjectStatusFilter) {
  switch (status) {
    case "active":
      return "Active";
    case "inactive":
      return "Inactive";
    default:
      return "All status";
  }
}

export function projectRangeLabel(range: ProjectTimeframePreset) {
  switch (range) {
    case "7d":
      return "7 days";
    case "30d":
      return "30 days";
    case "quarter":
      return "Quarter";
    case "12m":
      return "12 months";
    case "custom":
      return "Custom date";
    default:
      return "All time";
  }
}

function normalizeHealthBand(value: string | undefined): ProjectHealthBand {
  if (value === "good" || value === "watch" || value === "risk") return value;
  return "all";
}

function normalizeStatus(value: string | undefined): ProjectStatusFilter {
  if (value === "active" || value === "inactive") return value;
  return "all";
}

function normalizeValidationMode(value: string | undefined): ProjectValidationMode {
  if (value === "peer_ceo" || value === "hierarchical") return value;
  return "all";
}

function normalizePreset(
  value: string | undefined,
  from: string | undefined,
  to: string | undefined
): ProjectTimeframePreset {
  if (from || to) return "custom";
  if (value === "7d" || value === "30d" || value === "quarter" || value === "12m" || value === "custom") {
    return value;
  }
  return "all";
}

function normalizeDate(value: string | undefined) {
  if (!value) return "";
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : "";
}

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfDay(dateValue: string) {
  const date = new Date(`${dateValue}T00:00:00`);
  date.setHours(0, 0, 0, 0);
  return date;
}

function endOfDay(dateValue: string) {
  const date = new Date(`${dateValue}T23:59:59.999`);
  return date;
}
