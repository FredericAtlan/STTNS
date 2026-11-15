"use server";

import { revalidatePath } from "next/cache";
import { saveWorkItem } from "@/lib/sttns/workItems";
import { requireProjectEditor } from "@/lib/sttns/access";
import {
  archiveWhyItemIdSchema,
  jtbdInputSchema,
  painPointInputSchema,
  personaInputSchema,
} from "@/lib/sttns/schema";
import type {
  JTBDInput,
  PainPointInput,
  PersonaInput,
  WorkItemStatus,
} from "@/lib/sttns/types";

import { archiveWorkItemAction } from "@/app/projects/[slug]/work-items/actions";
import { createClient } from "@/lib/supabase/server";
import {
  isPersonaPhotoMimeType,
  PERSONA_PHOTO_MAX_BYTES,
} from "@/lib/sttns/personaPhoto";
import {
  clearSpinePersonaAvatarInDb,
  removePersonaPhotoFromStorage,
  updateSpinePersonaAvatarInDb,
  uploadPersonaPhotoToStorage,
} from "@/lib/sttns/personaPhotoStorage";
import type { PersonaMetadata } from "@/lib/sttns/types";
import { parseMetadataDocUrlInput, readMetadataDocUrl } from "@/lib/sttns/workItemMetadata";
import {
  syncLegacyTierFromSpineSegment,
} from "@/lib/sttns/personaSegmentBridge";
import { isPainPointJob } from "@/lib/sttns/whySpine";

const SPINE_STATUSES = ["todo", "in_progress", "review", "done"] as const;

function normalizeSpineStatusForSave(value: unknown): WorkItemStatus {
  return SPINE_STATUSES.includes(value as WorkItemStatus)
    ? (value as WorkItemStatus)
    : "todo";
}

/**
 * Récupère le statut Spine existant d'un work item (any type Why).
 * Utilisé pour préserver le statut lors des saves Why (create = todo,
 * update = statut existant sinon "todo" par défaut).
 */
async function fetchExistingWorkItemStatus(
  supabase: Awaited<ReturnType<typeof createClient>>,
  workItemId: string,
  projectId: string
): Promise<WorkItemStatus> {
  const { data } = await supabase
    .from("sttns_work_items")
    .select("status")
    .eq("id", workItemId)
    .eq("project_id", projectId)
    .maybeSingle();

  return normalizeSpineStatusForSave(data?.status);
}

export async function savePersonaAction(
  projectId: string,
  projectSlug: string,
  data: PersonaInput
) {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const validation = personaInputSchema.safeParse(data);
  if (!validation.success) {
    return { ok: false, error: "Validation échouée", issues: validation.error.issues };
  }

  const supabase = await createClient();
  let existingMetadata: PersonaMetadata = {};
  let existingStatus: WorkItemStatus | null = null;

  if (data.id) {
    const { data: existing } = await supabase
      .from("sttns_work_items")
      .select("metadata, status")
      .eq("id", data.id)
      .eq("project_id", projectId)
      .eq("type", "persona")
      .maybeSingle();
    existingMetadata = (existing?.metadata as PersonaMetadata | null) ?? {};
    existingStatus = existing
      ? normalizeSpineStatusForSave(existing.status)
      : null;
  }

  const docParsed =
    data.doc_url !== undefined
      ? parseMetadataDocUrlInput(data.doc_url)
      : { ok: true as const, url: readMetadataDocUrl(existingMetadata) };
  if (!docParsed.ok) return { ok: false, error: docParsed.error };

  const result = await saveWorkItem({
    id: data.id,
    project_id: projectId,
    type: "persona",
    parent_id: null,
    status: existingStatus ?? "todo",
    priority: 3,
    title: data.name,
    code: data.code ?? null,
    sort_order: 0,
    metadata: {
      ...existingMetadata,
      segment: data.segment,
      description: data.description,
      doc_url: docParsed.url,
    },
  });

  if (result.ok) {
    // A2 — best-effort : Why lit uniquement metadata.segment (Spine-only).
    // Ce pont met à jour le tier_label legacy s'il existe, mais un persona
    // sans jumeau legacy ne fait PAS échouer la sauvegarde (silent no-op).
    // Conservé pour ne pas rompre CSV / peer-review qui lisent encore le catalogue.
    try {
      await syncLegacyTierFromSpineSegment(
        supabase,
        projectId,
        data.name,
        data.code ?? null,
        data.segment
      );
    } catch {
      // No-op : le pont legacy n'est pas critique côté Why.
    }
    revalidatePath(`/projects/${projectSlug}/why`);
  }

  return result;
}

