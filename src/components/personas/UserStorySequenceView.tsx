import {
  actorDisplayName,
  formatActionLine,
  parseStoryActions,
  STORY_ACTOR_COLORS,
  STORY_ACTOR_LABELS,
} from "@/lib/sttns/userStories";
import type { SttnsInitiative, SttnsPersona, SttnsUserStory } from "@/types/sttns";

interface Props {
  story: Pick<SttnsUserStory, "actions">;
  personas?: SttnsPersona[];
  initiatives?: SttnsInitiative[];
  compact?: boolean;
}

export function UserStorySequenceView({ story, personas = [], initiatives = [], compact }: Props) {
  const actions = parseStoryActions(story.actions);
  if (!actions.length) return null;

  const personasById = new Map(personas.map((p) => [p.id, p]));
  const initiativesById = new Map(initiatives.map((i) => [i.id, i]));

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      {!compact && (
        <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          Exchange sequence
        </p>
      )}
      <ol className="space-y-2">
        {actions.map((action, index) => {
          const lane = STORY_ACTOR_COLORS[action.actor_type];
          const subject = actorDisplayName(action, personasById);
          const line = formatActionLine(action, personasById, initiativesById);

          return (
            <li
              key={`${action.sort_order}-${index}`}
              className={`rounded-xl border-l-4 px-3 py-2 ${lane}`}
            >
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
                <span>{index + 1}</span>
                <span>·</span>
                <span>{STORY_ACTOR_LABELS[action.actor_type]}</span>
                <span>·</span>
                <span className="text-zinc-700">{subject}</span>
              </div>
              <p className={`mt-1 font-semibold text-zinc-900 ${compact ? "text-sm" : ""}`}>
                {line}
              </p>
              {action.note && (
                <p className="mt-1 text-xs text-zinc-600">{action.note}</p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
