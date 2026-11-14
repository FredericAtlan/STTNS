export function assertStoryHasEpic(epicId: string | null | undefined) {
  if (!epicId) {
    return {
      ok: false as const,
      error: "Sélectionnez une Epic pour cette user story.",
    };
  }

  return { ok: true as const };
}

