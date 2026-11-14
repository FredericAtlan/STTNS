"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import {
  AlertCircle,
  KanbanSquare,
  Keyboard,
  LayoutGrid,
  Loader2,
  Radar,
} from "lucide-react";
import { SttnsSlideOver } from "@/components/ui/SttnsSlideOver";
import { SpineObjectIcon } from "@/components/ui/SpineObjectIcon";
import { NAV_VOCAB } from "@/lib/sttns/iconVocabulary";
import { PainPointForm } from "@/components/why/PainPointForm";
import { JTBDForm } from "@/components/why/JTBDForm";
import { PersonaForm } from "@/components/why/PersonaForm";
import { EpicForm } from "@/components/epics/EpicForm";
import { FeatureForm } from "@/components/features/FeatureForm";
import { UserStoryForm } from "@/components/execution/UserStoryForm";
import { fetchCommandPaletteContext } from "@/lib/sttns/commandPaletteActions";
import type { CommandPaletteContext } from "@/lib/sttns/types";
import { cn } from "@/lib/utils";

type QuickActionId =
  | "persona"
  | "pain_point"
  | "jtbd"
  | "epic"
  | "feature"
  | "story";

const NAV_CHORDS: Record<string, string> = {
  why: "g w",
  discovery: "g d",
  portfolio: "g p",
  spine: "g s",
  cycles: "g c",
  mindmap: "g m",
  "user-stories": "g u",
  kanban: "g k",
  radar: "g r",
  settings: "g t",
};

const NAV_ITEMS = [
  { href: "why", label: "Matrice Besoins", keywords: "pourquoi persona jtbd pain point" },
  {
    href: "discovery",
    label: "Brouillons Epic→Feature→Story",
    keywords: "brouillons epic feat feature story tableau réunion cadrage créer spine",
  },
  {
    href: "portfolio",
    label: "Epics/Features — Inspecteur",
    keywords: "epic feature portfolio structure inspecteur valeur effort ratio",
  },
  { href: "spine", label: "Arbre de Traçabilité", keywords: "spine arbre inspecteur structure traçabilité" },
  { href: "cycles", label: "Cycles", keywords: "sprint iteration delivery cycle" },
  { href: "mindmap", label: "Mind Map", keywords: "arbre relations mind map canvas graph stratégie produit exécution" },
  { href: "user-stories", label: "Stories Backlogs", keywords: "story jours risque backlog effort" },
  { href: "kanban", label: "Exécution Kanban", keywords: "delivery sprint statut kanban exécution" },
  { href: "radar", label: "Radar d'Hygiène", keywords: "orphan stagnation hygiene impact gaspillage" },
  { href: "settings", label: "Paramètres du projet", keywords: "settings team équipe gouvernance" },
] as const;

const QUICK_ACTIONS: Array<{
  id: QuickActionId;
  label: string;
  keywords: string;
  spineType: "persona" | "pain_point" | "jtbd" | "epic" | "feature" | "story";
  /** Accord clavier associé (KF2). */
  chord: string;
}> = [
  {
    id: "persona",
    label: "Créer un Persona",
    keywords: "utilisateur segment portrait",
    spineType: "persona",
    chord: "n u",
  },
  {
    id: "pain_point",
    label: "Créer un Pain Point",
    keywords: "friction douleur persona",
    spineType: "pain_point",
    chord: "n p",
  },
  {
    id: "jtbd",
    label: "Créer un JTBD",
    keywords: "job to be done besoin",
    spineType: "jtbd",
    chord: "n j",
  },
  {
    id: "epic",
    label: "Créer un Epic",
    keywords: "vision rice stratégie",
    spineType: "epic",
    chord: "n e",
  },
  {
    id: "feature",
    label: "Créer une Feature",
    keywords: "initiative pont bridge",
    spineType: "feature",
    chord: "n f",
  },
  {
    id: "story",
    label: "Créer une Story",
    keywords: "user story fibonacci execution",
    spineType: "story",
    chord: "n s",
  },
];

interface Props {
  projectSlug: string;
}

