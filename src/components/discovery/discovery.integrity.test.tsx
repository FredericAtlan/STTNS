/**
 * Intégrité Discovery — Shape Up / roll-up Auto, bulk finalize, Draft Manager JSON.
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToString } from "react-dom/server";
import { DiscoveryMatrix } from "@/components/discovery/DiscoveryMatrix";
import { DiscoveryDraftManager } from "@/components/discovery/DiscoveryDraftManager";
import {
  buildDiscoveryDraftFile,
  discoveryStorageKey,
  emptyDraftMetadata,
  serializeDiscoveryDraftFile,
  serializeSessionPayload,
  type DiscoveryDraft,
  type DiscoveryDraftMetadata,
} from "@/lib/sttns/discoveryMatrix";
import { sandboxToDiscoverySpineProps } from "@/lib/sttns/spineWhySandbox";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

const saveEpicAction = vi.fn();
const saveInitiativeAction = vi.fn();
const saveUserStoryAction = vi.fn();
const archiveWorkItemAction = vi.fn();

const {
  listMyDiscoveryDraftsAction,
  loadMyDiscoveryDraftAction,
  saveMyDiscoveryDraftAction,
  deleteMyDiscoveryDraftAction,
  assertDiscoveryReverseAllowedAction,
} = vi.hoisted(() => ({
  listMyDiscoveryDraftsAction: vi.fn(),
  loadMyDiscoveryDraftAction: vi.fn(),
  saveMyDiscoveryDraftAction: vi.fn(),
  deleteMyDiscoveryDraftAction: vi.fn(),
  assertDiscoveryReverseAllowedAction: vi.fn(),
}));

vi.mock("@/app/projects/[slug]/epics/actions", () => ({
  saveEpicAction: (...args: unknown[]) => saveEpicAction(...args),
}));

vi.mock("@/app/projects/[slug]/features/actions", () => ({
  saveInitiativeAction: (...args: unknown[]) => saveInitiativeAction(...args),
}));

vi.mock("@/app/projects/[slug]/user-stories/actions", () => ({
  saveUserStoryAction: (...args: unknown[]) => saveUserStoryAction(...args),
}));

vi.mock("@/app/projects/[slug]/work-items/actions", () => ({
  archiveWorkItemAction: (...args: unknown[]) => archiveWorkItemAction(...args),
}));

vi.mock("@/app/projects/[slug]/discovery/actions", () => ({
  listMyDiscoveryDraftsAction: (...args: unknown[]) =>
    listMyDiscoveryDraftsAction(...args),
  loadMyDiscoveryDraftAction: (...args: unknown[]) =>
    loadMyDiscoveryDraftAction(...args),
  saveMyDiscoveryDraftAction: (...args: unknown[]) =>
    saveMyDiscoveryDraftAction(...args),
  deleteMyDiscoveryDraftAction: (...args: unknown[]) =>
    deleteMyDiscoveryDraftAction(...args),
  assertDiscoveryReverseAllowedAction: (...args: unknown[]) =>
    assertDiscoveryReverseAllowedAction(...args),
}));
vi.mock("@/components/ui/SttnsContextHelp", () => ({
  SttnsContextHelp: () => null,
}));

vi.mock("@/components/ui/SpineObjectIcon", () => ({
  SpineObjectIcon: () => <span data-testid="spine-icon" />,
}));

const PROJECT_ID = "proj-discovery-test";
const PROJECT_SLUG = "marketchain-demo";
const STORAGE_KEY = discoveryStorageKey(PROJECT_ID);

function draft(
  partial: Partial<DiscoveryDraft> & Pick<DiscoveryDraft, "id" | "type">
): DiscoveryDraft {
  return {
    title: "",
    parentId: null,
    jtbdId: null,
    impact: null,
    effort_days: null,
    complexity: null,
    description: "",
    doc_url: "",
    spineId: null,
    ...partial,
  };
}

function seedSession(drafts: DiscoveryDraft[], metadata?: Partial<DiscoveryDraftMetadata>) {
  const meta: DiscoveryDraftMetadata = {
    ...emptyDraftMetadata("alice@sttns.app"),
    ...metadata,
  };
  sessionStorage.setItem(STORAGE_KEY, serializeSessionPayload(drafts, meta));
}

async function openSessionMenu(
  user: ReturnType<typeof userEvent.setup>
) {
  await user.click(screen.getByRole("button", { name: /^Session$/i }));
}

async function expandDraftDetails(
  user: ReturnType<typeof userEvent.setup>
) {
  const toggle = screen.getByRole("button", { name: /Afficher les détails/i });
  await user.click(toggle);
}

async function confirmReverseModal(user: ReturnType<typeof userEvent.setup>) {
  expect(
    await screen.findByRole("heading", { name: /Revenir en brouillon/i })
  ).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /Archiver et revenir/i }));
}

/** Coche toutes les lignes finalisables (checkbox « pour créer au Spine »). */
async function selectReadyForSpine(user: ReturnType<typeof userEvent.setup>) {
  const boxes = screen.getAllByRole("checkbox", {
    name: /pour créer au Spine/i,
  });
  for (const box of boxes) {
    const input = box as HTMLInputElement;
    if (!input.disabled && !input.checked) {
      await user.click(input);
    }
  }
}

