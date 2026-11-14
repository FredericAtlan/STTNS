import type { SupabaseClient } from "@supabase/supabase-js";
import {
  EXECUTION_STATUS_LABELS,
  TASK_STATUS_LABELS,
} from "@/lib/sttns/constants";
import { planningDateInputValue } from "@/lib/sttns/planningDates";
import type { SttnsProfile } from "@/types/sttns";

export const PLANNING_FIELD_LABELS: Record<string, string> = {
  assignee_id: "Assigné",
  start_date: "Début",
  due_date: "Fin",
  status: "Statut",
  title: "Titre",
  doc_url: "Doc feature",
  delivery_doc_url: "Doc livraison",
  git_url: "Git",
  execution_auto_deploy: "Livraison auto",
  task_created: "Sous-étape créée",
};

export type PlanningChangeInput = {
  fieldKey: string;
  oldValue: string | null;
  newValue: string | null;
};

function normalizeCompareValue(value: unknown): string | null {
  if (value === undefined || value === null) return null;
  const str = String(value).trim();
  return str.length > 0 ? str : null;
}

/** Compare l'état avant/après et retourne les champs réellement modifiés. */
const FEATURE_DB_TO_HISTORY: Record<string, string> = {
  execution_assignee_id: "assignee_id",
  execution_start_date: "start_date",
  execution_due_date: "due_date",
  execution_auto_deploy: "execution_auto_deploy",
  execution_doc_url: "doc_url",
  execution_delivery_doc_url: "delivery_doc_url",
  execution_git_url: "git_url",
};

export function diffFeaturePlanningPatch(
  before: Record<string, unknown>,
  patch: Record<string, unknown>,
  statusChange?: { oldStatus: string | null; newStatus: string | null } | null
): PlanningChangeInput[] {
  const changes: PlanningChangeInput[] = [];

  for (const [dbKey, fieldKey] of Object.entries(FEATURE_DB_TO_HISTORY)) {
    if (!(dbKey in patch)) continue;
    const oldValue = normalizeCompareValue(before[dbKey]);
    const rawNew = patch[dbKey];
    const newValue =
      fieldKey === "execution_auto_deploy"
        ? normalizeCompareValue(String(rawNew))
        : normalizeCompareValue(rawNew);
    if (oldValue === newValue) continue;
    changes.push({ fieldKey, oldValue, newValue });
  }

  if (
    statusChange?.newStatus &&
    statusChange.oldStatus !== statusChange.newStatus
  ) {
    changes.push({
      fieldKey: "status",
      oldValue: statusChange.oldStatus,
      newValue: statusChange.newStatus,
    });
  }

  return changes;
}

export function diffPlanningPatch(
  before: Record<string, unknown>,
  patch: Record<string, unknown>,
  fieldKeys: string[]
): PlanningChangeInput[] {
  const changes: PlanningChangeInput[] = [];

  for (const fieldKey of fieldKeys) {
    if (!(fieldKey in patch)) continue;
    const oldValue = normalizeCompareValue(before[fieldKey]);
    const newValue = normalizeCompareValue(patch[fieldKey]);
    if (oldValue === newValue) continue;
    changes.push({ fieldKey, oldValue, newValue });
  }

  return changes;
}

export async function recordPlanningChanges(
  supabase: SupabaseClient,
  params: {
    projectId: string;
    initiativeId: string;
    taskId?: string | null;
    changedBy: string | null;
    changes: PlanningChangeInput[];
  }
): Promise<{ ok: true } | { ok: false; error: string }> {
  const rows = params.changes
    .filter((c) => c.oldValue !== c.newValue)
    .map((change) => ({
      project_id: params.projectId,
      initiative_id: params.initiativeId,
      task_id: params.taskId ?? null,
      changed_by: params.changedBy,
      field_key: change.fieldKey,
      old_value: change.oldValue,
      new_value: change.newValue,
    }));

  if (rows.length === 0) return { ok: true };

  const { error } = await supabase.from("sttns_initiative_planning_history").insert(rows);
  if (error) {
    if (error.message.includes("sttns_initiative_planning_history")) {
      return { ok: false, error: error.message };
    }
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

function formatDateValue(value: string | null): string {
  if (!value) return "—";
  const normalized = planningDateInputValue(value);
  if (!normalized) return value;
  const d = new Date(`${normalized}T12:00:00`);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
}

function profileName(profileId: string | null, profilesById: Record<string, SttnsProfile>): string {
  if (!profileId) return "Non assigné";
  const profile = profilesById[profileId];
  if (!profile) return "Membre";
  return profile.full_name?.trim() || profile.email?.split("@")[0] || "Membre";
}

export function formatPlanningValue(
  fieldKey: string,
  value: string | null,
  profilesById: Record<string, SttnsProfile>
): string {
  if (!value) return "—";

  if (fieldKey === "assignee_id") {
    return profileName(value, profilesById);
  }
  if (fieldKey === "start_date" || fieldKey === "due_date") {
    return formatDateValue(value);
  }
  if (fieldKey === "status") {
    return (
      EXECUTION_STATUS_LABELS[value as keyof typeof EXECUTION_STATUS_LABELS] ??
      TASK_STATUS_LABELS[value as keyof typeof TASK_STATUS_LABELS] ??
      value
    );
  }
  if (fieldKey === "execution_auto_deploy") {
    return value === "true" ? "Activée" : "Désactivée";
  }
  if (fieldKey === "task_created") {
    return value;
  }
  if (fieldKey.endsWith("_url")) {
    try {
      const url = new URL(value);
      return url.hostname;
    } catch {
      return value.length > 48 ? `${value.slice(0, 45)}…` : value;
    }
  }

  return value;
}

export function describePlanningChange(
  row: {
    field_key: string;
    old_value: string | null;
    new_value: string | null;
    task_title?: string | null;
  },
  profilesById: Record<string, SttnsProfile>
): string {
  const label = PLANNING_FIELD_LABELS[row.field_key] ?? row.field_key;
  const scope = row.task_title ? ` · ${row.task_title}` : "";
  const oldLabel = formatPlanningValue(row.field_key, row.old_value, profilesById);
  const newLabel = formatPlanningValue(row.field_key, row.new_value, profilesById);

  if (row.field_key === "task_created") {
    return `Sous-étape créée : ${newLabel}`;
  }
  if (row.field_key === "assignee_id") {
    if (!row.old_value && row.new_value) {
      return `${label} : ${newLabel}${scope}`;
    }
    if (row.old_value && !row.new_value) {
      return `${label} retiré (était ${oldLabel})${scope}`;
    }
    return `${label} : ${oldLabel} → ${newLabel}${scope}`;
  }

  return `${label} : ${oldLabel} → ${newLabel}${scope}`;
}