export function CommandPalette({ projectSlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeModal, setActiveModal] = useState<QuickActionId | null>(null);
  const [context, setContext] = useState<CommandPaletteContext | null>(null);
  const [loadingContext, setLoadingContext] = useState(false);
  const [contextError, setContextError] = useState<string | null>(null);
  const openQuickActionRef = useRef<((id: QuickActionId) => Promise<void>) | null>(
    null
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    const onOpenRequest = () => setOpen(true);
    const onOpenQuickAction = (event: Event) => {
      const detail = (event as CustomEvent).detail as
        | { actionId?: QuickActionId }
        | undefined;
      const actionId = detail?.actionId;
      if (
        actionId === "persona" ||
        actionId === "pain_point" ||
        actionId === "jtbd" ||
        actionId === "epic" ||
        actionId === "feature" ||
        actionId === "story"
      ) {
        void openQuickActionRef.current?.(actionId);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("sttns:open-command-palette", onOpenRequest);
    window.addEventListener("sttns:open-quick-action", onOpenQuickAction);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("sttns:open-command-palette", onOpenRequest);
      window.removeEventListener("sttns:open-quick-action", onOpenQuickAction);
    };
  }, []);

  const loadContext = useCallback(async () => {
    setLoadingContext(true);
    setContextError(null);
    const result = await fetchCommandPaletteContext(projectSlug);
    setLoadingContext(false);
    if (!result.ok) {
      setContextError(result.error);
      return null;
    }
    setContext(result.data);
    return result.data;
  }, [projectSlug]);

  const openQuickAction = useCallback(
    async (actionId: QuickActionId) => {
      setOpen(false);
      setActiveModal(actionId);
      if (!context) {
        await loadContext();
      }
    },
    [context, loadContext]
  );

  useEffect(() => {
    openQuickActionRef.current = openQuickAction;
  }, [openQuickAction]);

  const closeModal = useCallback(() => {
    setActiveModal(null);
  }, []);

  const handleModalSuccess = useCallback(() => {
    setActiveModal(null);
  }, []);

  function navigateTo(path: string) {
    setOpen(false);
    router.push(path);
  }

  useEffect(() => {
    if (open && !context) {
      void loadContext();
    }
  }, [open, context, loadContext]);

  const visibleQuickActions = QUICK_ACTIONS.filter((action) => {
    if (context?.executionUnit === "feature" && action.id === "story") return false;
    if (context?.epicEqualsCycle && action.id === "epic") return false;
    return true;
  });

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (context?.executionUnit === "feature" && item.href === "user-stories") return false;
    return true;
  });

  const base = `/projects/${projectSlug}`;

  function renderModalContent() {
    if (loadingContext && !context) {
      return (
        <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement du contexte projet…
        </div>
      );
    }

    if (contextError && !context) {
      return (
        <div className="rounded border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {contextError}
        </div>
      );
    }

    if (!context) return null;

    switch (activeModal) {
      case "persona":
        return (
          <PersonaForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            showHeading={false}
            onSuccess={handleModalSuccess}
          />
        );
      case "pain_point":
        if (context.personas.length === 0) {
          return (
            <EmptyPrerequisite message="Créez d'abord un Persona dans la Matrice Besoins." />
          );
        }
        return (
          <PainPointForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            personas={context.personas}
            showHeading={false}
            onSuccess={handleModalSuccess}
          />
        );
      case "jtbd":
        if (context.personas.length === 0) {
          return (
            <EmptyPrerequisite message="Créez d'abord un Persona dans la Matrice Besoins." />
          );
        }
        return (
          <JTBDForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            personas={context.personas}
            painPoints={context.painPoints}
            showHeading={false}
            onSuccess={handleModalSuccess}
          />
        );
      case "epic":
        return (
          <EpicForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            onSuccess={handleModalSuccess}
          />
        );
      case "feature":
        if (context.jtbdOptions.length === 0) {
          return (
            <EmptyPrerequisite message="Créez d'abord un JTBD dans la Matrice Besoins." />
          );
        }
        if (context.epics.length === 0) {
          return (
            <EmptyPrerequisite message="Créez d'abord un Epic via Epics/Features ou cette palette." />
          );
        }
        return (
          <FeatureForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            epics={context.epics}
            jtbdOptions={context.jtbdOptions}
            cycleOptions={context.cycleOptions}
            featureExecutionMode={context.executionUnit === "feature"}
            epicEqualsCycle={context.epicEqualsCycle}
            onSuccess={handleModalSuccess}
          />
        );
      case "story":
        if (context.featureOptions.length === 0) {
          return (
            <EmptyPrerequisite message="Créez d'abord une Feature avant une Story." />
          );
        }
        return (
          <UserStoryForm
            projectId={context.projectId}
            projectSlug={projectSlug}
            features={context.featureOptions}
            cycles={context.cycleOptions}
            onSuccess={handleModalSuccess}
          />
        );
      default:
        return null;
    }
  }

  const modalMeta = QUICK_ACTIONS.find((a) => a.id === activeModal);

  return (
    <>
      <Command.Dialog
        open={open}
        onOpenChange={setOpen}
        label="Palette de commandes STTNS"
        overlayClassName="bg-slate-900/40 backdrop-blur-[2px]"
        contentClassName="fixed left-1/2 top-[12vh] z-[80] w-[min(100%-2rem,36rem)] -translate-x-1/2 overflow-hidden rounded-xl border border-zinc-200 bg-white p-0 shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-zinc-100 px-4">
          <span className="text-xs font-medium text-zinc-400">⌘K</span>
          <Command.Input
            placeholder="Rechercher une page ou une action…"
            className="h-12 w-full flex-1 bg-transparent text-sm outline-none placeholder:text-zinc-400"
          />
        </div>
        <Command.List className="max-h-[min(60vh,24rem)] overflow-y-auto p-2">
          <Command.Empty className="px-3 py-6 text-center text-sm text-zinc-500">
            Aucun résultat.
          </Command.Empty>

          <Command.Group
            heading="Actions rapides"
            className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-400"
          >
            {visibleQuickActions.map((action) => (
              <Command.Item
                key={action.id}
                value={`${action.label} ${action.keywords} ${action.chord}`}
                onSelect={() => void openQuickAction(action.id)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-800",
                  "aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                )}
              >
                <SpineObjectIcon type={action.spineType} />
                <span className="flex-1 truncate">{action.label}</span>
                <ChordHint value={action.chord} />
              </Command.Item>
            ))}
          </Command.Group>

          <Command.Group
            heading="Navigation"
            className="mt-1 [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-zinc-400"
          >
            {visibleNavItems.map((item) => (
              <Command.Item
                key={item.href}
                value={`${item.label} ${item.keywords}`}
                onSelect={() => navigateTo(`${base}/${item.href}`)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-800",
                  "aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
                )}
              >
                <NavIcon href={item.href} />
                <span className="flex-1 truncate">{item.label}</span>
                <ChordHint value={NAV_CHORDS[item.href] ?? ""} />
              </Command.Item>
            ))}
            <Command.Item
              key="keymap-help"
              value="raccourcis clavier keymap chord aide accord shortcuts"
              onSelect={() => {
                setOpen(false);
                window.dispatchEvent(new CustomEvent("sttns:open-chord-help"));
              }}
              className={cn(
                "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-800",
                "aria-selected:bg-emerald-50 aria-selected:text-emerald-900"
              )}
            >
              <KeyboardIcon />
              <span className="flex-1 truncate">Aide raccourcis clavier</span>
              <ChordHint value="?" />
            </Command.Item>
          </Command.Group>
        </Command.List>
      </Command.Dialog>

      <SttnsSlideOver
        open={activeModal !== null}
        onClose={closeModal}
        title={modalMeta ? modalMeta.label : "Création rapide"}
        eyebrow="Création rapide"
        size="lg"
      >
        {renderModalContent()}
      </SttnsSlideOver>
    </>
  );
}

