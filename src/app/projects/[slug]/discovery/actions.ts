"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import {
  assertDiscoveryReverseItemsTodo,
  buildDiscoveryDraftFile,
  parseDiscoveryDraftFile,
  type DiscoveryDraft,
  type DiscoveryDraftFile,
  type DiscoveryDraftMetadata,
  type DiscoveryReverseSpineItem,
} from "@/lib/sttns/discoveryMatrix";

export type DiscoveryCloudDraftSummary = {
  id: string;
  title: string;
  author: string;
  comments: string;
  lineCount: number;
  updatedAt: string;
  createdAt: string;
};

function revalidateDiscovery(projectSlug: string) {
  revalidatePath(`/projects/${projectSlug}/discovery`);
}

/** Liste les brouillons partagés du projet (tous les membres). */
export async function listMyDiscoveryDraftsAction(
  projectId: string
): Promise<{ ok: true; drafts: DiscoveryCloudDraftSummary[] } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return { ok: false, error: access.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sttns_discovery_drafts")
    .select("id, title, author, comments, payload, created_at, updated_at")
    .eq("project_id", projectId)
    .order("updated_at", { ascending: false });

  if (error) return { ok: false, error: error.message };

  const drafts: DiscoveryCloudDraftSummary[] = (data ?? []).map((row) => {
    const payload = row.payload as { content?: unknown } | null;
    const lineCount = Array.isArray(payload?.content) ? payload.content.length : 0;
    return {
      id: row.id as string,
      title: (row.title as string) || "Sans titre",
      author: (row.author as string) || "",
      comments: (row.comments as string) || "",
      lineCount,
      updatedAt: row.updated_at as string,
      createdAt: row.created_at as string,
    };
  });

  return { ok: true, drafts };
}

export type SaveDiscoveryDraftResult =
  | { ok: true; id: string; updatedAt: string }
  | { ok: false; error: string; conflict?: false }
  | { ok: false; error: string; conflict: true; serverUpdatedAt: string };

/** Enregistre ou met à jour un brouillon partagé du projet (LWW avec expectedUpdatedAt). */
export async function saveMyDiscoveryDraftAction(input: {
  projectId: string;
  projectSlug: string;
  draftId?: string | null;
  metadata: DiscoveryDraftMetadata;
  drafts: DiscoveryDraft[];
  /** ISO `updated_at` connu côté client — si le serveur est plus récent → conflit. */
  expectedUpdatedAt?: string | null;
}): Promise<SaveDiscoveryDraftResult> {
  const access = await requireProjectMember(input.projectId);
  if (!access.ok) return { ok: false, error: access.error };

  const file = buildDiscoveryDraftFile({
    projectId: input.projectId,
    projectSlug: input.projectSlug,
    metadata: input.metadata,
    drafts: input.drafts,
  });

  const title =
    input.metadata.title.trim() ||
    `Brouillon ${new Date().toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}`;

  const supabase = await createClient();

  if (input.draftId) {
    if (input.expectedUpdatedAt) {
      const { data: existing, error: readError } = await supabase
        .from("sttns_discovery_drafts")
        .select("updated_at")
        .eq("id", input.draftId)
        .eq("project_id", input.projectId)
        .maybeSingle();

      if (readError) return { ok: false, error: readError.message };
      if (!existing) {
        return { ok: false, error: "Brouillon introuvable ou non autorisé." };
      }

      const serverUpdatedAt = existing.updated_at as string;
      const expectedMs = Date.parse(input.expectedUpdatedAt);
      const serverMs = Date.parse(serverUpdatedAt);
      if (
        Number.isFinite(expectedMs) &&
        Number.isFinite(serverMs) &&
        serverMs > expectedMs
      ) {
        return {
          ok: false,
          conflict: true,
          serverUpdatedAt,
          error:
            "Ce brouillon a été modifié ailleurs depuis votre dernier chargement. Écraser ou recharger ?",
        };
      }
    }

    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from("sttns_discovery_drafts")
      .update({
        title,
        author: input.metadata.author.trim(),
        comments: input.metadata.comments.trim(),
        payload: file as unknown as Record<string, unknown>,
        updated_at: now,
      })
      .eq("id", input.draftId)
      .eq("project_id", input.projectId)
      .select("id, updated_at")
      .maybeSingle();

    if (error) return { ok: false, error: error.message };
    if (!data?.id) {
      return { ok: false, error: "Brouillon introuvable ou non autorisé." };
    }
    revalidateDiscovery(input.projectSlug);
    return {
      ok: true,
      id: data.id as string,
      updatedAt: (data.updated_at as string) || now,
    };
  }

  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from("sttns_discovery_drafts")
    .insert({
      project_id: input.projectId,
      owner_id: access.userId,
      title,
      author: input.metadata.author.trim(),
      comments: input.metadata.comments.trim(),
      payload: file as unknown as Record<string, unknown>,
      updated_at: now,
    })
    .select("id, updated_at")
    .single();

  if (error) return { ok: false, error: error.message };
  revalidateDiscovery(input.projectSlug);
  return {
    ok: true,
    id: data.id as string,
    updatedAt: (data.updated_at as string) || now,
  };
}