function renderMatrix(
  overrides: Partial<{
    spineEpics: { id: string; title: string }[];
    spineFeatures: { id: string; title: string; epic_id: string | null }[];
    jtbdOptions: { id: string; title: string; personaName: string }[];
    defaultAuthor: string;
  }> = {}
) {
  const sandboxSpine = sandboxToDiscoverySpineProps();
  return render(
    <DiscoveryMatrix
      projectId={PROJECT_ID}
      projectSlug={PROJECT_SLUG}
      spineEpics={overrides.spineEpics ?? sandboxSpine.spineEpics}
      spineFeatures={overrides.spineFeatures ?? sandboxSpine.spineFeatures}
      jtbdOptions={overrides.jtbdOptions ?? sandboxSpine.jtbdOptions}
      defaultAuthor={overrides.defaultAuthor ?? "alice@sttns.app"}
    />
  );
}

beforeEach(() => {
  sessionStorage.clear();
  saveEpicAction.mockReset();
  saveInitiativeAction.mockReset();
  saveUserStoryAction.mockReset();
  archiveWorkItemAction.mockReset();
  listMyDiscoveryDraftsAction.mockReset();
  loadMyDiscoveryDraftAction.mockReset();
  saveMyDiscoveryDraftAction.mockReset();
  deleteMyDiscoveryDraftAction.mockReset();
  assertDiscoveryReverseAllowedAction.mockReset();
  saveEpicAction.mockResolvedValue({ ok: true, id: "uuid-epic-1" });
  saveInitiativeAction.mockResolvedValue({ ok: true, id: "uuid-feat-1" });
  saveUserStoryAction.mockResolvedValue({ ok: true, id: "uuid-story-1" });
  archiveWorkItemAction.mockResolvedValue({ ok: true });
  listMyDiscoveryDraftsAction.mockResolvedValue({ ok: true, drafts: [] });
  loadMyDiscoveryDraftAction.mockResolvedValue({
    ok: false,
    error: "not used",
  });
  saveMyDiscoveryDraftAction.mockResolvedValue({
    ok: true,
    id: "cloud-1",
    updatedAt: "2026-07-20T12:00:00.000Z",
  });
  deleteMyDiscoveryDraftAction.mockResolvedValue({ ok: true });
  assertDiscoveryReverseAllowedAction.mockImplementation(
    async (_projectId: string, spineIds: string[]) => ({
      ok: true as const,
      items: spineIds.map((id) => ({
        id,
        title: id,
        type: "feature",
        status: "todo",
      })),
    })
  );
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  vi.clearAllMocks();
});

