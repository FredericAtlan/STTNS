import Link from "next/link";
import { primaryPersonaName } from "@/lib/sttns/userStories";
import { UserStorySequenceView } from "@/components/personas/UserStorySequenceView";
import { SttnsCard } from "@/components/layout/sttns-ui";
import type { SttnsInitiative, SttnsPersona, SttnsUserStory } from "@/types/sttns";
import type { SttnsEpic } from "@/types/sttns";
import { storyEpicLabel } from "@/lib/sttns/epics";

interface Props {
  story: SttnsUserStory;
  personas?: SttnsPersona[];
  epics?: SttnsEpic[];
  initiatives?: SttnsInitiative[];
  projectSlug: string;
  href?: string;
  impactLabel?: string | null;
}

export function UserStoryCard({
  story,
  personas,
  epics,
  initiatives,
  projectSlug,
  href,
  impactLabel,
}: Props) {
  const titleDisplay = story.context_label
    ? `${story.title} (${story.context_label})`
    : story.title;
  const linked = personas ?? story.personas ?? [];
  const asPersona = primaryPersonaName(story, linked);
  const epicLabel = storyEpicLabel(story, epics ?? []);

  const content = (
    <SttnsCard className="p-5 transition group-hover:shadow-md">
      <h3 className="font-display text-lg font-bold leading-snug text-zinc-900">{titleDisplay}</h3>

      {(story.sprint_want || story.sprint_so_that) && (
        <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 px-3 py-2 text-sm text-zinc-800">
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800">
            Sprint
          </p>
          <p>
            As a <strong>{asPersona ?? "…"}</strong>, I want{" "}
            <strong>{story.sprint_want}</strong>, so that{" "}
            <strong>{story.sprint_so_that}</strong>.
          </p>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 font-semibold text-zinc-700">
          Epic: {epicLabel}
        </span>
      </div>

      {linked.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {linked.map((p) => (
            <span
              key={p.id}
              className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                p.id === story.primary_persona_id
                  ? "border-emerald-300 bg-emerald-100 text-emerald-900"
                  : "border-zinc-200 bg-zinc-50 text-zinc-700"
              }`}
            >
              {p.name}
              {p.id === story.primary_persona_id ? " · primary" : ""}
            </span>
          ))}
        </div>
      )}

      <div className="mt-4">
        <UserStorySequenceView
          story={story}
          personas={linked}
          initiatives={initiatives}
          compact
        />
      </div>

      {impactLabel && (
        <p className="mt-4 text-sm text-zinc-700">
          <span className="font-bold text-emerald-700">Impact: {impactLabel}.</span>{" "}
          {story.impact_description}
        </p>
      )}
    </SttnsCard>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group block transition hover:-translate-y-0.5"
      >
        {content}
      </Link>
    );
  }

  return <div className="group">{content}</div>;
}
