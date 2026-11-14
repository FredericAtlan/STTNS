/**
 * Intégrité Why P1b — santé inline, modal archivage, empty CTA unique.
 * @vitest-environment jsdom
 */
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import {
  coveredPainPointIdsFromJtbds,
  countGhostJtbds,
  countOrphanPainPoints,
  isGhostJtbd,
  isOrphanPainPoint,
} from "@/lib/sttns/whyHealth";
import { ContextMatrix } from "@/components/why/ContextMatrix";
import { PersonaForm } from "@/components/why/PersonaForm";
import { PersonaWorkspace } from "@/components/why/PersonaWorkspace";
import { sandboxToWhyMatrixProps } from "@/lib/sttns/spineWhySandbox";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
    replace: (...args: unknown[]) => replaceMock(...args),
  }),
}));

const archivePersonaAction = vi.fn();

vi.mock("@/app/projects/[slug]/why/actions", () => ({
  savePersonaAction: vi.fn(),
  archivePersonaAction: (...args: unknown[]) => archivePersonaAction(...args),
  uploadSpinePersonaPhotoAction: vi.fn(),
  removeSpinePersonaPhotoAction: vi.fn(),
}));

vi.mock("@/components/spine/WorkItemHistory", () => ({
  WorkItemHistory: () => null,
}));

vi.mock("@/components/personas/PersonaPhotoUpload", () => ({
  PersonaPhotoUpload: () => null,
}));

vi.mock("@/components/ui/SpineDocLinkField", () => ({
  SpineDocLinkField: () => null,
}));