export async function archivePersonaAction(
  personaId: string,
  _projectId: string,
  projectSlug: string
) {
  const idCheck = archiveWhyItemIdSchema.safeParse(personaId);
  if (!idCheck.success) {
    return { ok: false as const, error: "Identifiant Persona invalide." };
  }
  // Cascade soft-delete : PP + JTBD enfants (voir archiveWorkItemAction).
  return archiveWorkItemAction(idCheck.data, projectSlug);
}

export async function uploadSpinePersonaPhotoAction(
  projectId: string,
  projectSlug: string,
  personaId: string,
  formData: FormData
): Promise<{ ok: true; avatarUrl: string } | { ok: false; error: string }> {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  if (!personaId) {
    return { ok: false, error: "Persona introuvable." };
  }

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Aucune photo sélectionnée." };
  }

  if (!isPersonaPhotoMimeType(file.type)) {
    return { ok: false, error: "Format accepté : JPG, PNG, WebP ou GIF." };
  }

  if (file.size > PERSONA_PHOTO_MAX_BYTES) {
    return { ok: false, error: "La photo ne doit pas dépasser 5 Mo." };
  }

  const supabase = await createClient();
  const { data: workItem, error: workItemError } = await supabase
    .from("sttns_work_items")
    .select("id")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null)
    .maybeSingle();

  if (workItemError || !workItem) {
    return { ok: false, error: "Persona introuvable." };
  }

  const uploaded = await uploadPersonaPhotoToStorage(projectId, personaId, file);
  if (!uploaded.ok) return uploaded;

  const persisted = await updateSpinePersonaAvatarInDb(
    projectId,
    personaId,
    uploaded.avatarUrl
  );
  if (!persisted.ok) return persisted;

  revalidatePath(`/projects/${projectSlug}/why`);
  return { ok: true, avatarUrl: uploaded.avatarUrl };
}

export async function removeSpinePersonaPhotoAction(
  projectId: string,
  projectSlug: string,
  personaId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  if (!personaId) {
    return { ok: false, error: "Persona introuvable." };
  }

  const supabase = await createClient();
  const { data: workItem, error: workItemError } = await supabase
    .from("sttns_work_items")
    .select("id")
    .eq("id", personaId)
    .eq("project_id", projectId)
    .eq("type", "persona")
    .is("archived_at", null)
    .maybeSingle();

  if (workItemError || !workItem) {
    return { ok: false, error: "Persona introuvable." };
  }

  const removed = await removePersonaPhotoFromStorage(projectId, personaId);
  if (!removed.ok) return removed;

  const cleared = await clearSpinePersonaAvatarInDb(projectId, personaId);
  if (!cleared.ok) return cleared;

  revalidatePath(`/projects/${projectSlug}/why`);
  return { ok: true };
}

function parseJtbdSyntax(statement: string): {
  situation: string;
  motivation: string;
  outcome: string;
} {
  const matches = statement.match(/\[([^\]]+)\]/g) || [];
  return {
    situation: matches[0]?.replace(/[\[\]]/g, "") ?? "",
    motivation: matches[1]?.replace(/[\[\]]/g, "") ?? "",
    outcome: matches[2]?.replace(/[\[\]]/g, "") ?? "",
  };
}

