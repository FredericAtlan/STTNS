import { createClient } from "@/lib/supabase/server";
import { getAllProjects } from "@/lib/sttns/projects";

/**
 * Après reset BDD : assure le profil STTNS et revendique CEO sur les projets sans membre.
 * Idempotent — safe à appeler à chaque requête authentifiée.
 */
export async function bootstrapProjectAccess(user: {
  id: string;
  email?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<void> {
  const supabase = await createClient();

  const fullName =
    (typeof user.user_metadata?.full_name === "string" && user.user_metadata.full_name.trim()) ||
    user.email?.split("@")[0] ||
    null;

  await supabase.from("sttns_profiles").upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: fullName,
    },
    { onConflict: "id" }
  );

  const { data: memberships } = await supabase
    .from("sttns_project_members")
    .select("project_id")
    .eq("user_id", user.id);

  const memberProjectIds = new Set((memberships ?? []).map((m) => m.project_id));

  const projects = await getAllProjects();

  for (const project of projects) {
    if (memberProjectIds.has(project.id)) continue;

    // Ne pas rattacher automatiquement les visiteurs à un projet qui a déjà une équipe.
    const { count } = await supabase
      .from("sttns_project_members")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id);

    if ((count ?? 0) > 0) continue;

    await supabase.from("sttns_project_members").insert({
      project_id: project.id,
      user_id: user.id,
      role: "ceo",
    });
  }
}
