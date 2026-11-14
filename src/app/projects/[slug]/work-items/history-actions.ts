"use server";

import { createClient } from "@/lib/supabase/server";
import { requireProjectMember } from "@/lib/sttns/access";
import { getWorkItem } from "@/lib/sttns/workItems";
import type { WorkItemEventRow } from "@/lib/sttns/workItemEvents";

export async function fetchWorkItemEventsAction(
  workItemId: string
): Promise<{ ok: true; events: WorkItemEventRow[] } | { ok: false; error: string }> {
  const current = await getWorkItem(workItemId);
  if (!current.ok) return current;
  if (!current.item) {
    return { ok: false, error: "Élément introuvable." };
  }

  const access = await requireProjectMember(current.item.project_id);
  if (!access.ok) return access;

  const supabase = await createClient();
  const { data: events, error } = await supabase
    .from("sttns_work_item_events")
    .select("id, work_item_id, actor_id, event_type, field_name, old_value, new_value, payload, created_at")
    .eq("work_item_id", workItemId)
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) return { ok: false, error: error.message };

  const actorIds = Array.from(
    new Set((events ?? []).map((e) => e.actor_id).filter((id): id is string => !!id))
  );

  const profileMap = new Map<string, string>();
  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from("sttns_profiles")
      .select("id, full_name, email")
      .in("id", actorIds);

    for (const p of profiles ?? []) {
      profileMap.set(p.id, p.full_name?.trim() || p.email || "Utilisateur");
    }
  }

  const enriched: WorkItemEventRow[] = (events ?? []).map((e) => ({
    ...e,
    payload: (e.payload as Record<string, unknown> | null) ?? null,
    actor_name: e.actor_id ? profileMap.get(e.actor_id) ?? null : null,
  }));

  return { ok: true, events: enriched };
}
