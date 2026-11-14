export type BrainstormIdeaState = "draft" | "shared";

export type BrainstormIdeaComment = {
  id: string;
  author: string;
  body: string;
  createdAt: string;
};

export type BrainstormIdea = {
  id: string;
  title: string;
  summary: string;
  author: string;
  state: BrainstormIdeaState;
  projectId: string | null;
  projectSlug: string | null;
  projectName: string | null;
  votes: number;
  /** @deprecated Dérivé de commentThread.length — conservé pour migration localStorage */
  comments: number;
  commentThread: BrainstormIdeaComment[];
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BrainstormProjectOption = {
  id: string;
  slug: string;
  name: string;
};

const STORAGE_KEY = "sttns_brainstorm_ideas_v1";

function createCommentId() {
  return `comment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeCommentThread(raw: unknown): BrainstormIdeaComment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((row): row is Partial<BrainstormIdeaComment> => !!row && typeof row === "object")
    .map((row) => ({
      id: String(row.id ?? createCommentId()),
      author: String(row.author ?? "Anonyme"),
      body: String(row.body ?? "").trim(),
      createdAt: String(row.createdAt ?? new Date().toISOString()),
    }))
    .filter((row) => row.body.length > 0)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

const SEED_IDEAS: BrainstormIdea[] = [
  {
    id: "seed-1",
    title: "Refonte de la matrice d'arbitrage",
    summary: "Scoring pondéré par NSM avec une lecture plus simple pour l'équipe produit.",
    author: "Frédéric A.",
    state: "draft",
    projectId: null,
    projectSlug: null,
    projectName: null,
    votes: 0,
    comments: 0,
    commentThread: [],
    archivedAt: null,
    createdAt: "2026-05-28T10:00:00.000Z",
    updatedAt: "2026-05-28T10:00:00.000Z",
  },
  {
    id: "seed-2",
    title: "Système de feedback en temps réel",
    summary: "Mini-enquêtes après arbitrage pour capter les signaux faibles.",
    author: "Frédéric A.",
    state: "draft",
    projectId: null,
    projectSlug: null,
    projectName: null,
    votes: 0,
    comments: 0,
    commentThread: [],
    archivedAt: null,
    createdAt: "2026-05-29T10:00:00.000Z",
    updatedAt: "2026-05-29T10:00:00.000Z",
  },
  {
    id: "seed-3",
    title: "IA pour prédire les kills de phase 1",
    summary: "Analyse prédictive basée sur les historiques d'arbitrage.",
    author: "Frédéric A.",
    state: "shared",
    projectId: null,
    projectSlug: null,
    projectName: null,
    votes: 12,
    comments: 5,
    commentThread: [
      {
        id: "seed-3-c1",
        author: "Laura P.",
        body: "Intéressant pour prioriser les kills — as-tu un jeu de données historique ?",
        createdAt: "2026-05-30T11:00:00.000Z",
      },
      {
        id: "seed-3-c2",
        author: "Frédéric A.",
        body: "Oui, on peut partir des 3 derniers cycles d'arbitrage MarketChain.",
        createdAt: "2026-05-30T14:20:00.000Z",
      },
      {
        id: "seed-3-c3",
        author: "Yao M.",
        body: "À coupler avec le ratio Valeur/Effort Spine (Impact Feature ÷ Jours) pour éviter un modèle opaque.",
        createdAt: "2026-05-31T09:10:00.000Z",
      },
      {
        id: "seed-3-c4",
        author: "Laura P.",
        body: "OK si on garde une lecture simple côté CEO.",
        createdAt: "2026-05-31T16:45:00.000Z",
      },
      {
        id: "seed-3-c5",
        author: "Frédéric A.",
        body: "Je prépare un epic LEARN pour un POC sur 2 sprints.",
        createdAt: "2026-06-01T10:00:00.000Z",
      },
    ],
    archivedAt: null,
    createdAt: "2026-05-30T10:00:00.000Z",
    updatedAt: "2026-06-01T10:00:00.000Z",
  },
  {
    id: "seed-4",
    title: "Tableau Persona Adja Cissé",
    summary: "Vue consolidée pour relier les signaux terrain aux besoins persona.",
    author: "Laura P.",
    state: "shared",
    projectId: null,
    projectSlug: null,
    projectName: null,
    votes: 8,
    comments: 3,
    commentThread: [
      {
        id: "seed-4-c1",
        author: "Adja C.",
        body: "Utile pour relier les signaux terrain aux besoins persona.",
        createdAt: "2026-05-31T12:00:00.000Z",
      },
      {
        id: "seed-4-c2",
        author: "Laura P.",
        body: "On pourrait lier ça aux stories Adja déjà validées.",
        createdAt: "2026-06-01T08:30:00.000Z",
      },
      {
        id: "seed-4-c3",
        author: "Frédéric A.",
        body: "Bonne idée — je l'assigne au projet marketchain.",
        createdAt: "2026-06-01T15:00:00.000Z",
      },
    ],
    archivedAt: null,
    createdAt: "2026-05-31T10:00:00.000Z",
    updatedAt: "2026-06-01T15:00:00.000Z",
  },
];

const SEED_BY_ID = new Map(SEED_IDEAS.map((idea) => [idea.id, idea]));

function parseIdeas(raw: string | null): BrainstormIdea[] {
  if (!raw) return SEED_IDEAS;
  try {
    const parsed = JSON.parse(raw) as Partial<BrainstormIdea>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return SEED_IDEAS;
    return parsed
      .filter((idea): idea is Partial<BrainstormIdea> => !!idea && typeof idea.id === "string")
      .map((idea) => {
        const seed = SEED_BY_ID.get(idea.id!);
        let commentThread = normalizeCommentThread(idea.commentThread);
        if (commentThread.length === 0 && seed?.commentThread.length) {
          commentThread = seed.commentThread;
        }
        return {
          id: idea.id!,
          title: String(idea.title ?? ""),
          summary: String(idea.summary ?? ""),
          author: String(idea.author ?? ""),
          state: idea.state === "shared" ? "shared" : "draft",
          projectId: idea.projectId ?? null,
          projectSlug: idea.projectSlug ?? null,
          projectName: idea.projectName ?? null,
          votes: Number.isFinite(idea.votes) ? Number(idea.votes) : 0,
          commentThread,
          comments: commentThread.length,
          archivedAt: idea.archivedAt ?? null,
          createdAt: String(idea.createdAt ?? new Date().toISOString()),
          updatedAt: String(idea.updatedAt ?? idea.createdAt ?? new Date().toISOString()),
        };
      });
  } catch {
    return SEED_IDEAS;
  }
}

export function loadBrainstormIdeas(): BrainstormIdea[] {
  if (typeof window === "undefined") return SEED_IDEAS;
  return parseIdeas(window.localStorage.getItem(STORAGE_KEY));
}

export function saveBrainstormIdeas(ideas: BrainstormIdea[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
}

export function createIdeaId() {
  return `idea-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createBrainstormCommentId() {
  return createCommentId();
}

export function formatBrainstormCommentDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function filterIdeas(
  ideas: BrainstormIdea[],
  opts: {
    state?: BrainstormIdeaState;
    projectSlug?: string | null;
    unassignedOnly?: boolean;
    archivedOnly?: boolean;
  }
) {
  return ideas.filter((idea) => {
    if (opts.archivedOnly && !idea.archivedAt) return false;
    if (opts.state && idea.state !== opts.state) return false;
    if (opts.unassignedOnly) return !idea.projectId;
    if (opts.projectSlug) return idea.projectSlug === opts.projectSlug;
    return true;
  });
}

export function resolveProjectAssignment(
  assign: boolean,
  projectId: string,
  projects: BrainstormProjectOption[]
): Pick<BrainstormIdea, "projectId" | "projectSlug" | "projectName"> {
  if (!assign || !projectId) {
    return { projectId: null, projectSlug: null, projectName: null };
  }
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    return { projectId: null, projectSlug: null, projectName: null };
  }
  return {
    projectId: project.id,
    projectSlug: project.slug,
    projectName: project.name,
  };
}