/** Charge un brouillon partagé du projet. */
export async function loadMyDiscoveryDraftAction(
  projectId: string,
  projectSlug: string,
  draftId: string
): Promise<
  | { ok: true; file: DiscoveryDraftFile; updatedAt: string }
  | { ok: false; error: string }
> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return { ok: false, error: access.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("sttns_discovery_drafts")
    .select("payload, updated_at")
    .eq("id", draftId)
    .eq("project_id", projectId)
    .maybeSingle();

  if (error) return { ok: false, error: error.message };
  if (!data?.payload) return { ok: false, error: "Brouillon introuvable." };

  const parsed = parseDiscoveryDraftFile(data.payload, {
    expectedProjectId: projectId,
    expectedProjectSlug: projectSlug,
  });

  if (!parsed.ok) return { ok: false, error: parsed.error };
  return {
    ok: true,
    file: parsed.file,
    updatedAt: (data.updated_at as string) || new Date().toISOString(),
  };
}

/** Supprime un brouillon partagé (tout membre du projet). */
export async function deleteMyDiscoveryDraftAction(
  projectId: string,
  projectSlug: string,
  draftId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return { ok: false, error: access.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("sttns_discovery_drafts")
    .delete()
    .eq("id", draftId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  revalidateDiscovery(projectSlug);
  return { ok: true };
}

export type DiscoveryReverseAssertResult =
  | { ok: true; items: DiscoveryReverseSpineItem[] }
  | { ok: false; error: string; blockers?: DiscoveryReverseSpineItem[] };

/**
 * Vérifie que les entités Spine + descendants DB sont tous en `todo`
 * avant un « Revenir en brouillon » (archive).
 */
export async function assertDiscoveryReverseAllowedAction(
  projectId: string,
  spineIds: string[]
): Promise<DiscoveryReverseAssertResult> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return { ok: false, error: access.error };

  const roots = Array.from(new Set(spineIds.filter(Boolean)));
  if (roots.length === 0) {
    return { ok: false, error: "Aucun élément Spine à vérifier." };
  }

  const supabase = await createClient();
  const byId = new Map<string, DiscoveryReverseSpineItem>();

  async function loadByIds(ids: string[]) {
    const unique = Array.from(new Set(ids.filter((id) => id && !byId.has(id))));
    if (unique.length === 0) return;
    const { data, error } = await supabase
      .from("sttns_work_items")
      .select("id, title, type, status, cycle_id")
      .eq("project_id", projectId)
      .in("id", unique)
      .is("archived_at", null);
    if (error) throw new Error(error.message);
    for (const row of data ?? []) {
      byId.set(row.id as string, {
        id: row.id as string,
        title: (row.title as string) || "",
        type: (row.type as string) || "",
        status: (row.status as string) || "",
        cycle_id: (row.cycle_id as string | null) ?? null,
      });
    }
  }

  async function loadChildren(parentIds: string[], childType: "feature" | "story") {
    const parents = parentIds.filter(Boolean);
    if (parents.length === 0) return [] as string[];
    const { data, error } = await supabase
      .from("sttns_work_items")
      .select("id, title, type, status, cycle_id")
      .eq("project_id", projectId)
      .eq("type", childType)
      .in("parent_id", parents)
      .is("archived_at", null);
    if (error) throw new Error(error.message);
    const childIds: string[] = [];
    for (const row of data ?? []) {
      const id = row.id as string;
      byId.set(id, {
        id,
        title: (row.title as string) || "",
        type: (row.type as string) || childType,
        status: (row.status as string) || "",
        cycle_id: (row.cycle_id as string | null) ?? null,
      });
      childIds.push(id);
    }
    return childIds;
  }

  try {
    await loadByIds(roots);

    const missing = roots.filter((id) => !byId.has(id));
    if (missing.length > 0) {
      return {
        ok: false,
        error:
          "Élément Spine introuvable ou déjà archivé — rafraîchissez la page avant de revenir en brouillon.",
      };
    }

    const epicIds = Array.from(byId.values())
      .filter((i) => i.type === "epic")
      .map((i) => i.id);
    const featureIdsFromRoots = Array.from(byId.values())
      .filter((i) => i.type === "feature")
      .map((i) => i.id);

    const featureIds = [
      ...featureIdsFromRoots,
      ...(await loadChildren(epicIds, "feature")),
    ];
    await loadChildren(Array.from(new Set(featureIds)), "story");

    const items = Array.from(byId.values());
    const gate = assertDiscoveryReverseItemsTodo(items);
    if (!gate.ok) {
      return { ok: false, error: gate.error, blockers: gate.blockers };
    }
    return { ok: true, items };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "Vérification reverse impossible.",
    };
  }
}
