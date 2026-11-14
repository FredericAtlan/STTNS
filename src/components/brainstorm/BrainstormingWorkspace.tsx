"use client";

import { useEffect, useMemo, useState } from "react";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { SttnsPanel } from "@/components/layout/sttns-ui";
import { SttnsSectionTitle } from "@/components/ui/SttnsContextHelp";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";
import type { SttnsContextHelpContent } from "@/lib/sttns/sttnsContext";
import {
  createBrainstormCommentId,
  createIdeaId,
  filterIdeas,
  formatBrainstormCommentDate,
  loadBrainstormIdeas,
  resolveProjectAssignment,
  saveBrainstormIdeas,
  type BrainstormIdea,
  type BrainstormProjectOption,
} from "@/lib/sttns/brainstormIdeas";
import { Archive, MessageSquare, PencilLine, Send, Sparkles, Trash2, X } from "lucide-react";

type Props = {
  projects: BrainstormProjectOption[];
  authorName: string;
  /** When opened from a project, pre-fill assignment and default filter */
  contextProjectSlug?: string;
  contextProjectName?: string;
  eyebrow: string;
  title: string;
  description: string;
  contextHelp?: SttnsContextHelpContent;
};

type FilterMode = "all" | "unassigned" | "project";

function IdeaCommentsPanel({
  idea,
  authorName,
  onAddComment,
}: {
  idea: BrainstormIdea;
  authorName: string;
  onAddComment: (ideaId: string, body: string) => void;
}) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const body = draft.trim();
    if (!body) return;
    onAddComment(idea.id, body);
    setDraft("");
  };

  return (
    <div className="mt-3 space-y-2 rounded-lg border border-zinc-200 bg-zinc-50/80 p-3">
      <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
        <MessageSquare className="h-3.5 w-3.5" />
        Historique des commentaires ({idea.commentThread.length})
      </p>

      {idea.commentThread.length === 0 ? (
        <p className="text-xs text-zinc-500">Aucun commentaire pour l&apos;instant.</p>
      ) : (
        <ul className="max-h-48 space-y-2 overflow-y-auto pr-1">
          {idea.commentThread.map((comment) => (
            <li
              key={comment.id}
              className="rounded-md border border-zinc-200/80 bg-white px-2.5 py-2 text-xs"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
                <span className="font-semibold text-zinc-800">{comment.author}</span>
                <time className="text-[10px] text-zinc-400" dateTime={comment.createdAt}>
                  {formatBrainstormCommentDate(comment.createdAt)}
                </time>
              </div>
              <p className="mt-1 leading-snug text-zinc-700">{comment.body}</p>
            </li>
          ))}
        </ul>
      )}

      <div className="flex gap-2 pt-1">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Ajouter un commentaire…"
          rows={2}
          className="sttns-input min-h-0 flex-1 resize-none text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <button
          type="button"
          className="sttns-btn-primary shrink-0 self-end px-2.5 py-2 text-xs"
          onClick={submit}
          disabled={!draft.trim()}
          aria-label="Publier le commentaire"
        >
          <Send className="h-3.5 w-3.5" />
        </button>
      </div>
      <p className="text-[10px] text-zinc-400">Publié en tant que {authorName}</p>
    </div>
  );
}

