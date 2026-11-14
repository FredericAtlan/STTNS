"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/sttns/access";
import { revalidatePath } from "next/cache";
import type { ImportMode } from "@/lib/sttns/types";
import {
  LEGACY_READ_ONLY_CODE,
  LEGACY_READ_ONLY_MESSAGE,
  isLegacyPersonaCsvEntity,
  legacyPersonaWriteForbidden,
} from "@/lib/sttns/legacyPersonasFreeze";

// --- EXPORT ACTIONS ---

export async function exportBatchAction(projectId: string, entities: string[]) {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: "Unauthorized" };

  const supabase = await createClient();
  
  // Fetch metadata
  const [projectRes, profileRes, memberRes] = await Promise.all([
    supabase.from("sttns_projects").select("name, slug").eq("id", projectId).single(),
    supabase.from("sttns_profiles").select("full_name, email, platform_role").eq("id", auth.userId).single(),
    supabase.from("sttns_project_members").select("role").eq("project_id", projectId).eq("user_id", auth.userId).single()
  ]);

  if (projectRes.error) return { ok: false, error: "Project not found" };

  const metadata = {
    projectName: projectRes.data.name,
    projectSlug: projectRes.data.slug,
    exportedBy: profileRes.data?.full_name || profileRes.data?.email || "Unknown User",
    role: memberRes.data?.role || profileRes.data?.platform_role || "Unknown Role",
    exportDate: new Date().toISOString(),
  };

  const projectData: Record<string, any[]> = {};

  for (const entity of entities) {
    let data: any = null;
    let error = null;

    switch (entity) {
      case "nsm":
        ({ data, error } = await supabase.from("sttns_project_metrics").select("*").eq("project_id", projectId));
        break;
      case "personas":
        ({ data, error } = await supabase.from("sttns_personas").select("*").eq("project_id", projectId));
        break;
      case "pain_points":
        ({ data, error } = await supabase
          .from("sttns_persona_pain_points")
          .select("*, sttns_personas!inner(project_id)")
          .eq("sttns_personas.project_id", projectId));
        if (data) data = data.map((d: any) => { const { sttns_personas, ...rest } = d; return rest; });
        break;
      case "jtbd":
        ({ data, error } = await supabase
          .from("sttns_persona_jobs")
          .select("*, sttns_personas!inner(project_id)")
          .eq("sttns_personas.project_id", projectId));
        if (data) data = data.map((d: any) => { const { sttns_personas, ...rest } = d; return rest; });
        break;
      case "user_stories":
        ({ data, error } = await supabase
          .from("sttns_work_items")
          .select("*")
          .eq("project_id", projectId)
          .eq("type", "story"));
        break;
      case "epics":
        ({ data, error } = await supabase
          .from("sttns_work_items")
          .select("*")
          .eq("project_id", projectId)
          .eq("type", "epic"));
        break;
      case "features":
        ({ data, error } = await supabase
          .from("sttns_work_items")
          .select("*")
          .eq("project_id", projectId)
          .eq("type", "feature"));
        break;
    }

    if (error) return { ok: false, error: error.message };
    projectData[entity] = data || [];
  }

  return { ok: true, data: projectData, metadata };
}

export async function exportEntityAction(projectId: string, entity: string) {
  const res = await exportBatchAction(projectId, [entity]);
  if (!res.ok || !res.data) return { ok: false, error: res.error || "Export failed" };
  return { ok: true, data: res.data[entity], metadata: (res as any).metadata };
}

export async function exportFullProjectAction(projectId: string) {
  return exportBatchAction(projectId, ["nsm", "personas", "pain_points", "jtbd", "user_stories", "epics", "features"]);
}

// --- IMPORT ACTIONS ---