vi.mock("@/components/personas/PersonaAvatar", () => ({
  PersonaAvatar: () => <span data-testid="persona-avatar" />,
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

const PERSONA = {
  id: "persona-1",
  title: "Comptable PME",
  code: "ACC",
  status: "todo",
};

const ORPHAN_PP = {
  id: "pp-orphan",
  title: "Liquidité bloquée",
  severity: "high" as const,
  persona_id: "persona-1",
};

const GHOST_JTBD = {
  id: "jtbd-ghost",
  title: "Quand [je paie], je veux [payer vite] afin de [conclure]",
  parent_id: "persona-1",
  status: "todo",
  solved_pain_point_ids: [] as string[],
};

const LINKED_JTBD = {
  id: "jtbd-ok",
  title: "Quand [A], je veux [B] afin de [C]",
  parent_id: "persona-1",
  status: "todo",
  solved_pain_point_ids: ["pp-covered"],
};

describe("why.integrity — logique indicateurs santé", () => {
  it("détecte un Pain Point orphelin (sans JTBD solves)", () => {
    const covered = coveredPainPointIdsFromJtbds([GHOST_JTBD]);
    expect(isOrphanPainPoint(ORPHAN_PP.id, covered)).toBe(true);
    expect(countOrphanPainPoints([ORPHAN_PP], [GHOST_JTBD])).toBe(1);
  });

  it("détecte un JTBD fantôme (sans PP lié)", () => {
    expect(isGhostJtbd(GHOST_JTBD)).toBe(true);
    expect(isGhostJtbd(LINKED_JTBD)).toBe(false);
    expect(countGhostJtbds([GHOST_JTBD, LINKED_JTBD])).toBe(1);
  });

  it("ContextMatrix rend le badge Orphelin pour un PP sans JTBD", () => {
    render(
      <ContextMatrix
        personas={[PERSONA]}
        jtbs={[]}
        painPoints={[ORPHAN_PP]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    const orphans = screen.getAllByTitle(
      /Pain Point sans JTBD qui le résout/i
    );
    expect(orphans.length).toBeGreaterThanOrEqual(1);
    expect(orphans.some((el) => el.textContent?.includes("Orphelin"))).toBe(
      true
    );
  });

  it("ContextMatrix affiche le statut Spine réel du persona (pas de mapping legacy READY)", () => {
    render(
      <ContextMatrix
        personas={[{ ...PERSONA, status: "in_progress" }]}
        jtbs={[]}
        painPoints={[]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    expect(screen.getByText("En cours")).toBeInTheDocument();
    expect(screen.queryByText("À faire")).not.toBeInTheDocument();
  });

  it("ContextMatrix rend le badge Fantôme pour un JTBD sans PP lié", () => {
    render(
      <ContextMatrix
        personas={[PERSONA]}
        jtbs={[GHOST_JTBD]}
        painPoints={[]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    const ghosts = screen.getAllByTitle(/JTBD sans Pain Point lié/i);
    expect(ghosts.length).toBeGreaterThanOrEqual(1);
    expect(ghosts.some((el) => el.textContent?.includes("Fantôme"))).toBe(
      true
    );
  });

  it("clic légende Orphelin/Fantôme ouvre le slide-over d'explication", async () => {
    const user = userEvent.setup();
    render(
      <ContextMatrix
        personas={[PERSONA]}
        jtbs={[GHOST_JTBD]}
        painPoints={[ORPHAN_PP]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    await user.click(
      screen.getByRole("button", { name: /Orphelin — expliquer/i })
    );

    expect(
      await screen.findByRole("heading", { name: /Orphelin & Fantôme/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sans aucun JTBD qui le résout/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/sans Pain Point lié/i)
    ).toBeInTheDocument();
  });
});

describe("why.integrity — modal d'archivage Persona", () => {
  beforeEach(() => {
    archivePersonaAction.mockReset();
    archivePersonaAction.mockResolvedValue({ ok: true });
  });

  it("n'appelle pas archivePersonaAction au clic Archiver (interception SttnsModal)", async () => {
    const user = userEvent.setup();
    render(
      <PersonaForm
        projectId="proj-1"
        projectSlug="demo"
        initialData={{
          id: "persona-1",
          name: "Comptable PME",
        }}
        showHeading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /^Archiver$/i }));

    expect(archivePersonaAction).not.toHaveBeenCalled();
    expect(
      screen.getByRole("dialog", { name: /Archiver ce Persona/i })
    ).toBeInTheDocument();
  });

  it("déclenche archivePersonaAction après confirmation dans SttnsModal", async () => {
    const user = userEvent.setup();
    render(
      <PersonaForm
        projectId="proj-1"
        projectSlug="demo"
        initialData={{
          id: "persona-1",
          name: "Comptable PME",
        }}
        showHeading={false}
      />
    );

    await user.click(screen.getByRole("button", { name: /^Archiver$/i }));
    const dialog = screen.getByRole("dialog", { name: /Archiver ce Persona/i });
    await user.click(
      within(dialog).getByRole("button", { name: /Archiver le Persona/i })
    );

    expect(archivePersonaAction).toHaveBeenCalledTimes(1);
    expect(archivePersonaAction).toHaveBeenCalledWith(
      "persona-1",
      "proj-1",
      "demo"
    );
  });
});

describe("why.integrity — empty states EmptyStateCoach", () => {
  it("affiche EmptyStateCoach Persona si la liste est vide", () => {
    render(
      <ContextMatrix
        personas={[]}
        jtbs={[]}
        painPoints={[]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    expect(screen.getByRole("heading", { name: /Aucun Persona/i })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Créer un Persona/i })
    ).toBeInTheDocument();
  });

  it("affiche EmptyStateCoach PP et JTBD dans les colonnes vides", () => {
    render(
      <ContextMatrix
        personas={[PERSONA]}
        jtbs={[]}
        painPoints={[]}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    expect(
      screen.getByRole("heading", { name: /Aucun Pain Point/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /Aucun JTBD/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ajouter un PP/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Ajouter un JTBD/i })
    ).toBeInTheDocument();
  });
});

describe("why.integrity — fermeture Slide-over → ContextMatrix", () => {
  beforeEach(() => {
    replaceMock.mockReset();
  });

  it("au close depuis deep-link ?tab=, remplace l'URL vers /why (matrice)", async () => {
    const user = userEvent.setup();
    render(
      <PersonaWorkspace
        projectId="proj-1"
        projectSlug="demo"
        personas={[PERSONA]}
        jtbs={[]}
        painPoints={[]}
        defaultTab="persona"
      />
    );

    expect(
      await screen.findByRole("heading", { name: /Nouveau Persona/i })
    ).toBeInTheDocument();

    await user.click(
      screen.getAllByRole("button", { name: /^Fermer$/i }).find((btn) =>
        btn.className.includes("sttns-btn-icon")
      )!
    );

    expect(replaceMock).toHaveBeenCalledWith("/projects/demo/why", {
      scroll: false,
    });
    expect(
      screen.queryByRole("heading", { name: /Nouveau Persona/i })
    ).not.toBeInTheDocument();
    // Titre page = ProjectPageHero (hors workspace) ; toolbar sans H1 dupliqué
    expect(
      screen.queryByRole("heading", { name: /Matrice Besoins/i })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Persona → Pain Point → JTBD/i)).toBeInTheDocument();
  });
});

describe("why.integrity — régression rendu PersonaForm vide", () => {
  it("n'expose qu'un seul CTA primary de création (pas de redondance)", () => {
    const { container } = render(
      <PersonaForm projectId="proj-1" projectSlug="demo" showHeading />
    );

    const primary = within(container).getAllByRole("button").filter((btn) =>
      btn.className.includes("sttns-btn-primary")
    );

    expect(primary).toHaveLength(1);
    expect(primary[0]).toHaveTextContent(/Créer le Persona/i);
    expect(
      within(container).queryByRole("button", { name: /^Archiver$/i })
    ).toBeNull();
  });
});

describe("why.integrity — sandbox Spine Why (Yao / Adja / Laura)", () => {
  it("ContextMatrix rend les 3 personas du bac à sable sans empty coach", () => {
    const props = sandboxToWhyMatrixProps();
    render(
      <ContextMatrix
        {...props}
        onEdit={vi.fn()}
        onCreatePersona={vi.fn()}
        onCreatePainPoint={vi.fn()}
        onCreateJtbd={vi.fn()}
      />
    );

    expect(screen.getByText("Yao Koffi")).toBeInTheDocument();
    expect(screen.getByText("Adja Cissé")).toBeInTheDocument();
    expect(screen.getByText("Laura Schneider")).toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Aucun Persona/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: /Aucun Pain Point/i })
    ).not.toBeInTheDocument();
  });

  it("PersonaWorkspace affiche le compteur sandbox (3 · 3 · 3)", () => {
    const props = sandboxToWhyMatrixProps();
    render(
      <PersonaWorkspace
        projectId="proj-sandbox"
        projectSlug="spine-why-sandbox"
        {...props}
      />
    );

    expect(screen.getByText(/3 personas · 3 PP · 3 JTBD/i)).toBeInTheDocument();
  });
});
