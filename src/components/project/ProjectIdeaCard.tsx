import { ArrowRight, MessageSquare, PencilLine, Share2, Sparkles, ThumbsUp, Users } from "lucide-react";

type IdeaState = "draft" | "shared";

export type ProjectIdeaCardData = {
  title: string;
  summary: string;
  author: string;
  initials: string;
  state: IdeaState;
  context: string;
  votes?: number;
  comments?: number;
  signal?: string;
  ctaLabel: string;
  badgeLabel: string;
};

function stateTone(state: IdeaState) {
  return state === "draft"
    ? "border-amber-200 bg-amber-50 text-amber-700"
    : "border-emerald-200 bg-emerald-50 text-emerald-700";
}

export function ProjectIdeaCard({ idea }: { idea: ProjectIdeaCardData }) {
  const shared = idea.state === "shared";

  return (
    <article className="rounded-2xl border border-zinc-100 bg-zinc-50/50 p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] ${stateTone(idea.state)}`}
            >
              {idea.badgeLabel}
            </span>
            {shared && idea.signal && (
              <span className="inline-flex items-center rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-semibold tracking-tight text-zinc-600">
                {idea.signal}
              </span>
            )}
          </div>
          <h4 className="mt-3 font-display text-base font-bold tracking-tight text-zinc-900 sm:text-[1.05rem]">
            {idea.title}
          </h4>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-sttns-muted">{idea.summary}</p>
        </div>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
          {idea.initials}
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[11px] font-bold text-zinc-600 ring-1 ring-zinc-200">
          {idea.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold tracking-tight text-zinc-900">{idea.author}</p>
          <p className="text-xs leading-relaxed text-sttns-muted">{idea.context}</p>
        </div>
      </div>

      {shared ? (
        <div className="mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-4 text-sm text-zinc-600">
          <span className="inline-flex items-center gap-2 text-[13px]">
            <ThumbsUp className="h-4 w-4 text-emerald-600" />
            {idea.votes} votes
          </span>
          <span className="inline-flex items-center gap-2 text-[13px]">
            <MessageSquare className="h-4 w-4 text-sky-600" />
            {idea.comments} comments
          </span>
          <span className="inline-flex items-center gap-2 text-[13px]">
            <Users className="h-4 w-4 text-zinc-500" />
            Active collaboration
          </span>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-900/80">
          Idea is still private and can be refined before sharing.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="sttns-btn-secondary text-xs sm:text-sm">
          <PencilLine className="h-4 w-4" />
          Edit idea
        </button>
        <button type="button" className="sttns-btn-primary text-xs sm:text-sm">
          {shared ? <Share2 className="h-4 w-4" /> : <Sparkles className="h-4 w-4" />}
          {idea.ctaLabel}
        </button>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4">
        <p className="flex items-center justify-between gap-3 text-sm text-sttns-muted">
          <span>{shared ? "Open collaborative follow-up" : "Still in private incubation"}</span>
          <ArrowRight className="h-4 w-4 shrink-0 text-zinc-300" />
        </p>
      </div>
    </article>
  );
}