function IdeaLine({
  idea,
  authorName,
  onEdit,
  onArchiveToggle,
  onDelete,
  onAddComment,
}: {
  idea: BrainstormIdea;
  authorName: string;
  onEdit: (idea: BrainstormIdea) => void;
  onArchiveToggle: (idea: BrainstormIdea) => void;
  onDelete: (idea: BrainstormIdea) => void;
  onAddComment: (ideaId: string, body: string) => void;
}) {
  const shared = idea.state === "shared";
  const archived = !!idea.archivedAt;
  return (
    <li className={`group border-b border-zinc-100 pb-3 last:border-0 last:pb-0 ${archived ? "opacity-80" : ""}`}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-zinc-900 group-hover:text-emerald-700">{idea.title}</p>
          <p className="mt-1 text-sm leading-snug text-zinc-600 line-clamp-2">{idea.summary}</p>
        </div>
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 transition group-hover:text-emerald-600" />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-zinc-500">
        <span>{idea.author}</span>
        {idea.projectName ? (
          <>
            <span>·</span>
            <span className="font-semibold text-zinc-700">{idea.projectName}</span>
          </>
        ) : (
          <>
            <span>·</span>
            <span className="text-zinc-400">Sans projet</span>
          </>
        )}
        {shared ? (
          <>
            <span>·</span>
            <span>{idea.votes} votes</span>
            <span>·</span>
            <span>{idea.commentThread.length} commentaire{idea.commentThread.length !== 1 ? "s" : ""}</span>
          </>
        ) : (
          <>
            <span>·</span>
            <span>Brouillon privé</span>
          </>
        )}
        {archived && (
          <>
            <span>·</span>
            <span className="font-semibold text-zinc-500">Archived</span>
          </>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={() => onEdit(idea)}
        >
          <PencilLine className="h-3.5 w-3.5" />
          Edit
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
          onClick={() => onArchiveToggle(idea)}
        >
          <Archive className="h-3.5 w-3.5" />
          {archived ? "Restore" : "Archive"}
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-700 hover:bg-red-50"
          onClick={() => onDelete(idea)}
        >
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
      </div>

      {shared && (
        <IdeaCommentsPanel idea={idea} authorName={authorName} onAddComment={onAddComment} />
      )}
    </li>
  );
}

export function BrainstormingWorkspace({
  projects,
  authorName,
  contextProjectSlug,
  contextProjectName,
  eyebrow,
  title,
  description,
  contextHelp = PAGE_CONTEXT_HELP.brainstorming,
}: Props) {
  const [ideas, setIdeas] = useState<BrainstormIdea[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>(
    contextProjectSlug ? "project" : "all"
  );
  const [filterProjectId, setFilterProjectId] = useState(
    () => projects.find((p) => p.slug === contextProjectSlug)?.id ?? ""
  );
  const [titleInput, setTitleInput] = useState("");
  const [summaryInput, setSummaryInput] = useState("");
  const [assignToProject, setAssignToProject] = useState(!!contextProjectSlug);
  const [projectId, setProjectId] = useState(
    () => projects.find((p) => p.slug === contextProjectSlug)?.id ?? ""
  );
  const [visibility, setVisibility] = useState<"draft" | "shared">("draft");
  const [editingIdeaId, setEditingIdeaId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setIdeas(loadBrainstormIdeas());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    saveBrainstormIdeas(ideas);
  }, [ideas, hydrated]);

  const filterProjectSlug =
    filterMode === "project"
      ? contextProjectSlug ??
        projects.find((p) => p.id === filterProjectId)?.slug ??
        null
      : null;

  const visibleDrafts = useMemo(() => {
    if (filterMode === "project" && !filterProjectSlug) return [];
    if (filterMode === "unassigned") {
      return filterIdeas(ideas, { state: "draft", unassignedOnly: true });
    }
    if (filterMode === "project" && filterProjectSlug) {
      return filterIdeas(ideas, { state: "draft", projectSlug: filterProjectSlug });
    }
    return filterIdeas(ideas, { state: "draft" });
  }, [ideas, filterMode, filterProjectSlug]);

  const visibleShared = useMemo(() => {
    if (filterMode === "project" && !filterProjectSlug) return [];
    if (filterMode === "unassigned") {
      return filterIdeas(ideas, { state: "shared", unassignedOnly: true });
    }
    if (filterMode === "project" && filterProjectSlug) {
      return filterIdeas(ideas, { state: "shared", projectSlug: filterProjectSlug });
    }
    return filterIdeas(ideas, { state: "shared" });
  }, [ideas, filterMode, filterProjectSlug]);

  const visibleArchived = useMemo(() => {
    if (filterMode === "project" && !filterProjectSlug) return [];
    if (filterMode === "unassigned") {
      return filterIdeas(ideas, { archivedOnly: true, unassignedOnly: true });
    }
    if (filterMode === "project" && filterProjectSlug) {
      return filterIdeas(ideas, { archivedOnly: true, projectSlug: filterProjectSlug });
    }
    return filterIdeas(ideas, { archivedOnly: true });
  }, [ideas, filterMode, filterProjectSlug]);

  const focusComposer = () => {
    const el = document.getElementById("create-idea");
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    el.classList.add("ring-2", "ring-emerald-400");
    window.setTimeout(() => el.classList.remove("ring-2", "ring-emerald-400"), 1200);
  };

  const resetForm = () => {
    setTitleInput("");
    setSummaryInput("");
    setAssignToProject(!!contextProjectSlug);
    setProjectId(projects.find((p) => p.slug === contextProjectSlug)?.id ?? "");
    setVisibility("draft");
    setEditingIdeaId(null);
  };

  const beginEdit = (idea: BrainstormIdea) => {
    setEditingIdeaId(idea.id);
    setTitleInput(idea.title);
    setSummaryInput(idea.summary);
    setAssignToProject(!!idea.projectId);
    setProjectId(idea.projectId ?? "");
    setVisibility(idea.state);
    focusComposer();
    setMessage(`Editing "${idea.title}"`);
  };

  const removeIdea = (idea: BrainstormIdea) => {
    setIdeas((prev) => prev.filter((row) => row.id !== idea.id));
    setMessage(`Idea deleted: ${idea.title}`);
    if (editingIdeaId === idea.id) {
      resetForm();
    }
  };

  const toggleArchive = (idea: BrainstormIdea) => {
    const now = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((row) =>
        row.id === idea.id
          ? { ...row, archivedAt: row.archivedAt ? null : now, updatedAt: now }
          : row
      )
    );
    setMessage(idea.archivedAt ? `Restored "${idea.title}".` : `Archived "${idea.title}".`);
  };

  const submitIdea = (forcedState?: "draft" | "shared") => {
    const trimmedTitle = titleInput.trim();
    const trimmedSummary = summaryInput.trim();
    if (!trimmedTitle) {
      setMessage("Add at least a title to save the idea.");
      focusComposer();
      return;
    }
    if (assignToProject && !projectId) {
      setMessage("Choose a project or uncheck assignment.");
      focusComposer();
      return;
    }

    const assignment = resolveProjectAssignment(assignToProject, projectId, projects);
    const now = new Date().toISOString();
    const nextState = forcedState ?? visibility;
    setIdeas((prev) => {
      if (editingIdeaId) {
        return prev.map((row) =>
          row.id === editingIdeaId
            ? {
                ...row,
                title: trimmedTitle,
                summary: trimmedSummary || "To be defined",
                state: nextState,
                ...assignment,
                updatedAt: now,
              }
            : row
        );
      }
      const newIdea: BrainstormIdea = {
        id: createIdeaId(),
        title: trimmedTitle,
        summary: trimmedSummary || "To be defined",
        author: authorName,
        state: nextState,
        ...assignment,
        votes: nextState === "shared" ? 1 : 0,
        comments: 0,
        commentThread: [],
        archivedAt: null,
        createdAt: now,
        updatedAt: now,
      };
      return [newIdea, ...prev];
    });
    resetForm();
    setMessage(
      editingIdeaId
        ? "Idea updated."
        : nextState === "shared"
          ? "Idea shared with the team."
          : "Draft saved."
    );
    focusComposer();
  };

  const shareDraft = (id: string) => {
    setIdeas((prev) =>
      prev.map((idea) =>
        idea.id === id
          ? {
              ...idea,
              state: "shared",
              updatedAt: new Date().toISOString(),
              votes: Math.max(idea.votes, 1),
            }
          : idea
      )
    );
    setMessage("Idea marked as shared.");
  };

  const addComment = (ideaId: string, body: string) => {
    const now = new Date().toISOString();
    setIdeas((prev) =>
      prev.map((idea) => {
        if (idea.id !== ideaId) return idea;
        const commentThread = [
          ...idea.commentThread,
          {
            id: createBrainstormCommentId(),
            author: authorName,
            body,
            createdAt: now,
          },
        ];
        return {
          ...idea,
          commentThread,
          comments: commentThread.length,
          updatedAt: now,
        };
      })
    );
    setMessage("Commentaire ajouté.");
  };

  if (!hydrated) {
    return (
      <div className="rounded-lg border border-zinc-200 bg-white p-8 text-sm text-zinc-500">
        Loading the idea board…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <ProjectPageHero
        eyebrow={eyebrow}
        title={title}
        description={description}
        contextHelp={contextHelp}
        actions={
          <>
            <button type="button" className="sttns-btn-primary text-sm" onClick={focusComposer}>
              New idea
            </button>
            <button
              type="button"
              className={`sttns-btn-secondary text-sm ${filterMode === "all" ? "border-emerald-600 text-emerald-700" : ""}`}
              onClick={() => setFilterMode("all")}
            >
              All
            </button>
            <button
              type="button"
              className={`sttns-btn-secondary text-sm ${filterMode === "unassigned" ? "border-emerald-600 text-emerald-700" : ""}`}
              onClick={() => setFilterMode("unassigned")}
            >
              Unassigned
            </button>
            {contextProjectSlug ? (
              <button
                type="button"
                className={`sttns-btn-secondary text-sm ${filterMode === "project" ? "border-emerald-600 text-emerald-700" : ""}`}
                onClick={() => setFilterMode("project")}
              >
                {contextProjectName ?? "This project"}
              </button>
            ) : (
              <button
                type="button"
                className={`sttns-btn-secondary text-sm ${filterMode === "project" ? "border-emerald-600 text-emerald-700" : ""}`}
                onClick={() => setFilterMode("project")}
              >
                By project
              </button>
            )}
          </>
        }
      />

      {filterMode === "project" && !contextProjectSlug && (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-zinc-200 bg-white px-4 py-3">
          <label className="text-sm font-semibold text-zinc-700" htmlFor="filter-project">
            Projet
          </label>
          <select
            id="filter-project"
            className="sttns-input max-w-xs text-sm"
            value={filterProjectId}
            onChange={(e) => setFilterProjectId(e.target.value)}
          >
            <option value="">Choose a project</option>
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          {!filterProjectId && (
            <span className="text-xs text-zinc-500">Select a project to filter ideas.</span>
          )}
        </div>
      )}

      {message && (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-3">
        <SttnsPanel
          title="Drafts"
          subtitle="Private until shared"
          count={visibleDrafts.length}
          help={PAGE_CONTEXT_HELP.brainstormDrafts}
        >
          <ul className="flex-1 space-y-3">
            {visibleDrafts.length === 0 ? (
              <li className="text-sm text-zinc-500">No drafts for this filter.</li>
            ) : (
              visibleDrafts.map((idea) => (
                <div key={idea.id}>
                  <IdeaLine
                    idea={idea}
                    authorName={authorName}
                    onEdit={beginEdit}
                    onArchiveToggle={toggleArchive}
                    onDelete={removeIdea}
                    onAddComment={addComment}
                  />
                  <button
                    type="button"
                    className="mt-2 text-xs font-bold text-emerald-700 hover:underline"
                    onClick={() => shareDraft(idea.id)}
                  >
                    Share when ready
                  </button>
                </div>
              ))
            )}
          </ul>
        </SttnsPanel>

        <SttnsPanel
          title="Shared"
          subtitle="Visible to the team"
          count={visibleShared.length}
          help={PAGE_CONTEXT_HELP.brainstormShared}
        >
          <ul className="flex-1 space-y-3">
            {visibleShared.length === 0 ? (
              <li className="text-sm text-zinc-500">No shared ideas for this filter.</li>
            ) : (
              visibleShared.map((idea) => (
                <IdeaLine
                  key={idea.id}
                  idea={idea}
                  authorName={authorName}
                  onEdit={beginEdit}
                  onArchiveToggle={toggleArchive}
                  onDelete={removeIdea}
                  onAddComment={addComment}
                />
              ))
            )}
          </ul>
        </SttnsPanel>

        <SttnsPanel
          id="create-idea"
          title="Create"
          subtitle="Cross-project · optional assignment"
          className="scroll-mt-28"
          help={PAGE_CONTEXT_HELP.brainstormCreate}
        >
          <div className="space-y-4 rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-4">
            {editingIdeaId && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800">
                <span>Editing an existing idea</span>
                <button
                  type="button"
                  onClick={resetForm}
                  className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                >
                  <X className="h-3.5 w-3.5" />
                  Cancel
                </button>
              </div>
            )}
            <div>
              <label className="sttns-label" htmlFor="idea-title">
                Title
              </label>
              <input
                id="idea-title"
                className="sttns-input"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                placeholder="E.g. Redesign the arbitration matrix"
              />
            </div>
            <div>
              <label className="sttns-label" htmlFor="idea-summary">
                Summary
              </label>
              <textarea
                id="idea-summary"
                className="sttns-input min-h-[88px]"
                value={summaryInput}
                onChange={(e) => setSummaryInput(e.target.value)}
                placeholder="In one sentence, the idea's intent"
              />
            </div>

            <div>
              <label className="sttns-label" htmlFor="idea-visibility">
                Visibility
              </label>
              <select
                id="idea-visibility"
                className="sttns-input"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "draft" | "shared")}
              >
                <option value="draft">Draft</option>
                <option value="shared">Shared</option>
              </select>
            </div>

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 bg-white px-3 py-3">
              <input
                type="checkbox"
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500/30"
                checked={assignToProject}
                onChange={(e) => setAssignToProject(e.target.checked)}
              />
              <span className="text-sm leading-snug text-zinc-700">
                Assign to an existing project
                <span className="mt-1 block text-xs text-zinc-500">
                  Uncheck to keep the idea at portfolio level (no project).
                </span>
              </span>
            </label>

            {assignToProject && (
              <div>
                <label className="sttns-label" htmlFor="idea-project">
                  Project
                </label>
                <select
                  id="idea-project"
                  className="sttns-input"
                  value={projectId}
                  onChange={(e) => setProjectId(e.target.value)}
                >
                  <option value="">Choose a project</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-1">
              <button type="button" className="sttns-btn-primary text-sm" onClick={() => submitIdea()}>
                {editingIdeaId ? "Update idea" : visibility === "shared" ? "Share directly" : "Save draft"}
              </button>
              {!editingIdeaId && (
                <button type="button" className="sttns-btn-secondary text-sm" onClick={() => submitIdea("shared")}>
                  Share directly
                </button>
              )}
            </div>
          </div>
        </SttnsPanel>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <SttnsSectionTitle as="h3" help={PAGE_CONTEXT_HELP.brainstormArchived}>
              Archived ideas
            </SttnsSectionTitle>
            <p className="text-sm text-zinc-500">Still consultable, restorable, editable.</p>
          </div>
          <span className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-semibold text-zinc-600">
            {visibleArchived.length}
          </span>
        </div>
        <SttnsPanel title="Archived" subtitle="Hidden from the main flow" count={visibleArchived.length}>
          <ul className="flex-1 space-y-3">
            {visibleArchived.length === 0 ? (
              <li className="text-sm text-zinc-500">No archived ideas for this filter.</li>
            ) : (
              visibleArchived.map((idea) => (
                <IdeaLine
                  key={idea.id}
                  idea={idea}
                  authorName={authorName}
                  onEdit={beginEdit}
                  onArchiveToggle={toggleArchive}
                  onDelete={removeIdea}
                  onAddComment={addComment}
                />
              ))
            )}
          </ul>
        </SttnsPanel>
      </section>
    </div>
  );
}
