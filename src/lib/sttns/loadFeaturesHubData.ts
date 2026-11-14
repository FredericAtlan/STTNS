import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchAllInitiativePeerReviews } from "@/lib/sttns/peerReviews";
import { reconcileFeatureCommittee } from "@/lib/sttns/savePeerReview";
import { fetchProjectEpics } from "@/lib/sttns/epics";
import { buildGitLinkInitiativeIds } from "@/lib/sttns/roadmapMatrix";
import type {
  SttnsEpic,
  SttnsFeatureLink,
  SttnsInitiative,
  SttnsModule,
  SttnsProfile,
  SttnsProject,
  SttnsProjectMember,
  SttnsProjectMetric,
  SttnsUserStory,
} from "@/types/sttns";

export type FeaturesHubData = {
  project: SttnsProject;
  initiatives: SttnsInitiative[];
  modules: SttnsModule[];
  metrics: SttnsProjectMetric[];
  userStories: Pick<SttnsUserStory, "id" | "title" | "context_label">[];
  membersWithProfiles: SttnsProjectMember[];
  peerReviewsByInitiative: Record<string, import("@/types/sttns").SttnsPeerReview[]>;
  profilesById: Record<string, SttnsProfile>;
  epics: SttnsEpic[];
  gitLinkInitiativeIds: string[];
};

export async function loadFeaturesHubData(
  supabase: SupabaseClient,
  project: SttnsProject
): Promise<FeaturesHubData> {
  const [
    { data: initiativesRaw },
    { data: metricsRaw },
    { data: modules },
    { data: membersRaw },
    { data: userStoriesRaw },
    epics,
    linksResult,
  ] = await Promise.all([
    supabase
      .from("sttns_initiatives")
      .select("*")
      .eq("project_id", project.id)
      .order("execution_sort_order")
      .order("feature_code"),
    supabase.from("sttns_project_metrics").select("*").eq("project_id", project.id),
    supabase
      .from("sttns_modules")
      .select("*")
      .eq("project_id", project.id)
      .order("sort_order"),
    supabase.from("sttns_project_members").select("*").eq("project_id", project.id),
    supabase
      .from("sttns_user_stories")
      .select("id, title, context_label")
      .eq("project_id", project.id),
    fetchProjectEpics(supabase, project.id),
    supabase
      .from("sttns_feature_links")
      .select("initiative_id, url")
      .eq("project_id", project.id),
  ]);

  let inits = (initiativesRaw ?? []) as SttnsInitiative[];
  const members = (membersRaw ?? []) as SttnsProjectMember[];

  for (const init of inits) {
    if (init.review_status === "in_review") {
      await reconcileFeatureCommittee(project.id, init.id, init.created_by ?? null);
    }
  }

  const [{ data: initiativesAfter }, peerReviewsByInitiative] = await Promise.all([
    supabase
      .from("sttns_initiatives")
      .select("*")
      .eq("project_id", project.id)
      .order("execution_sort_order")
      .order("feature_code"),
    fetchAllInitiativePeerReviews(project.id),
  ]);

  inits = (initiativesAfter ?? inits) as SttnsInitiative[];

  const profileIds = new Set<string>();
  for (const i of inits) {
    if (i.created_by) profileIds.add(i.created_by);
    if (i.updated_by) profileIds.add(i.updated_by);
  }
  for (const m of members) profileIds.add(m.user_id);

  let profilesById: Record<string, SttnsProfile> = {};
  if (profileIds.size) {
    const { data: profiles } = await supabase
      .from("sttns_profiles")
      .select("id, full_name, email, avatar_url, platform_role")
      .in("id", Array.from(profileIds));
    profilesById = Object.fromEntries(((profiles ?? []) as SttnsProfile[]).map((p) => [p.id, p]));
  }

  const links = (linksResult.data ?? []) as Pick<SttnsFeatureLink, "initiative_id" | "url">[];

  return {
    project,
    initiatives: inits,
    modules: (modules ?? []) as SttnsModule[],
    metrics: (metricsRaw ?? []) as SttnsProjectMetric[],
    userStories: (userStoriesRaw ?? []) as Pick<
      SttnsUserStory,
      "id" | "title" | "context_label"
    >[],
    membersWithProfiles: members.map((m) => ({
      ...m,
      profile: profilesById[m.user_id],
    })),
    peerReviewsByInitiative,
    profilesById,
    epics,
    gitLinkInitiativeIds: Array.from(buildGitLinkInitiativeIds(links)),
  };
}