function ChordHint({ value }: { value: string }) {
  return (
    <span
      className="hidden shrink-0 items-center gap-1 font-mono text-[10px] text-zinc-400 sm:inline-flex"
      aria-label={`Raccourci clavier ${value}`}
    >
      {value.split(" ").map((token, index) => (
        <kbd
          key={`${token}-${index}`}
          className="inline-flex h-4 min-w-4 items-center justify-center rounded border border-zinc-200 bg-white px-1 text-[10px] font-semibold uppercase text-zinc-500"
        >
          {token}
        </kbd>
      ))}
    </span>
  );
}

function KeyboardIcon() {
  return <Keyboard className="h-4 w-4 text-zinc-500" />;
}

function NavIcon({ href }: { href: string }) {
  switch (href) {
    case "why": {
      const Icon = NAV_VOCAB.needsMatrix.icon;
      return <Icon className="h-4 w-4 text-emerald-600" />;
    }
    case "portfolio": {
      const Icon = NAV_VOCAB.portfolioStrategic.icon;
      return <Icon className="h-4 w-4 text-violet-600" />;
    }
    case "kanban": {
      const Icon = NAV_VOCAB.kanbanBoard.icon;
      return <Icon className="h-4 w-4 text-sky-600" />;
    }
    case "user-stories":
      return <SpineObjectIcon type="story" />;
    case "cycles":
      return <SpineObjectIcon type="cycle" />;
    case "settings": {
      const Icon = NAV_VOCAB.projectSettings.icon;
      return <Icon className="h-4 w-4 text-zinc-600" />;
    }
    case "radar": {
      const Icon = NAV_VOCAB.hygieneRadar.icon;
      return <Icon className="h-4 w-4 text-red-600" />;
    }
    case "mindmap": {
      const Icon = NAV_VOCAB.mindMap.icon;
      return <Icon className="h-4 w-4 text-emerald-700" />;
    }
    case "discovery": {
      const Icon = NAV_VOCAB.discoveryMatrix.icon;
      return <Icon className="h-4 w-4 text-teal-700" />;
    }
    case "spine": {
      const Icon = NAV_VOCAB.spineTree.icon;
      return <Icon className="h-4 w-4 text-emerald-800" />;
    }
    default:
      return null;
  }
}

function EmptyPrerequisite({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-3 rounded border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <AlertCircle className="h-5 w-5 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