describe("DiscoveryMatrix — Shape Up & roll-up Auto", () => {
  it("verrouille Effort/Risque Feature en Auto quand une Story enfant est en session", async () => {
    seedSession([
      draft({
        id: "draft_f1",
        type: "feature",
        title: "Feature Auto Parent",
        parentId: "epic-spine-1",
        jtbdId: "jtbd-1",
        impact: 2,
        effort_days: 5,
        complexity: 1,
      }),
      draft({
        id: "draft_s1",
        type: "story",
        title: "Story A",
        parentId: "draft_f1",
        effort_days: 0.5,
        complexity: 2,
      }),
      draft({
        id: "draft_s2",
        type: "story",
        title: "Story B",
        parentId: "draft_f1",
        effort_days: 3,
        complexity: 3,
      }),
    ]);

    renderMatrix({
      spineEpics: [
        { id: "epic-spine-1", title: "Epic Live" },
      ],
    });

    expect(await screen.findByDisplayValue("Feature Auto Parent")).toBeInTheDocument();

    const autoEffort = screen.getByLabelText("Effort (∑ Stories session)");
    expect(autoEffort).toHaveTextContent("Auto");
    expect(autoEffort).toHaveTextContent("∑ 3.5j");

    const autoLabels = screen.getAllByText("Auto");
    expect(autoLabels.length).toBeGreaterThanOrEqual(2);

    // Stories gardent les pickers ; la Feature parent n'en a plus
    const effortPickers = screen.getAllByLabelText("Effort jours");
    expect(effortPickers).toHaveLength(2);
    expect(effortPickers.every((el) => !(el as HTMLSelectElement).disabled)).toBe(true);

    expect(screen.getByText("R:3")).toBeInTheDocument();
  });

  it("conserve Effort/Risque modifiables pour une Feature isolée (Shape Up)", async () => {
    seedSession([
      draft({
        id: "draft_f_solo",
        type: "feature",
        title: "Feature Isolée",
        parentId: "epic-spine-1",
        jtbdId: "jtbd-1",
        impact: 1,
        effort_days: 2,
        complexity: 2,
      }),
    ]);

    renderMatrix({
      spineEpics: [
        { id: "epic-spine-1", title: "Epic Live" },
      ],
    });

    expect(await screen.findByDisplayValue("Feature Isolée")).toBeInTheDocument();
    expect(screen.queryByText("Auto")).not.toBeInTheDocument();

    const effort = screen.getByLabelText("Effort jours") as HTMLSelectElement;
    const risk = screen.getByLabelText("Risque") as HTMLSelectElement;
    expect(effort).not.toBeDisabled();
    expect(risk).not.toBeDisabled();
    expect(effort.value).toBe("2");
    expect(risk.value).toBe("2");
  });

  it("P0.2 — Bulk Finalize idempotent : après échec partiel, retry ne re-crée pas les items déjà versés", async () => {
    const user = userEvent.setup();
    seedSession([
      draft({ id: "draft_e1", type: "epic", title: "Epic Ready" }),
      draft({
        id: "draft_f1",
        type: "feature",
        title: "Feat Ready",
        parentId: "draft_e1",
        jtbdId: "jtbd-1",
        impact: 2,
        effort_days: 1,
        complexity: 1,
      }),
      draft({
        id: "draft_s1",
        type: "story",
        title: "Story Ready",
        parentId: "draft_f1",
        effort_days: 1,
        complexity: 1,
      }),
    ]);

    // 1re passe : Epic OK, Feature échoue, Story jamais tentée.
    saveInitiativeAction.mockResolvedValueOnce({
      ok: false,
      error: "Simulated network error",
    });

    renderMatrix();
    expect(await screen.findByDisplayValue("Epic Ready")).toBeInTheDocument();

    expect(screen.getByRole("button", { name: /Créer au Spine \(0\)/i })).toBeDisabled();
    await selectReadyForSpine(user);
    await user.click(screen.getByRole("button", { name: /Créer au Spine \(3\)/i }));

    // Après la 1re tentative : Epic versé (ligne conservée), Feature en échec, Story jamais tentée.
    await waitFor(() => {
      expect(saveEpicAction).toHaveBeenCalledTimes(1);
      expect(saveInitiativeAction).toHaveBeenCalledTimes(1);
      expect(saveUserStoryAction).toHaveBeenCalledTimes(0);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Epic Ready")).toBeDisabled();
      expect(screen.getByDisplayValue("Feat Ready")).not.toBeDisabled();
      expect(screen.getByDisplayValue("Story Ready")).not.toBeDisabled();
    });

    // Resélectionner les lignes encore prêtes (la sélection des versés est purgée).
    await selectReadyForSpine(user);
    expect(screen.getByRole("button", { name: /Créer au Spine \(2\)/i })).toBeInTheDocument();

    // 2e passe : Feature réussit, puis Story réussit. Epic NE doit PAS être re-commit.
    saveInitiativeAction.mockResolvedValueOnce({ ok: true, id: "uuid-feat-retry" });
    saveUserStoryAction.mockResolvedValueOnce({ ok: true, id: "uuid-story-retry" });

    await user.click(screen.getByRole("button", { name: /Créer au Spine \(2\)/i }));

    await waitFor(() => {
      // Epic reste appelé UNE seule fois : idempotence P0.2.
      expect(saveEpicAction).toHaveBeenCalledTimes(1);
      expect(saveInitiativeAction).toHaveBeenCalledTimes(2);
      expect(saveUserStoryAction).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Feat Ready")).toBeDisabled();
      expect(screen.getByDisplayValue("Story Ready")).toBeDisabled();
      expect(screen.getByRole("button", { name: /Créer au Spine \(0\)/i })).toBeDisabled();
      expect(screen.getByRole("button", { name: /Revenir \(3\)/i })).not.toBeDisabled();
    });
  });

  it("Bulk Finalize ne verse que les chaînes valides et laisse les lignes incomplètes", async () => {
    const user = userEvent.setup();
    seedSession([
      draft({ id: "draft_e1", type: "epic", title: "Epic Ready" }),
      draft({
        id: "draft_f1",
        type: "feature",
        title: "Feat Ready",
        parentId: "draft_e1",
        jtbdId: "jtbd-1",
        impact: 2,
        effort_days: 1,
        complexity: 1,
      }),
      draft({
        id: "draft_s1",
        type: "story",
        title: "Story Ready",
        parentId: "draft_f1",
        effort_days: 1,
        complexity: 1,
      }),
      draft({
        id: "draft_f_bad",
        type: "feature",
        title: "Feat Incomplete",
        parentId: null,
        jtbdId: null,
        impact: 1,
        effort_days: 1,
        complexity: 1,
      }),
    ]);

    renderMatrix();
    expect(await screen.findByDisplayValue("Feat Incomplete")).toBeInTheDocument();

    await selectReadyForSpine(user);
    const bulkBtn = screen.getByRole("button", { name: /Créer au Spine \(3\)/i });
    await user.click(bulkBtn);

    await waitFor(() => {
      expect(saveEpicAction).toHaveBeenCalledTimes(1);
      expect(saveInitiativeAction).toHaveBeenCalledTimes(1);
      expect(saveUserStoryAction).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.getByDisplayValue("Epic Ready")).toBeDisabled();
      expect(screen.getByDisplayValue("Feat Ready")).toBeDisabled();
      expect(screen.getByDisplayValue("Story Ready")).toBeDisabled();
      expect(screen.getByDisplayValue("Feat Incomplete")).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Revenir \(3\)/i })).not.toBeDisabled();
    });
  });

  it("Revenir en brouillon archive le Spine et déverrouille la ligne", async () => {
    const user = userEvent.setup();
    seedSession([
      draft({
        id: "draft_f1",
        type: "feature",
        title: "Feat Reverse",
        parentId: "epic-spine-1",
        jtbdId: "jtbd-1",
        impact: 2,
        effort_days: 1,
        complexity: 1,
        spineId: "uuid-feat-live",
      }),
    ]);

    renderMatrix({
      spineEpics: [{ id: "epic-spine-1", title: "Epic Live" }],
    });

    expect(await screen.findByDisplayValue("Feat Reverse")).toBeDisabled();
    const reverseBtn = screen.getByRole("button", {
      name: /Revenir \(1\)/i,
    });
    await user.click(reverseBtn);
    await confirmReverseModal(user);

    await waitFor(() => {
      expect(assertDiscoveryReverseAllowedAction).toHaveBeenCalled();
      expect(archiveWorkItemAction).toHaveBeenCalledWith("uuid-feat-live", PROJECT_SLUG);
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Feat Reverse")).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /Créer au Spine \(0\)/i })).toBeDisabled();
      expect(
        screen.queryByRole("button", { name: /^Revenir/i })
      ).not.toBeInTheDocument();
    });

    await selectReadyForSpine(user);
    expect(screen.getByRole("button", { name: /Créer au Spine \(1\)/i })).not.toBeDisabled();
  });

  it("regroupe le sélecteur parent Feature par Epic (groupes custom)", async () => {
    const user = userEvent.setup();
    seedSession([
      draft({
        id: "draft_story",
        type: "story",
        title: "Story Parent Select",
        parentId: null,
        effort_days: 1,
        complexity: 1,
      }),
    ]);

    renderMatrix({
      spineEpics: [
        { id: "epic-a", title: "Epic Alpha" },
        { id: "epic-b", title: "Epic Beta" },
      ],
      spineFeatures: [
        { id: "feat-a1", title: "Feature A1", epic_id: "epic-a" },
        { id: "feat-b1", title: "Feature B1", epic_id: "epic-b" },
      ],
    });

    expect(await screen.findByDisplayValue("Story Parent Select")).toBeInTheDocument();

    const row = screen.getByDisplayValue("Story Parent Select").closest("tr");
    expect(row).toBeTruthy();
    const parentTrigger = within(row as HTMLElement).getByRole("button", {
      name: "Feature parente",
    });
    await user.click(parentTrigger);

    const listbox = await screen.findByRole("listbox", { name: "Feature parente" });
    const groupLabels = Array.from(listbox.querySelectorAll("[data-parent-group]")).map(
      (el) => el.getAttribute("data-parent-group") ?? ""
    );
    expect(groupLabels.length).toBeGreaterThanOrEqual(2);
    expect(groupLabels.some((l) => l.includes("Epic Alpha"))).toBe(true);
    expect(groupLabels.some((l) => l.includes("Epic Beta"))).toBe(true);
  });

  it("hydrate le Spine sandbox (Yao/Adja/Laura) pour les parents Feature", async () => {
    const user = userEvent.setup();
    const sandbox = sandboxToDiscoverySpineProps();
    seedSession([
      draft({
        id: "draft_story_sandbox",
        type: "story",
        title: "Story Sandbox Parent",
        parentId: null,
        effort_days: 1,
        complexity: 1,
      }),
    ]);

    renderMatrix();
    expect(await screen.findByDisplayValue("Story Sandbox Parent")).toBeInTheDocument();

    const row = screen.getByDisplayValue("Story Sandbox Parent").closest("tr");
    const parentTrigger = within(row as HTMLElement).getByRole("button", {
      name: "Feature parente",
    });
    await user.click(parentTrigger);

    const listbox = await screen.findByRole("listbox", { name: "Feature parente" });
    const labels = Array.from(listbox.querySelectorAll("[data-parent-group]")).map(
      (el) => el.getAttribute("data-parent-group") ?? ""
    );
    expect(labels.some((l) => l.includes("Capture & Financement PME"))).toBe(true);
    expect(sandbox.jtbdOptions).toHaveLength(3);
  });
});

