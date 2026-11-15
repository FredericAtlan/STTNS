import { Check, ExternalLink, Square } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { TaskAssigneeBadge } from "@/components/execution/TaskAssigneeBadge";
import type { SpineStoryTaskPreview } from "@/lib/sttns/storiesSpine";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/security/urls";

type MemberLike = {
  user_id: string;
  full_name: string | null;
  email: string | null;
};

interface Props {
  tasks: SpineStoryTaskPreview[];
  members: MemberLike[];
  variant?: "nested" | "compact";
  className?: string;
}

function TaskNotionLinkIcon({ url, title }: { url: string; title: string }) {
  return (
    <a
      href={safeHref(url)}
      target="_blank"
      rel="noopener noreferrer"
      title="Ouvrir la documentation Notion"
      aria-label={`Documentation Notion — ${title}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-violet-600 hover:bg-violet-50 hover:text-violet-700"
    >
      <ExternalLink className="h-3 w-3" aria-hidden />
    </a>
  );
}

export function StoryTaskMiniList({
  tasks,
  members,
  variant = "nested",
  className,
}: Props) {
  if (tasks.length === 0) return null;

  if (variant === "compact") {
    return (
      <ul className={cn("flex flex-wrap gap-1.5", className)}>
        {tasks.map((task) => (
          <li
            key={task.id}
            title={task.title}
            className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-1.5 py-0.5"
          >
            {task.done ? (
              <Check className="h-3 w-3 text-emerald-600" aria-hidden />
            ) : (
              <Square className="h-3 w-3 text-zinc-400" aria-hidden />
            )}
            <TaskAssigneeBadge assigneeId={task.assignee_id} members={members} size="xs" />
            {task.done && task.notion_url && (
              <TaskNotionLinkIcon url={task.notion_url} title={task.title} />
            )}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className={cn("mt-2 space-y-1 border-l border-zinc-200 pl-3", className)}>
      {tasks.map((task) => (
        <li key={task.id} className="flex items-center gap-2 text-[11px] text-zinc-600">
          {task.done ? (
            <SpineObjectIcon type="task" size="xs" className="shrink-0 text-emerald-600" />
          ) : (
            <Square className="h-3 w-3 shrink-0 text-zinc-400" aria-hidden />
          )}
          <span className={cn("flex-1 truncate", task.done && "line-through text-zinc-400")}>
            {task.title}
          </span>
          <TaskAssigneeBadge assigneeId={task.assignee_id} members={members} size="xs" />
          {task.done && task.notion_url && (
            <TaskNotionLinkIcon url={task.notion_url} title={task.title} />
          )}
        </li>
      ))}
    </ul>
  );
}
