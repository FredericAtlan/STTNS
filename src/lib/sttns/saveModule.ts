import { createClient } from "@/lib/supabase/server";
import { moduleEnumFromCode, slugifyModuleCode } from "@/lib/sttns/modules";

export async function saveModuleMetadata(
  projectId: string,
  data: {
    id?: string;
    name: string;
    code: string;
    description: string;
    sort_order: number;
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const name = data.name.trim();
  const code = (data.code.trim() || slugifyModuleCode(name)).toLowerCase();
  if (!name) return { ok: false, error: "Module name is required." };
  if (!code) return { ok: false, error: "Module code is required." };

  const payload = {
    project_id: projectId,
    name,
    code,
    description: data.description.trim() || null,
    sort_order: data.sort_order,
  };

  if (data.id) {
    const { error } = await supabase.from("sttns_modules").update(payload).eq("id", data.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, id: data.id };
  }

  const { data: inserted, error } = await supabase
    .from("sttns_modules")
    .insert(payload)
    .select("id")
    .single();

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Failed to create module" };
  }
  return { ok: true, id: inserted.id };
}

export async function deleteModule(
  moduleId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("sttns_modules")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", moduleId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function duplicateModule(
  moduleId: string,
  projectId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: mod, error } = await supabase
    .from("sttns_modules")
    .select("*")
    .eq("id", moduleId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .single();
  if (error || !mod) return { ok: false, error: error?.message ?? "Module not found." };

  const { data: inserted, error: insertErr } = await supabase
    .from("sttns_modules")
    .insert({
      project_id: projectId,
      name: `${mod.name} Copy`,
      code: `${mod.code}_copy`,
      description: mod.description,
      sort_order: mod.sort_order + 1,
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to duplicate module." };
  }

  return { ok: true, id: inserted.id };
}

/** Assign selected features to module; clear module_id for features previously on this module but unchecked. */
export async function syncModuleFeatures(
  projectId: string,
  moduleId: string,
  moduleCode: string,
  selectedFeatureIds: string[]
): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const enumValue = moduleEnumFromCode(moduleCode);
  const selected = new Set(selectedFeatureIds);

  const { data: projectInits, error: fetchErr } = await supabase
    .from("sttns_initiatives")
    .select("id, module_id")
    .eq("project_id", projectId);

  if (fetchErr) return { ok: false, error: fetchErr.message };

  for (const row of projectInits ?? []) {
    const shouldAssign = selected.has(row.id);
    const wasOnModule = row.module_id === moduleId;

    if (shouldAssign) {
      const { error } = await supabase
        .from("sttns_initiatives")
        .update({ module_id: moduleId, module: enumValue })
        .eq("id", row.id);
      if (error) return { ok: false, error: error.message };
    } else if (wasOnModule) {
      const { error } = await supabase
        .from("sttns_initiatives")
        .update({ module_id: null, module: "platform" })
        .eq("id", row.id);
      if (error) return { ok: false, error: error.message };
    }
  }

  return { ok: true };
}