describe("DiscoveryMatrix — hydratation sessionStorage (SSR-safe)", () => {
  it("n'inclut pas le cache session dans le HTML SSR (useState initial vide)", () => {
    seedSession([
      draft({
        id: "draft_ssr",
        type: "epic",
        title: "SECRET_SESSION_CACHE_TITLE",
      }),
    ]);

    const html = renderToString(
      <DiscoveryMatrix
        projectId={PROJECT_ID}
        projectSlug={PROJECT_SLUG}
        spineEpics={[]}
        spineFeatures={[]}
        jtbdOptions={[]}
        defaultAuthor="alice@sttns.app"
      />
    );

    expect(html).not.toContain("SECRET_SESSION_CACHE_TITLE");
  });

  it("charge sessionStorage uniquement après montage client", async () => {
    seedSession([
      draft({
        id: "draft_hydrate",
        type: "epic",
        title: "Hydrated After Mount",
      }),
    ]);

    renderMatrix();

    expect(await screen.findByDisplayValue("Hydrated After Mount")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Session$/i })).not.toBeDisabled();
    expect(screen.getByRole("button", { name: /^Sauvegarder$/i })).not.toBeDisabled();
  });
});

describe("DiscoveryDraftManager — export / import / dirty modal", () => {
  const baseMeta: DiscoveryDraftMetadata = {
    title: "Cadrage Q3",
    author: "Frederic",
    comments: "Notes atelier",
    createdAt: "2026-07-01T10:00:00.000Z",
    exportedAt: null,
  };

  function renderManager(
    props: Partial<{
      drafts: DiscoveryDraft[];
      metadata: DiscoveryDraftMetadata;
      defaultAuthor: string;
      hydrated: boolean;
      onReplaceSession: ReturnType<
        typeof vi.fn<
          (drafts: DiscoveryDraft[], metadata: DiscoveryDraftMetadata) => void
        >
      >;
      onMetadataChange: ReturnType<
        typeof vi.fn<(patch: Partial<DiscoveryDraftMetadata>) => void>
      >;
      onError: ReturnType<typeof vi.fn<(message: string | null) => void>>;
      onSuccess: ReturnType<typeof vi.fn<(message: string | null) => void>>;
    }> = {}
  ) {
    const onReplaceSession =
      props.onReplaceSession ??
      vi.fn<(drafts: DiscoveryDraft[], metadata: DiscoveryDraftMetadata) => void>();
    const onMetadataChange =
      props.onMetadataChange ??
      vi.fn<(patch: Partial<DiscoveryDraftMetadata>) => void>();
    const onError = props.onError ?? vi.fn<(message: string | null) => void>();
    const onSuccess = props.onSuccess ?? vi.fn<(message: string | null) => void>();

    render(
      <DiscoveryDraftManager
        projectId={PROJECT_ID}
        projectSlug={PROJECT_SLUG}
        drafts={props.drafts ?? []}
        metadata={props.metadata ?? emptyDraftMetadata(props.defaultAuthor ?? "")}
        defaultAuthor={props.defaultAuthor ?? ""}
        hydrated={props.hydrated ?? true}
        onMetadataChange={onMetadataChange}
        onReplaceSession={onReplaceSession}
        onError={onError}
        onSuccess={onSuccess}
      />
    );

    return { onReplaceSession, onMetadataChange, onError, onSuccess };
  }

  it("export génère un JSON schemaVersion 1 avec métadonnées et content", async () => {
    const user = userEvent.setup();
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock-url");
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => undefined);
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => undefined);

    const drafts = [
      draft({
        id: "draft_f1",
        type: "feature",
        title: "Ingestion",
        parentId: "epic-1",
        jtbdId: "jtbd-1",
        impact: 2,
        effort_days: 1,
        complexity: 1,
      }),
    ];
    const onMetadataChange = vi.fn();
    const onSuccess = vi.fn();

    renderManager({
      drafts,
      metadata: baseMeta,
      onMetadataChange,
      onSuccess,
    });

    await openSessionMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Exporter/i }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    const blob = createObjectURL.mock.calls[0][0] as Blob;
    const text = await blob.text();
    const parsed = JSON.parse(text) as Record<string, unknown>;

    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.projectId).toBe(PROJECT_ID);
    expect(parsed.projectSlug).toBe(PROJECT_SLUG);
    expect(parsed.metadata).toMatchObject({
      title: "Cadrage Q3",
      author: "Frederic",
      comments: "Notes atelier",
    });
    expect(Array.isArray(parsed.content)).toBe(true);
    expect((parsed.content as DiscoveryDraft[])[0].title).toBe("Ingestion");
    expect(onSuccess).toHaveBeenCalledWith(expect.stringMatching(/exporté/i));

    clickSpy.mockRestore();
    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
  });

  it("import d'un JSON valide restaure draftItems via onReplaceSession", async () => {
    const user = userEvent.setup();
    const filePayload = buildDiscoveryDraftFile({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
      metadata: {
        title: "Importé",
        author: "Bob",
        comments: "ok",
        createdAt: "2026-01-01T00:00:00.000Z",
        exportedAt: null,
      },
      drafts: [
        draft({ id: "draft_imported", type: "epic", title: "Epic Importé" }),
      ],
      now: "2026-07-20T12:00:00.000Z",
    });

    const { onReplaceSession, onError, onSuccess } = renderManager({
      drafts: [],
      metadata: emptyDraftMetadata("alice@sttns.app"),
      defaultAuthor: "alice@sttns.app",
    });

    const input = document.querySelector(
      'input[type="file"][accept*="json"]'
    ) as HTMLInputElement;
    const file = new File([serializeDiscoveryDraftFile(filePayload)], "draft.json", {
      type: "application/json",
    });
    await user.upload(input, file);

    await waitFor(() => {
      expect(onReplaceSession).toHaveBeenCalledTimes(1);
    });
    const [restoredDrafts, restoredMeta] = onReplaceSession.mock.calls[0] as [
      DiscoveryDraft[],
      DiscoveryDraftMetadata,
    ];
    expect(restoredDrafts).toHaveLength(1);
    expect(restoredDrafts[0].title).toBe("Epic Importé");
    expect(restoredMeta.title).toBe("Importé");
    expect(onSuccess).toHaveBeenCalledWith(expect.stringMatching(/Brouillon chargé/i));
    expect(
      onError.mock.calls.every((c: unknown[]) => c[0] == null)
    ).toBe(true);
  });

  it("rejette un JSON corrompu ou une version inconnue", async () => {
    const user = userEvent.setup();

    const { onReplaceSession, onError } = renderManager({
      drafts: [],
      metadata: emptyDraftMetadata(),
      defaultAuthor: "",
    });

    const input = document.querySelector(
      'input[type="file"][accept*="json"]'
    ) as HTMLInputElement;

    await user.upload(
      input,
      new File(["{not-json"], "bad.json", { type: "application/json" })
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(
        expect.stringMatching(/illisible|JSON/i)
      );
    });
    expect(onReplaceSession).not.toHaveBeenCalled();

    onError.mockClear();
    await user.upload(
      input,
      new File(
        [
          JSON.stringify({
            schemaVersion: 99,
            projectId: PROJECT_ID,
            projectSlug: PROJECT_SLUG,
            metadata: baseMeta,
            content: [],
          }),
        ],
        "v99.json",
        { type: "application/json" }
      )
    );
    await waitFor(() => {
      expect(onError).toHaveBeenCalledWith(expect.stringMatching(/schemaVersion|version/i));
    });
    expect(onReplaceSession).not.toHaveBeenCalled();
  });

  it("ouvre SttnsModal si import alors que la session est dirty (hors préremplissage auteur)", async () => {
    const user = userEvent.setup();
    const filePayload = buildDiscoveryDraftFile({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
      metadata: baseMeta,
      drafts: [draft({ id: "draft_x", type: "epic", title: "Remplacement" })],
    });

    const onReplaceSession = vi.fn<
      (drafts: DiscoveryDraft[], metadata: DiscoveryDraftMetadata) => void
    >();
    renderManager({
      drafts: [draft({ id: "draft_local", type: "epic", title: "Local Dirty" })],
      metadata: {
        ...emptyDraftMetadata("alice@sttns.app"),
        title: "Session locale",
      },
      defaultAuthor: "alice@sttns.app",
      onReplaceSession,
    });

    const input = document.querySelector(
      'input[type="file"][accept*="json"]'
    ) as HTMLInputElement;
    await user.upload(
      input,
      new File([serializeDiscoveryDraftFile(filePayload)], "in.json", {
        type: "application/json",
      })
    );

    expect(
      await screen.findByRole("heading", { name: /Remplacer la session en cours/i })
    ).toBeInTheDocument();
    expect(onReplaceSession).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: /Remplacer la session/i }));
    await waitFor(() => {
      expect(onReplaceSession).toHaveBeenCalledTimes(1);
    });
  });

  it("n'ouvre pas le modal dirty si seul l'auteur est prérempli (session vide)", async () => {
    const user = userEvent.setup();
    const filePayload = buildDiscoveryDraftFile({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
      metadata: baseMeta,
      drafts: [draft({ id: "draft_y", type: "epic", title: "Y" })],
    });

    const onReplaceSession = vi.fn<
      (drafts: DiscoveryDraft[], metadata: DiscoveryDraftMetadata) => void
    >();
    renderManager({
      drafts: [],
      metadata: emptyDraftMetadata("alice@sttns.app"),
      defaultAuthor: "alice@sttns.app",
      onReplaceSession,
    });

    const input = document.querySelector(
      'input[type="file"][accept*="json"]'
    ) as HTMLInputElement;
    await user.upload(
      input,
      new File([serializeDiscoveryDraftFile(filePayload)], "clean.json", {
        type: "application/json",
      })
    );

    await waitFor(() => {
      expect(onReplaceSession).toHaveBeenCalledTimes(1);
    });
    expect(
      screen.queryByRole("heading", { name: /Remplacer la session en cours/i })
    ).not.toBeInTheDocument();
  });

  it("désactive import/export tant que hydrated=false", async () => {
    const user = userEvent.setup();
    renderManager({ hydrated: false });
    expect(screen.getByRole("button", { name: /^Session$/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Sauvegarder$/i })).toBeDisabled();
    await expandDraftDetails(user);
    expect(screen.getByLabelText(/Choisir un brouillon partagé/i)).toBeDisabled();
  });

  it("liste les brouillons partagés dans le select et charge au choix", async () => {
    const user = userEvent.setup();
    const filePayload = buildDiscoveryDraftFile({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
      metadata: {
        title: "Atelier partagé",
        author: "Bob",
        comments: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        exportedAt: null,
      },
      drafts: [draft({ id: "draft_cloud", type: "epic", title: "Epic Cloud" })],
    });

    listMyDiscoveryDraftsAction.mockResolvedValue({
      ok: true,
      drafts: [
        {
          id: "cloud-a",
          title: "Atelier partagé",
          author: "Bob",
          comments: "",
          lineCount: 1,
          updatedAt: "2026-07-20T12:00:00.000Z",
          createdAt: "2026-07-01T10:00:00.000Z",
        },
      ],
    });
    loadMyDiscoveryDraftAction.mockResolvedValue({
      ok: true,
      file: filePayload,
      updatedAt: "2026-07-20T12:00:00.000Z",
    });

    const { onReplaceSession, onSuccess } = renderManager({
      drafts: [],
      metadata: emptyDraftMetadata("alice@sttns.app"),
      defaultAuthor: "alice@sttns.app",
    });

    await expandDraftDetails(user);
    const select = await screen.findByLabelText(/Choisir un brouillon partagé/i);
    await waitFor(() => {
      expect(select).not.toBeDisabled();
      expect(
        within(select as HTMLElement).getByRole("option", {
          name: /Atelier partagé/,
        })
      ).toBeInTheDocument();
    });

    await user.selectOptions(select, "cloud-a");

    await waitFor(() => {
      expect(loadMyDiscoveryDraftAction).toHaveBeenCalledWith(
        PROJECT_ID,
        PROJECT_SLUG,
        "cloud-a"
      );
      expect(onReplaceSession).toHaveBeenCalledTimes(1);
    });
    expect(onSuccess).toHaveBeenCalledWith(
      expect.stringMatching(/Brouillon partagé chargé/i)
    );
    expect(screen.getByRole("button", { name: /Mettre à jour/i })).toBeInTheDocument();
  });

  it("Créer à partir de détache cloudDraftId (Sauvegarder au lieu de Mettre à jour)", async () => {
    const user = userEvent.setup();
    const filePayload = buildDiscoveryDraftFile({
      projectId: PROJECT_ID,
      projectSlug: PROJECT_SLUG,
      metadata: {
        title: "Source",
        author: "Bob",
        comments: "",
        createdAt: "2026-01-01T00:00:00.000Z",
        exportedAt: null,
      },
      drafts: [draft({ id: "draft_cloud", type: "epic", title: "Epic Cloud" })],
    });

    listMyDiscoveryDraftsAction.mockResolvedValue({
      ok: true,
      drafts: [
        {
          id: "cloud-a",
          title: "Source",
          author: "Bob",
          comments: "",
          lineCount: 1,
          updatedAt: "2026-07-20T12:00:00.000Z",
          createdAt: "2026-07-01T10:00:00.000Z",
        },
      ],
    });
    loadMyDiscoveryDraftAction.mockResolvedValue({
      ok: true,
      file: filePayload,
      updatedAt: "2026-07-20T12:00:00.000Z",
    });

    function Harness() {
      const [drafts, setDrafts] = React.useState<DiscoveryDraft[]>([]);
      const [metadata, setMetadata] = React.useState<DiscoveryDraftMetadata>(
        emptyDraftMetadata()
      );
      return (
        <DiscoveryDraftManager
          projectId={PROJECT_ID}
          projectSlug={PROJECT_SLUG}
          drafts={drafts}
          metadata={metadata}
          hydrated
          onMetadataChange={(patch) => setMetadata((prev) => ({ ...prev, ...patch }))}
          onReplaceSession={(nextDrafts, nextMeta) => {
            setDrafts(nextDrafts);
            setMetadata(nextMeta);
          }}
          onError={() => undefined}
          onSuccess={() => undefined}
        />
      );
    }

    render(<Harness />);

    await expandDraftDetails(user);
    const select = await screen.findByLabelText(/Choisir un brouillon partagé/i);
    await waitFor(() => expect(select).not.toBeDisabled());
    await user.selectOptions(select, "cloud-a");
    await waitFor(() => {
      expect(screen.getByRole("button", { name: /Mettre à jour/i })).toBeInTheDocument();
      expect(screen.getByDisplayValue("Source")).toBeInTheDocument();
    });

    await openSessionMenu(user);
    await user.click(screen.getByRole("menuitem", { name: /Créer à partir de/i }));
    expect(
      await screen.findByRole("heading", { name: /Créer à partir de ce brouillon/i })
    ).toBeInTheDocument();

    const titleInput = screen.getByLabelText(/Titre du nouveau brouillon/i);
    expect(titleInput).toHaveValue("Copie de Source");
    await user.clear(titleInput);
    await user.type(titleInput, "Variante Q4");
    await user.click(screen.getByRole("button", { name: /Dupliquer la session/i }));

    await waitFor(() => {
      expect(screen.getByDisplayValue("Variante Q4")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^Sauvegarder$/i })).toBeInTheDocument();
    });
  });
});