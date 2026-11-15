"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Square, UserPlus, ExternalLink, Link2, Pencil } from "lucide-react";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import {
  saveStoryTaskAction,
  toggleStoryTaskAction,
  updateTaskAssignmentAction,
  updateTaskNotionUrlAction,
  type StoryTaskProjectMember,
} from "@/app/projects/[slug]/user-stories/actions";
import type { StoryTaskRow } from "@/lib/sttns/storiesSpine";
import { memberInitialsFromNames } from "@/lib/sttns/memberDisplay";
import { cn } from "@/lib/utils";
import { safeHref } from "@/lib/security/urls";

interface Props {
  storyId: string;
  projectId: string;
  projectSlug: string;
  initialTasks: StoryTaskRow[];
  projectMembers: StoryTaskProjectMember[];
  readOnly?: boolean;
}

function memberDisplayName(member: StoryTaskProjectMember): string {
  return member.full_name?.trim() || member.email?.split("@")[0] || "Membre";
}

function memberInitials(member: StoryTaskProjectMember): string {
  return memberInitialsFromNames(member.full_name, member.email);
}

function TaskAssigneePicker({
  taskId,
  assigneeId,
  projectSlug,
  projectMembers,
  readOnly,
  onAssigned,
}: {
  taskId: string;
  assigneeId: string | null;
  projectSlug: string;
  projectMembers: StoryTaskProjectMember[];
  readOnly?: boolean;
  onAssigned: (assigneeId: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const assignee = assigneeId
    ? projectMembers.find((m) => m.user_id === assigneeId) ?? null
    : null;

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function handleSelect(nextAssigneeId: string | null) {
    if (readOnly || busy) return;
    setBusy(true);
    setOpen(false);

    const result = await updateTaskAssignmentAction(taskId, nextAssigneeId, projectSlug);
    setBusy(false);

    if (result.ok) {
      onAssigned(nextAssigneeId);
    }
  }

  const label = assignee ? memberDisplayName(assignee) : "Non assigné";

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        disabled={readOnly || busy}
        onClick={() => !readOnly && setOpen((v) => !v)}
        title={readOnly ? "Lecture seule" : label}
        aria-label={readOnly ? "Assignation (lecture seule)" : `Assigner — ${label}`}
        className={cn(
          "inline-flex items-center justify-center rounded-full transition",
          readOnly && "cursor-not-allowed opacity-50",
          busy && "opacity-60"
        )}
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
        ) : assignee ? (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border-2 border-emerald-500 bg-emerald-50 text-[10px] font-bold uppercase tracking-tight text-emerald-900">
            {memberInitials(assignee)}
          </span>
        ) : (
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400 hover:border-zinc-400 hover:bg-zinc-100">
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
          </span>
        )}
      </button>

      {open && !readOnly && (
        <div className="absolute right-0 z-30 mt-1 w-52 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
            Assigner à
          </p>
          {projectMembers.length === 0 ? (
            <p className="px-3 py-2 text-xs text-zinc-400 italic">Aucun membre</p>
          ) : (
            projectMembers.map((member) => (
              <button
                key={member.user_id}
                type="button"
                onClick={() => void handleSelect(member.user_id)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-emerald-50",
                  member.user_id === assigneeId && "bg-emerald-50/80"
                )}
              >
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-emerald-400 bg-emerald-50 text-[9px] font-bold uppercase text-emerald-900">
                  {memberInitials(member)}
                </span>
                <span className="truncate text-zinc-800">
                  {memberDisplayName(member)}
                </span>
              </button>
            ))
          )}
          {assigneeId && (
            <>
              <div className="my-1 border-t border-zinc-100" />
              <button
                type="button"
                onClick={() => void handleSelect(null)}
                className="w-full px-3 py-2 text-left text-sm text-zinc-500 hover:bg-zinc-50"
              >
                Désassigner
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function TaskNotionLink({
  taskId,
  notionUrl,
  projectSlug,
  readOnly,
  onUpdated,
}: {
  taskId: string;
  notionUrl: string | null;
  projectSlug: string;
  readOnly?: boolean;
  onUpdated: (url: string | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notionUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setDraft(notionUrl ?? "");
  }, [notionUrl, editing]);

  async function handleSave() {
    if (readOnly || busy) return;
    setBusy(true);
    setLocalError(null);

    const trimmed = draft.trim();
    const result = await updateTaskNotionUrlAction(taskId, trimmed || null, projectSlug);
    setBusy(false);

    if (!result.ok) {
      setLocalError(result.error || "Impossible d'enregistrer le lien.");
      return;
    }

    onUpdated(trimmed || null);
    setEditing(false);
  }

  if (editing && !readOnly) {
    return (
      <div className="flex min-w-0 flex-1 flex-col gap-1 sm:flex-row sm:items-center">
        <input
          type="url"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="https://notion.so/…"
          disabled={busy}
          className="min-w-0 flex-1 rounded border border-zinc-300 px-2 py-1 text-xs"
        />
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={busy}
            className="rounded bg-emerald-600 px-2 py-1 text-[11px] font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
          >
            {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : "OK"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(false);
              setDraft(notionUrl ?? "");
              setLocalError(null);
            }}
            disabled={busy}
            className="rounded border border-zinc-300 px-2 py-1 text-[11px] text-zinc-600 hover:bg-zinc-50"
          >
            Annuler
          </button>
        </div>
        {localError && <p className="text-[10px] text-red-600">{localError}</p>}
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-1">
      {safeHref(notionUrl) ? (
        <a
          href={safeHref(notionUrl)}
          target="_blank"
          rel="noopener noreferrer"
          title="Ouvrir la doc Notion"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-violet-200 bg-violet-50 text-violet-700 hover:bg-violet-100"
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : (
        <span
          title="Documentation Notion absente"
          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-dashed border-zinc-300 bg-zinc-50 text-zinc-400"
        >
          <Link2 className="h-3.5 w-3.5" aria-hidden />
        </span>
      )}
      {!readOnly && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          title={notionUrl ? "Modifier le lien Notion" : "Ajouter un lien Notion"}
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700"
        >
          <Pencil className="h-3 w-3" aria-hidden />
        </button>
      )}
    </div>
  );
}

export function StoryTasksPanel({
  storyId,
  projectId,
  projectSlug,
  initialTasks,
  projectMembers,
  readOnly = false,
}: Props) {
  const router = useRouter();
  const [tasks, setTasks] = useState(initialTasks);
  const [newTitle, setNewTitle] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const progressPercent = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  async function handleAdd() {
    if (readOnly) return;
    const title = newTitle.trim();
    if (!title || isAdding) return;

    setIsAdding(true);
    setError(null);

    const result = await saveStoryTaskAction(projectId, projectSlug, storyId, title);

    if (!result.ok) {
      setIsAdding(false);
      setError(result.error || "Impossible d'ajouter la task.");
      return;
    }

    setTasks((prev) => [
      ...prev,
      {
        id: result.id,
        title,
        status: "todo",
        done: false,
        assignee_id: null,
        notion_url: null,
      },
    ]);
    setNewTitle("");
    setIsAdding(false);
    router.refresh();
  }

  async function handleToggle(task: StoryTaskRow) {
    if (readOnly || togglingId) return;

    const nextDone = !task.done;
    setTogglingId(task.id);
    setError(null);

    const result = await toggleStoryTaskAction(task.id, projectSlug, nextDone);

    if (!result.ok) {
      setTogglingId(null);
      setError(result.error || "Impossible de mettre à jour la task.");
      return;
    }

    setTasks((prev) =>
      prev.map((t) =>
        t.id === task.id
          ? { ...t, done: nextDone, status: nextDone ? "done" : "todo" }
          : t
      )
    );
    setTogglingId(null);
    router.refresh();
  }

  function handleAssigneeChange(taskId: string, assigneeId: string | null) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, assignee_id: assigneeId } : t))
    );
    router.refresh();
  }

  function handleNotionChange(taskId: string, notionUrl: string | null) {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, notion_url: notionUrl } : t))
    );
    router.refresh();
  }

  return (
    <div className="rounded border border-zinc-200 bg-white p-4 space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <SpineObjectIcon type="task" />
            Tasks
          </h3>
          {readOnly && (
            <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Lecture seule
            </span>
          )}
        </div>

        {totalCount > 0 && (
          <div className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-xs text-zinc-500">
              <span>Avancement</span>
              <span className="font-medium text-zinc-700">
                {doneCount} / {totalCount} tâche{totalCount !== 1 ? "s" : ""}{" "}
                complétée{doneCount !== 1 ? "s" : ""}
              </span>
            </div>
            <div
              className="h-2 w-full overflow-hidden rounded-full bg-zinc-100"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${progressPercent}% des tâches terminées`}
            >
              <div
                className="h-full rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
          {error}
        </div>
      )}

      {tasks.length === 0 ? (
        <p className="text-xs text-zinc-400 italic">Aucune sous-tâche pour cette story.</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const busy = togglingId === task.id;
            return (
              <li key={task.id}>
                <div
                  className={cn(
                    "flex flex-col gap-2 rounded px-2 py-1.5 hover:bg-zinc-50 sm:flex-row sm:items-start",
                    task.done && "opacity-70"
                  )}
                >
                  <div className="flex min-w-0 flex-1 items-start gap-2">
                    <button
                      type="button"
                      disabled={readOnly || busy || !!togglingId}
                      onClick={() => void handleToggle(task)}
                      className="mt-0.5 shrink-0 text-emerald-600 disabled:opacity-40"
                      aria-label={task.done ? "Marquer à faire" : "Marquer terminé"}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : task.done ? (
                        <SpineObjectIcon type="task" size="sm" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </button>
                    <span
                      className={cn(
                        "flex-1 text-sm pt-0.5",
                        task.done ? "line-through text-zinc-500" : "text-zinc-800"
                      )}
                    >
                      {task.title}
                    </span>
                    <TaskAssigneePicker
                      taskId={task.id}
                      assigneeId={task.assignee_id}
                      projectSlug={projectSlug}
                      projectMembers={projectMembers}
                      readOnly={readOnly}
                      onAssigned={(assigneeId) => handleAssigneeChange(task.id, assigneeId)}
                    />
                  </div>
                  <TaskNotionLink
                    taskId={task.id}
                    notionUrl={task.notion_url}
                    projectSlug={projectSlug}
                    readOnly={readOnly}
                    onUpdated={(url) => handleNotionChange(task.id, url)}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void handleAdd();
            }}
            disabled={isAdding}
            placeholder="Nouvelle task…"
            className="flex-1 rounded border border-zinc-300 px-3 py-2 text-sm disabled:bg-zinc-50"
          />
          <button
            type="button"
            onClick={() => void handleAdd()}
            disabled={isAdding || !newTitle.trim()}
            className="inline-flex items-center gap-1 rounded bg-emerald-600 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-zinc-300"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter
          </button>
        </div>
      )}
    </div>
  );
}
