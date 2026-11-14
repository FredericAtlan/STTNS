import { createClient } from "@/lib/supabase/server";
import { requireDraftAuthor, requireProjectMember } from "@/lib/sttns/access";
import { assertUserStoryComplete } from "@/lib/sttns/userStoryComplete";
import { assertStoryHasEpic } from "@/lib/sttns/storyEpicLink";
import { isJtbdJob } from "@/lib/sttns/whySpine";
import { validateUserStorySave } from "@/lib/userStories/userStoryFormSchema";
import type { SttnsUserStoryStatus } from "@/types/sttns";

export async function saveUserStoryWithRelations(
  projectId: string,
  data: {
    id?: string;
    title: string;
    context_label: string;
    epic_id: string | null;
    primary_persona_id: string;
    target_persona_job_id: string | null;
    persona_ids: string[];
    sprint_want: string;
    sprint_so_that: string;
    impact_metric_id: string | null;
    impacts_north_star: boolean;
    impact_description: string;
    status: SttnsUserStoryStatus;
    initiative_id: string | null;
    notes: string;
    sort_order?: number;
    save_intent?: "draft" | "publish";
  }
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const access = await requireProjectMember(projectId);
  if (!access.ok) return access;

  const supabase = await createClient();
  const title = data.title.trim();
  if (!title) return { ok: false, error: "Le titre est obligatoire." };

  const sprintWant = data.sprint_want.trim();
  const sprintSoThat = data.sprint_so_that.trim();
  const saveIntent = data.save_intent ?? "draft";

  const formValidation = validateUserStorySave(
    {
      title,
      context_label: data.context_label,
      epic_id: data.epic_id,
      primary_persona_id: data.primary_persona_id,
      target_persona_job_id: data.target_persona_job_id,
      persona_ids: data.persona_ids,
      sprint_want: sprintWant,
      sprint_so_that: sprintSoThat,
      impact_metric_id: data.impact_metric_id,
      impacts_north_star: data.impacts_north_star,
      impact_description: data.impact_description,
      initiative_id: data.initiative_id,
      notes: data.notes,
    },
    saveIntent
  );
  if (!formValidation.ok) return formValidation;

  if (data.epic_id) {
    const epicCheck = assertStoryHasEpic(data.epic_id);
    if (!epicCheck.ok) return epicCheck;
  }

  const personaIds = Array.from(new Set(data.persona_ids.filter(Boolean)));
  if (data.primary_persona_id && !personaIds.includes(data.primary_persona_id)) {
    personaIds.unshift(data.primary_persona_id);
  }

  let storyId = data.id;
  let persistedStatus: SttnsUserStoryStatus = "proposed";

  if (storyId) {
    const author = await requireDraftAuthor(projectId, "user_story", storyId);
    if (!author.ok) return author;

    const { data: current } = await supabase
      .from("sttns_user_stories")
      .select("status")
      .eq("id", storyId)
      .eq("project_id", projectId)
      .single();

    persistedStatus = (current?.status ?? "proposed") as SttnsUserStoryStatus;

    if (data.status !== persistedStatus) {
      if (data.status === "validated" && persistedStatus === "proposed") {
        return {
          ok: false,
          error:
            "Utilisez « Soumettre pour validation » pour faire valider la story par l'équipe.",
        };
      }
      return {
        ok: false,
        error: "Le statut de livraison se met à jour via la revue ou le sprint planning.",
      };
    }
  } else if (data.status !== "proposed") {
    return { ok: false, error: "Les nouvelles stories démarrent au statut Proposed." };
  }

  if (persistedStatus !== "proposed") {
    const completeness = assertUserStoryComplete({
      epic_id: data.epic_id,
      primary_persona_id: data.primary_persona_id,
      target_persona_job_id: data.target_persona_job_id,
      sprint_want: sprintWant,
      sprint_so_that: sprintSoThat,
      initiative_id: data.initiative_id,
      impact_metric_id: data.impact_metric_id,
      impacts_north_star: data.impacts_north_star,
    });
    if (!completeness.ok) return completeness;

    if (personaIds.length === 0) {
      return { ok: false, error: "Link at least one persona." };
    }
  }

  if (data.primary_persona_id) {
    const { data: personaRow, error: personaErr } = await supabase
      .from("sttns_work_items")
      .select("id, type")
      .eq("id", data.primary_persona_id)
      .eq("project_id", projectId)
      .eq("type", "persona")
      .is("archived_at", null)
      .maybeSingle();
    if (personaErr) return { ok: false, error: personaErr.message };
    if (!personaRow) {
      return { ok: false, error: "Persona principal Spine introuvable." };
    }
  }

  if (data.target_persona_job_id && data.primary_persona_id) {
    const { data: jobRow, error: jobErr } = await supabase
      .from("sttns_work_items")
      .select("id, parent_id, type, title, metadata")
      .eq("id", data.target_persona_job_id)
      .eq("project_id", projectId)
      .eq("type", "job")
      .is("archived_at", null)
      .maybeSingle();
    if (jobErr) return { ok: false, error: jobErr.message };
    if (!jobRow || jobRow.parent_id !== data.primary_persona_id) {
      return {
        ok: false,
        error: "Le JTBD sélectionné doit appartenir au persona principal.",
      };
    }
    if (!isJtbdJob(jobRow.metadata, jobRow.title)) {
      return {
        ok: false,
        error: "Sélectionnez un JTBD Spine (pas un Pain Point).",
      };
    }
  }

  if (personaIds.length > 0) {
    const { data: linkedPersonas, error: linkedErr } = await supabase
      .from("sttns_work_items")
      .select("id")
      .eq("project_id", projectId)
      .eq("type", "persona")
      .is("archived_at", null)
      .in("id", personaIds);
    if (linkedErr) return { ok: false, error: linkedErr.message };
    if ((linkedPersonas?.length ?? 0) !== personaIds.length) {
      return {
        ok: false,
        error: "Un ou plusieurs personas liés ne sont pas des work items Spine.",
      };
    }
  }

  if (data.initiative_id) {
    const { data: initiativeRow, error: initErr } = await supabase
      .from("sttns_initiatives")
      .select("id, feature_code, workflow_status, final_decision, phase1_status")
      .eq("id", data.initiative_id)
      .eq("project_id", projectId)
      .maybeSingle();
    if (initErr) return { ok: false, error: initErr.message };
    if (!initiativeRow) {
      return { ok: false, error: "Feature liée introuvable." };
    }
    const killed =
      initiativeRow.workflow_status === "killed" ||
      initiativeRow.final_decision === "kill" ||
      initiativeRow.phase1_status === "kill";
    if (killed) {
      return {
        ok: false,
        error: `La feature ${initiativeRow.feature_code ?? initiativeRow.id} est KILL — choisissez une autre feature.`,
      };
    }
  }

  const payload = {
    project_id: projectId,
    title,
    context_label: data.context_label.trim() || null,
    epic_id: data.epic_id || null,
    primary_persona_id: data.primary_persona_id || null,
    target_persona_job_id: data.target_persona_job_id || null,
    sprint_want: sprintWant || null,
    sprint_so_that: sprintSoThat || null,
    actions: [],
    impact_metric_id: data.impacts_north_star ? null : data.impact_metric_id,
    impacts_north_star: data.impacts_north_star,
    impact_description: data.impact_description.trim() || null,
    status: persistedStatus,
    initiative_id: data.initiative_id || null,
    notes: data.notes.trim() || null,
  };

  if (storyId) {
    const { error } = await supabase
      .from("sttns_user_stories")
      .update(payload)
      .eq("id", storyId)
      .eq("project_id", projectId);
    if (error) return { ok: false, error: error.message };
  } else {
    const { data: inserted, error } = await supabase
      .from("sttns_user_stories")
      .insert({
        ...payload,
        sort_order: data.sort_order ?? 0,
        created_by: access.userId,
      })
      .select("id")
      .single();
    if (error || !inserted) {
      return { ok: false, error: error?.message ?? "Failed to create user story" };
    }
    storyId = inserted.id;
  }

  await supabase.from("sttns_user_story_personas").delete().eq("user_story_id", storyId);
  if (personaIds.length > 0) {
    const { error: linkErr } = await supabase.from("sttns_user_story_personas").insert(
      personaIds.map((persona_id) => ({ user_story_id: storyId, persona_id }))
    );
    if (linkErr) return { ok: false, error: linkErr.message };
  }

  if (!storyId) return { ok: false, error: "Story id missing after save." };
  return { ok: true, id: storyId };
}

