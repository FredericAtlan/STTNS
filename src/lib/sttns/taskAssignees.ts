import type { SttnsInitiativeTask, SttnsProfile, SttnsProjectMember } from "@/types/sttns";

export function profileForMember(
  members: SttnsProjectMember[],
  userId: string | null | undefined
): SttnsProfile | null {
  if (!userId) return null;
  return members.find((m) => m.user_id === userId)?.profile ?? null;
}

/** Profils uniques assignés aux sous-étapes (ordre de création des tâches). */
export function uniquePartAssigneeProfiles(
  tasks: SttnsInitiativeTask[],
  members: SttnsProjectMember[],
  options?: { excludeUserId?: string | null }
): SttnsProfile[] {
  const seen = new Set<string>();
  const profiles: SttnsProfile[] = [];
  const exclude = options?.excludeUserId ?? null;

  for (const task of tasks) {
    const id = task.assignee_id;
    if (!id || id === exclude || seen.has(id)) continue;
    const profile = profileForMember(members, id);
    if (!profile) continue;
    seen.add(id);
    profiles.push(profile);
  }

  return profiles;
}