export async function importEntityAction(projectId: string, entity: string, mode: ImportMode, rows: any[]) {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: "Unauthorized" };

  // Étape A3 — imports CSV catalogue Personas legacy : freeze écriture.
  // Créer / modifier des personas, pain points, JTBD passe désormais par `/why` (Spine).
  if (isLegacyPersonaCsvEntity(entity)) {
    const frozen = legacyPersonaWriteForbidden();
    if (frozen) {
      return {
        ok: false as const,
        error: LEGACY_READ_ONLY_MESSAGE,
        code: LEGACY_READ_ONLY_CODE,
        status: 403 as const,
      };
    }
  }

  const supabase = await createClient();
  
  // Table mapping
  const tableMap: Record<string, string> = {
    nsm: "sttns_project_metrics",
    personas: "sttns_personas",
    pain_points: "sttns_persona_pain_points",
    jtbd: "sttns_persona_jobs",
    user_stories: "sttns_user_stories",
    epics: "sttns_epics",
    features: "sttns_initiatives",
  };
  
  const tableName = tableMap[entity];
  if (!tableName) return { ok: false, error: "Unknown entity" };

  // For replace mode, delete existing data first
  if (mode === "replace") {
    if (entity === "pain_points" || entity === "jtbd") {
      // Delete via persona relation
      const { data: personas } = await supabase.from("sttns_personas").select("id").eq("project_id", projectId);
      if (personas && personas.length > 0) {
        const personaIds = personas.map(p => p.id);
        await supabase.from(tableName).delete().in("persona_id", personaIds);
      }
    } else {
      await supabase.from(tableName).delete().eq("project_id", projectId);
    }
  }

  // Clean up rows before insert/upsert
  const cleanRows = rows.map(row => {
    const cleanRow = { ...row };
    // Add project_id if it's a direct project entity
    if (entity !== "pain_points" && entity !== "jtbd") {
      cleanRow.project_id = projectId;
    }
    
    // In append mode, remove IDs to let DB generate new ones
    if (mode === "append") {
      delete cleanRow.id;
      delete cleanRow.created_at;
      delete cleanRow.updated_at;
    }
    
    // Convert empty strings to null for UUID fields or other nullable fields
    for (const key in cleanRow) {
      if (cleanRow[key] === "") {
        cleanRow[key] = null;
      }
    }
    
    // Handle JSON fields if any (like actions in user_stories)
    if (entity === "user_stories" && typeof cleanRow.actions === "string") {
      try {
        cleanRow.actions = JSON.parse(cleanRow.actions);
      } catch (e) {
        cleanRow.actions = [];
      }
    }
    
    return cleanRow;
  });

  if (cleanRows.length === 0) {
    return { ok: true, message: "No rows to import" };
  }

  let result;
  if (mode === "merge") {
    // Upsert based on ID
    result = await supabase.from(tableName).upsert(cleanRows);
  } else {
    // Insert
    result = await supabase.from(tableName).insert(cleanRows);
  }

  if (result.error) {
    return { ok: false, error: result.error.message };
  }

  revalidatePath("/", "layout");
  return { ok: true };
}

export async function importFullProjectAction(projectId: string, mode: ImportMode, projectData: Record<string, any[]>) {
  const auth = await requireAuth();
  if (!auth.ok) return { ok: false, error: "Unauthorized" };

  // Order matters for foreign keys
  const entitiesOrder = [
    "nsm",
    "personas",
    "pain_points",
    "jtbd",
    "epics",
    "user_stories",
    "features"
  ];

  // If replace, delete in reverse order to respect foreign keys
  if (mode === "replace") {
    for (const entity of [...entitiesOrder].reverse()) {
      if (projectData[entity]) {
        // We just call import with empty array and replace mode to clear it
        await importEntityAction(projectId, entity, "replace", []);
      }
    }
  }

  // Étape A3 — entités catalogue Personas legacy : skip silencieux (freeze CSV).
  // Ces entités doivent transiter par la Matrice Besoins (/why) — création Spine.
  const skippedLegacyEntities: string[] = [];

  // Import in order
  for (const entity of entitiesOrder) {
    if (projectData[entity] && projectData[entity].length > 0) {
      if (isLegacyPersonaCsvEntity(entity)) {
        skippedLegacyEntities.push(entity);
        continue;
      }
      // If we already replaced above, we just append now
      const currentMode = mode === "replace" ? "append" : mode;
      const res = await importEntityAction(projectId, entity, currentMode, projectData[entity]);
      if (!res.ok) {
        return { ok: false, error: `Error importing ${entity}: ${res.error}` };
      }
    }
  }

  revalidatePath("/", "layout");
  return {
    ok: true as const,
    skippedLegacyEntities,
    legacyPersonaFreeze: skippedLegacyEntities.length > 0 ? LEGACY_READ_ONLY_MESSAGE : null,
  };
}