export async function deleteUserStory(
  storyId: string,
  projectId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const author = await requireDraftAuthor(projectId, "user_story", storyId);
  if (!author.ok) return author;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { error } = await supabase
    .from("sttns_user_stories")
    .update({ archived_at: new Date().toISOString() })
    .eq("id", storyId)
    .eq("project_id", projectId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function duplicateUserStory(
  storyId: string,
  projectId: string
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not authenticated" };

  const { data: story, error } = await supabase
    .from("sttns_user_stories")
    .select("*")
    .eq("id", storyId)
    .eq("project_id", projectId)
    .is("archived_at", null)
    .single();
  if (error || !story) return { ok: false, error: error?.message ?? "Story not found." };

  const { data: personas } = await supabase
    .from("sttns_user_story_personas")
    .select("persona_id")
    .eq("user_story_id", storyId);
  const personaIds = (personas ?? []).map((row) => row.persona_id);

  const { data: inserted, error: insertErr } = await supabase
    .from("sttns_user_stories")
    .insert({
      project_id: projectId,
      title: `${story.title} Copy`,
      context_label: story.context_label,
      epic_id: story.epic_id,
      primary_persona_id: story.primary_persona_id,
      target_persona_job_id: story.target_persona_job_id ?? null,
      archived_at: null,
      actions: story.actions,
      impact_metric_id: story.impact_metric_id,
      impacts_north_star: story.impacts_north_star,
      impact_description: story.impact_description,
      initiative_id: story.initiative_id,
      notes: story.notes,
      sprint_want: story.sprint_want,
      sprint_so_that: story.sprint_so_that,
      sort_order: story.sort_order + 1,
      created_by: user.id,
      review_status: "draft",
      status: "proposed",
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return { ok: false, error: insertErr?.message ?? "Failed to duplicate user story." };
  }

  if (personaIds.length) {
    const { error: linkErr } = await supabase.from("sttns_user_story_personas").insert(
      personaIds.map((persona_id) => ({ user_story_id: inserted.id, persona_id }))
    );
    if (linkErr) return { ok: false, error: linkErr.message };
  }

  return { ok: true, id: inserted.id };
}