export async function saveJTBDAction(
  projectId: string,
  projectSlug: string,
  data: JTBDInput
) {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const validation = jtbdInputSchema.safeParse(data);
  if (!validation.success) {
    return { ok: false, error: "Validation échouée", issues: validation.error.issues };
  }

  const supabase = await createClient();
  const solvedIds = validation.data.solved_pain_points ?? [];
  if (solvedIds.length > 0) {
    const { data: candidates, error } = await supabase
      .from("sttns_work_items")
      .select("id, title, parent_id, metadata")
      .eq("project_id", projectId)
      .eq("type", "job")
      .in("id", solvedIds)
      .is("archived_at", null);

    if (error) {
      return { ok: false, error: error.message };
    }

    const byId = new Map((candidates ?? []).map((row) => [row.id, row]));
    for (const id of solvedIds) {
      const row = byId.get(id);
      if (
        !row ||
        row.parent_id !== validation.data.persona_id ||
        !isPainPointJob(row.metadata, row.title)
      ) {
        return {
          ok: false,
          error:
            "Lien solves invalide : chaque Pain Point doit appartenir au même Persona et être un vrai Pain Point.",
        };
      }
    }
  }

  const parsed = parseJtbdSyntax(data.job_statement);

  const contextLinks = [
    { type: "persona" as const, context_id: data.persona_id },
  ];

  const status: WorkItemStatus = data.id
    ? await fetchExistingWorkItemStatus(supabase, data.id, projectId)
    : "todo";

  const result = await saveWorkItem({
    id: data.id,
    project_id: projectId,
    type: "job",
    parent_id: data.persona_id,
    status,
    priority: 3,
    title: data.job_statement,
    code: null,
    sort_order: 0,
    context_links: contextLinks,
    solved_pain_points: solvedIds,
    metadata: {
      situation: data.situation ?? parsed.situation,
      motivation: data.motivation ?? parsed.motivation,
      outcome: data.outcome ?? parsed.outcome,
    },
  });

  if (result.ok) {
    revalidatePath(`/projects/${projectSlug}/why`);
  }

  return result;
}

export async function archiveJTBDAction(
  jtbdId: string,
  _projectId: string,
  projectSlug: string
) {
  const idCheck = archiveWhyItemIdSchema.safeParse(jtbdId);
  if (!idCheck.success) {
    return { ok: false as const, error: "Identifiant JTBD invalide." };
  }
  return archiveWorkItemAction(idCheck.data, projectSlug);
}

export async function archivePainPointAction(
  painPointId: string,
  _projectId: string,
  projectSlug: string
) {
  const idCheck = archiveWhyItemIdSchema.safeParse(painPointId);
  if (!idCheck.success) {
    return { ok: false as const, error: "Identifiant Pain Point invalide." };
  }
  return archiveWorkItemAction(idCheck.data, projectSlug);
}

export async function savePainPointAction(
  projectId: string,
  projectSlug: string,
  data: PainPointInput
) {
  const access = await requireProjectEditor(projectId);
  if (!access.ok) return access;

  const validation = painPointInputSchema.safeParse(data);
  if (!validation.success) {
    return { ok: false, error: "Validation échouée", issues: validation.error.issues };
  }

  const supabase = await createClient();
  const status: WorkItemStatus = data.id
    ? await fetchExistingWorkItemStatus(supabase, data.id, projectId)
    : "todo";

  const result = await saveWorkItem({
    id: data.id,
    project_id: projectId,
    type: "pain_point",
    parent_id: data.persona_id,
    status,
    priority:
      data.severity === "critical"
        ? 5
        : data.severity === "high"
          ? 4
          : data.severity === "medium"
            ? 3
            : 2,
    title: data.label,
    code: null,
    sort_order: 0,
    metadata: {
      severity: data.severity,
      label: data.label,
    },
  });

  if (result.ok) {
    revalidatePath(`/projects/${projectSlug}/why`);
  }

  return result;
}
