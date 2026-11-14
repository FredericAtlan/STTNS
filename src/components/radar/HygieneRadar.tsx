"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { EffortBadge, ImpactBadge } from "@/components/ui/ValueEffortBadges";
import { SttnsModal } from "@/components/ui/SttnsModal";
import {
  AlertTriangle,
  Clock,
  Unlink,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  Link as LinkIcon,
  Loader2,
  Trash2,
  Skull,
  CheckCircle2,
  Sparkles,
  FileText,
  ChevronRight,
} from "lucide-react";
import { updateWorkItemStatusAction } from "@/app/projects/[slug]/kanban/actions";
import { archiveWithPostMortemAction } from "@/app/projects/[slug]/radar/actions";
import { StoryEditSlideOver, type StoryEditData } from "@/components/execution/StoryEditSlideOver";
import { ARCHIVE_REASONS, type ArchiveReason } from "@/lib/sttns/postMortem";
import type { StoryCycleOption, StoryFeatureOption } from "@/lib/sttns/storiesSpine";

// Types Spine stricts
type WorkItemStatus = "todo" | "in_progress" | "review" | "done";

interface OrphanFeature {
  id: string;
  title: string;
  epicTitle: string;
  createdAt: string;
}

interface StagnantStory {
  id: string;
  title: string;
  status: WorkItemStatus;
  daysInStatus: number;
  effortDays: number;
  featureTitle: string;
  epicTitle: string;
  lastUpdated: string;
}

/** Features Impact 0 (Gaspillage) — remplace l'ancien widget RICE. */
interface WasteFeature {
  id: string;
  title: string;
  epicTitle: string;
  impact: 0;
}

interface GhostJtbd {
  id: string;
  title: string;
  personaTitle: string;
  personaId: string;
}

interface UndocumentedTask {
  id: string;
  title: string;
  storyId: string;
  storyTitle: string;
  story: StoryEditData;
}

interface Props {
  projectSlug: string;
  projectId: string;
  orphans: OrphanFeature[];
  stagnants: StagnantStory[];
  wasteFeatures: WasteFeature[];
  ghostJtbds: GhostJtbd[];
  undocumentedTasks: UndocumentedTask[];
  features: StoryFeatureOption[];
  cycles: StoryCycleOption[];
  /** Seuil de stagnation configuré (Paramètres projet, 1–90 jours). */
  stagnationDays: number;
}

type HygieneTab = "strategy" | "product" | "execution";

const HYGIENE_TABS: { id: HygieneTab; label: string }[] = [
  { id: "strategy", label: "Stratégie" },
  { id: "product", label: "Produit" },
  { id: "execution", label: "Exécution" },
];

// Modale d'action rapide
function QuickActionModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <SttnsModal open={isOpen} onClose={onClose} title={title} size="md">
      {children}
    </SttnsModal>
  );
}

export function HygieneRadar({
  projectSlug,
  projectId,
  orphans,
  stagnants,
  wasteFeatures,
  ghostJtbds,
  undocumentedTasks,
  features,
  cycles,
  stagnationDays,
}: Props) {
  /**
   * Seuil critique = 2× stagnationDays (mais toujours strictement > stagnationDays).
   * Ex. stagnationDays=5 → warning [6..10], critical > 10.
   */
  const criticalStagnationDays = Math.max(stagnationDays * 2, stagnationDays + 1);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isCleanMode = searchParams.get("clean") === "true";

  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<HygieneTab>("strategy");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<"orphan" | "stagnant" | "kill" | null>(null);
  const [selectedItem, setSelectedItem] = useState<OrphanFeature | StagnantStory | WasteFeature | null>(null);
  const [editStory, setEditStory] = useState<StoryEditData | null>(null);

  // Post-Mortem form state
  const [killReason, setKillReason] = useState<ArchiveReason>("out_of_scope");
  const [killDetails, setKillDetails] = useState("");
  const [isKilling, setIsKilling] = useState(false);

  // Stats — seuils dérivés de stagnationDays (Paramètres projet)
  const criticalCount =
    orphans.length +
    stagnants.filter((s) => s.daysInStatus > criticalStagnationDays).length;
  const warningCount =
    stagnants.filter((s) => s.daysInStatus <= criticalStagnationDays).length +
    wasteFeatures.length +
    ghostJtbds.length;

  const tabAlertCounts: Record<HygieneTab, number> = {
    strategy: ghostJtbds.length + wasteFeatures.length,
    product: orphans.length,
    execution: stagnants.length + undocumentedTasks.length,
  };

  async function handleRelaunchStory(storyId: string, currentStatus: WorkItemStatus) {
    setLoadingId(storyId);

    // Relancer = repasser à todo pour re-triangularisation
    const result = await updateWorkItemStatusAction(storyId, projectSlug, "todo");

    setLoadingId(null);

    if (result.ok) {
      router.refresh();
      setModalOpen(false);
    } else {
      alert("Erreur: " + result.error);
    }
  }

  function openOrphanAction(orphan: OrphanFeature) {
    setSelectedItem(orphan);
    setModalType("orphan");
    setModalOpen(true);
  }

  function openStagnantAction(stagnant: StagnantStory) {
    setSelectedItem(stagnant);
    setModalType("stagnant");
    setModalOpen(true);
  }

  function openKillModal(item: OrphanFeature | WasteFeature) {
    setSelectedItem(item);
    setKillReason("out_of_scope");
    setKillDetails("");
    setModalType("kill");
    setModalOpen(true);
  }

  async function handleKillWithPostMortem() {
    if (!selectedItem) return;

    setIsKilling(true);

    const result = await archiveWithPostMortemAction({
      workItemId: selectedItem.id,
      projectId,
      projectSlug,
      reason: killReason,
      reasonDetails: killDetails.trim() || undefined,
      archivedBy: "System", // TODO: Get actual user ID from session
    });

    setIsKilling(false);

    if (result.ok) {
      router.refresh();
      setModalOpen(false);
    } else {
      alert("Erreur lors de l'archivage: " + result.error);
    }
  }

  if (isCleanMode) {
    const suggestions = [
      {
        id: "orphans",
        title: "Relier les Features orphelines",
        description: `${orphans.length} feature(s) ne sont reliées à aucun Job-To-Be-Done. Reliez-les pour prouver leur valeur.`,
        icon: Unlink,
        color: "text-amber-600 bg-amber-50 border-amber-200",
        actionLabel: "Relier dans Epics/Features",
        actionHref: `/projects/${projectSlug}/portfolio`,
        active: orphans.length > 0,
      },
      {
        id: "stagnants",
        title: "Débloquer les Stories stagnantes",
        description: `${stagnants.length} story/stories sont en cours ou en revue depuis trop longtemps. Relancez le travail ou clôturez-les.`,
        icon: Clock,
        color: "text-red-600 bg-red-50 border-red-200",
        actionLabel: "Exécution Kanban",
        actionHref: `/projects/${projectSlug}/kanban`,
        active: stagnants.length > 0,
      },
      {
        id: "wasteFeatures",
        title: "Revaloriser les Features Gaspillage",
        description: `${wasteFeatures.length} Feature(s) ont un Impact 0 — passage en cours bloqué. Revalorisez ou archivez.`,
        icon: TrendingDown,
        color: "text-zinc-600 bg-zinc-50 border-zinc-200",
        actionLabel: "Epics/Features",
        actionHref: `/projects/${projectSlug}/portfolio`,
        active: wasteFeatures.length > 0,
      },
      {
        id: "ghostJtbds",
        title: "Associer des Frictions aux JTBD",
        description: `${ghostJtbds.length} Job(s)-To-Be-Done n'ont aucun Pain Point associé. Vérifiez le besoin utilisateur.`,
        icon: Sparkles,
        color: "text-indigo-600 bg-indigo-50 border-indigo-200",
        actionLabel: "Voir la Matrice Besoins",
        actionHref: `/projects/${projectSlug}/why`,
        active: ghostJtbds.length > 0,
      },
    ].filter((s) => s.active);

    return (
      <div className="space-y-6 max-w-3xl mx-auto my-4">
        <div className="sttns-card border-primary/30 bg-primary/5 space-y-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-primary/10 rounded-full text-primary">
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-foreground">Suggestions de nettoyage (Next Best Action)</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Le Radar d&apos;hygiène a détecté des ruptures de traçabilité ou des anomalies d&apos;estimation. 
                Voici les actions correctives recommandées pour assainir votre Spine et réduire la charge mentale de votre équipe.
              </p>
            </div>
          </div>
        </div>

        {suggestions.length === 0 ? (
          <div className="rounded-lg border border-dashed border-emerald-200 bg-white p-10 text-center space-y-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
            <h3 className="text-sm font-semibold text-zinc-900">Spine parfaitement sain !</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto">
              Félicitations, aucune anomalie n&apos;est actuellement détectée. Votre stratégie et votre exécution sont parfaitement alignées.
            </p>
            <div className="pt-2">
              <Link
                href={`/projects/${projectSlug}/radar`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Voir le Radar complet
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
              Actions correctives recommandées ({suggestions.length})
            </h3>
            <div className="space-y-3">
              {suggestions.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className="sttns-card flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 hover:border-border transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg border shrink-0 ${s.color}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-sm font-semibold text-foreground">{s.title}</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">{s.description}</p>
                      </div>
                    </div>
                    <div className="shrink-0">
                      <Link
                        href={s.actionHref}
                        className="sttns-btn-secondary sttns-btn-sm"
                      >
                        {s.actionLabel}
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-4 border-t border-zinc-200 flex justify-end">
              <Link
                href={`/projects/${projectSlug}/radar`}
                className="text-xs font-semibold text-zinc-500 hover:text-zinc-800"
              >
                Accéder au Radar complet &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sttns-card border-destructive/30 bg-destructive/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <span className="text-sm font-medium text-destructive">Critique</span>
          </div>
          <p className="mt-2 font-bold text-destructive" style={{ fontSize: "var(--sttns-text-kpi)" }}>
            {criticalCount}
          </p>
          <p className="text-xs text-destructive/80">Orphelins + Stagnation &gt; {criticalStagnationDays}j</p>
        </div>

        <div className="sttns-card border-warning/30 bg-warning/5">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-warning" />
            <span className="text-sm font-medium text-warning">Attention</span>
          </div>
          <p className="mt-2 font-bold text-warning" style={{ fontSize: "var(--sttns-text-kpi)" }}>
            {warningCount}
          </p>
          <p className="text-xs text-warning/80">Stagnation + Impact Gaspillage</p>
        </div>

        <div className="sttns-card border-success/30 bg-success/5">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-success" />
            <span className="text-sm font-medium text-success">Surveillance</span>
          </div>
          <p className="mt-2 font-bold text-success" style={{ fontSize: "var(--sttns-text-kpi)" }}>
            {orphans.length + stagnants.length + wasteFeatures.length + ghostJtbds.length}
          </p>
          <p className="text-xs text-success/80">Total items sous surveillance</p>
        </div>
      </div>

      <nav
        className="flex flex-wrap gap-1.5 rounded-xl border border-border bg-card p-1.5 shadow-sm"
        aria-label="Perspectives du Radar d'hygiène"
      >
        {HYGIENE_TABS.map(({ id, label }) => {
          const active = activeTab === id;
          const count = tabAlertCounts[id];
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "sttns-btn-ghost"
              }`}
            >
              {label}
              <span
                className={`rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                  active ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </nav>

      {activeTab === "strategy" && (
        tabAlertCounts.strategy === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8">
            <div className="space-y-2 text-center text-sm text-zinc-500">
              <p>Tous les JTBD déclarent au moins un Pain Point résolu.</p>
              <p>Aucune Feature en Impact Gaspillage.</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Widget JTBD sans Pain Point */}
            <div className="sttns-card !p-0 overflow-hidden border-violet-200">
              <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/50 p-4">
                <div className="flex items-center gap-2">
                  <LinkIcon className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-foreground">JTBD sans Pain Point</h3>
                  <span className="rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {ghostJtbds.length}
                  </span>
                </div>
                <p className="text-xs text-violet-600">
                  Jobs sans lien « solves » vers un Pain Point du persona
                </p>
              </div>

              <div className="divide-y divide-zinc-100">
                {ghostJtbds.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    Tous les JTBD déclarent au moins un Pain Point résolu.
                  </div>
                ) : (
                  ghostJtbds.map((jtbd) => (
                    <div key={jtbd.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                      <div className="flex-1 min-w-0">
                        <h4 className="truncate font-medium text-zinc-900">{jtbd.title}</h4>
                        <p className="mt-1 text-xs text-zinc-500">Persona · {jtbd.personaTitle}</p>
                      </div>
                      <a
                        href={
                          jtbd.id
                            ? `/projects/${projectSlug}/why?jtbd=${jtbd.id}`
                            : `/projects/${projectSlug}/why?tab=jtbd&persona=${jtbd.personaId}`
                        }
                        className="ml-4 inline-flex items-center gap-1 rounded bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200"
                      >
                        <ArrowRight className="h-3 w-3" />
                        Lier des PP
                      </a>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Widget Impact Gaspillage */}
            <div className="sttns-card !p-0 overflow-hidden border-warning/40">
              <div className="flex items-center justify-between border-b border-warning/20 bg-warning/5 p-4">
                <div className="flex items-center gap-2">
                  <TrendingDown className="h-5 w-5 text-warning" />
                  <h3 className="font-semibold text-foreground">Impact Gaspillage</h3>
                  <span className="rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                    {wasteFeatures.length}
                  </span>
                </div>
                <p className="text-xs text-warning">Features Impact 0 (hard block in_progress)</p>
              </div>

              <div className="divide-y divide-zinc-100">
                {wasteFeatures.length === 0 ? (
                  <div className="p-4 text-center text-sm text-zinc-500">
                    Aucune Feature en Impact Gaspillage.
                  </div>
                ) : (
                  wasteFeatures.map((feature) => (
                    <div key={feature.id} className="flex items-center justify-between p-4 hover:bg-zinc-50">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <ImpactBadge impact={0} showLabel />
                          <h4 className="truncate font-medium text-foreground">{feature.title}</h4>
                        </div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Epic : {feature.epicTitle}
                        </div>
                      </div>
                      <div className="ml-4 flex items-center gap-2">
                        <a
                          href={`/projects/${projectSlug}/features/${feature.id}`}
                          className="inline-flex items-center gap-1 rounded bg-orange-100 px-3 py-1.5 text-xs font-medium text-orange-700 hover:bg-orange-200"
                        >
                          <ArrowRight className="h-3 w-3" />
                          Voir
                        </a>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )
      )}

      {activeTab === "product" && (
        tabAlertCounts.product === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8">
            <p className="text-sm text-zinc-500">Aucune feature orpheline. Constitution Spine respectée.</p>
          </div>
        ) : (
          /* Widget Orphelins */
          <div className="sttns-card !p-0 overflow-hidden border-destructive/40">
            <div className="flex items-center justify-between border-b border-destructive/20 bg-destructive/5 p-4">
              <div className="flex items-center gap-2">
                <Unlink className="h-5 w-5 text-destructive" />
                <h3 className="font-semibold text-foreground">Orphelins</h3>
                <span className="rounded-md bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                  {orphans.length}
                </span>
              </div>
              <p className="text-xs text-destructive">Features sans lien JTBD (Constitution violée)</p>
            </div>

            <div className="divide-y divide-zinc-100">
              {orphans.map((orphan) => (
                <div
                  key={orphan.id}
                  className="flex items-center justify-between p-4 hover:bg-zinc-50"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="truncate font-medium text-zinc-900">{orphan.title}</h4>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      Epic: {orphan.epicTitle} · Créé le{" "}
                      {new Date(orphan.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="ml-4 flex items-center gap-2">
                    <button
                      onClick={() => openOrphanAction(orphan)}
                      className="sttns-btn-secondary sttns-btn-sm"
                    >
                      <LinkIcon className="h-3 w-3" />
                      Assigner JTBD
                    </button>
                    <button
                      onClick={() => openKillModal(orphan)}
                      className="sttns-btn-destructive sttns-btn-sm"
                      title="Archiver avec Post-Mortem"
                    >
                      <Skull className="h-3 w-3" />
                      Tuer
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      )}

      {activeTab === "execution" && (
        tabAlertCounts.execution === 0 ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-lg border border-dashed border-zinc-200 bg-zinc-50 p-8">
            <p className="text-sm text-zinc-500">
              Aucune story stagnante ni tâche terminée sans documentation.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
          {/* Widget Stagnation */}
          {stagnants.length > 0 && (
          <div className="sttns-card !p-0 overflow-hidden border-warning/40">
            <div className="flex items-center justify-between border-b border-warning/20 bg-warning/5 p-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-warning" />
                <h3 className="font-semibold text-foreground">Stagnation</h3>
                <span className="rounded-md bg-warning/10 px-2 py-0.5 text-xs font-medium text-warning">
                  {stagnants.length}
                </span>
              </div>
              <p className="text-xs text-warning">Stories bloquées &gt; {stagnationDays} jours (Goulots d&apos;étranglement)</p>
            </div>

            <div className="divide-y divide-zinc-100">
              {stagnants.map((story) => (
                <div
                  key={story.id}
                  className={`flex items-center justify-between p-4 hover:bg-zinc-50 ${
                    story.daysInStatus > criticalStagnationDays ? "bg-red-50/30" : ""
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                          story.daysInStatus > criticalStagnationDays
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {story.daysInStatus}j
                      </span>
                      <EffortBadge days={story.effortDays} />
                      <h4 className="truncate font-medium text-foreground">{story.title}</h4>
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-1">
                      <span>{story.featureTitle} ← {story.epicTitle}</span>
                      <span>·</span>
                      <StatusBadge status={story.status} size="sm" />
                      <span>depuis {new Date(story.lastUpdated).toLocaleDateString("fr-FR")}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => openStagnantAction(story)}
                    disabled={loadingId === story.id}
                    className="sttns-btn-secondary sttns-btn-sm ml-4"
                  >
                    {loadingId === story.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3 w-3" />
                    )}
                    Relancer
                  </button>
                </div>
              ))}
            </div>
          </div>
          )}

          {undocumentedTasks.length > 0 && (
            <div className="sttns-card !p-0 overflow-hidden border-violet-200">
              <div className="flex items-center justify-between border-b border-violet-100 bg-violet-50/50 p-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-violet-600" />
                  <h3 className="font-semibold text-foreground">
                    Tâches terminées sans documentation
                  </h3>
                  <span className="rounded-md bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-700">
                    {undocumentedTasks.length}
                  </span>
                </div>
                <p className="text-xs text-violet-600">
                  Tâches au statut done sans lien Notion dans metadata
                </p>
              </div>

              <div className="divide-y divide-zinc-100">
                {undocumentedTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between gap-4 p-4 hover:bg-zinc-50"
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="truncate font-medium text-zinc-900">{task.title}</h4>
                      <p className="mt-1 text-xs text-zinc-500">
                        Story · {task.storyTitle}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setEditStory(task.story)}
                      className="shrink-0 inline-flex items-center gap-1 rounded bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-700 hover:bg-violet-200"
                    >
                      <FileText className="h-3 w-3" />
                      Ajouter la doc
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
        )
      )}

      <StoryEditSlideOver
        open={!!editStory}
        story={editStory}
        projectId={projectId}
        projectSlug={projectSlug}
        features={features}
        cycles={cycles}
        onClose={() => setEditStory(null)}
        onSaved={() => router.refresh()}
      />

      {/* Modale d'action rapide */}
      <QuickActionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={
          modalType === "orphan"
            ? "Assigner un JTBD"
            : modalType === "stagnant"
            ? "Relancer la Story"
            : modalType === "kill"
            ? "Post-Mortem Obligatoire"
            : "Action"
        }
      >
        {modalType === "orphan" && selectedItem && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              La Feature <strong>{(selectedItem as OrphanFeature).title}</strong> n&apos;a pas de
              contexte JTBD lié.
            </p>
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Constitution Spine :</strong> Une Feature doit obligatoirement être liée à un
              JTBD (Job-To-Be-Done) pour garantir la traçabilité valeur.
            </div>
            <div className="flex gap-2">
              <a
                href={`/projects/${projectSlug}/why?tab=jtbd`}
                className="flex-1 rounded bg-emerald-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-emerald-700"
              >
                Créer un JTBD
              </a>
              <a
                href={`/projects/${projectSlug}/features/${selectedItem.id}`}
                className="flex-1 rounded border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Modifier la Feature
              </a>
            </div>
          </div>
        )}

        {modalType === "stagnant" && selectedItem && (
          <div className="space-y-4">
            <div className="text-sm text-zinc-600 flex flex-wrap items-center gap-1">
              <span>La Story <strong>{(selectedItem as StagnantStory).title}</strong> est stagnante depuis</span>
              <strong>{(selectedItem as StagnantStory).daysInStatus} jours</strong>
              <span>en statut</span>
              <StatusBadge status={(selectedItem as StagnantStory).status} size="sm" />
            </div>
            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
              <strong>Action Relancer :</strong> Remet la story à &quot;todo&quot; pour
              re-triangularisation et re-priorisation.
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  handleRelaunchStory(
                    selectedItem.id,
                    (selectedItem as StagnantStory).status
                  )
                }
                disabled={loadingId === selectedItem.id}
                className="flex-1 rounded bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
              >
                {loadingId === selectedItem.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Relancement...
                  </span>
                ) : (
                  "Relancer (→ todo)"
                )}
              </button>
              <a
                href={`/projects/${projectSlug}/kanban`}
                className="flex-1 rounded border border-zinc-300 bg-white px-4 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Exécution Kanban
              </a>
            </div>
          </div>
        )}

        {/* Feedback Loop: Post-Mortem Modal */}
        {modalType === "kill" && selectedItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 rounded border border-red-200 bg-red-50 p-3">
              <Skull className="h-5 w-5 text-red-600" />
              <p className="text-sm font-medium text-red-800">
                Archiver : {(selectedItem as OrphanFeature | WasteFeature).title}
              </p>
            </div>

            <p className="text-sm text-zinc-600">
              Cette action archivera définitivement l&apos;item. Un Post-Mortem est obligatoire pour
              alimenter la boucle d&apos;apprentissage.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-zinc-700">
                  Raison d&apos;archivage *
                </label>
                <select
                  value={killReason}
                  onChange={(e) => setKillReason(e.target.value as ArchiveReason)}
                  className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
                >
                  {ARCHIVE_REASONS.map((reason) => (
                    <option key={reason.value} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
              </div>

              {killReason === "other" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Détails (obligatoire pour &quot;Autre&quot;)
                  </label>
                  <textarea
                    value={killDetails}
                    onChange={(e) => setKillDetails(e.target.value)}
                    className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Précisez la raison..."
                    required={killReason === "other"}
                  />
                </div>
              )}

              {killReason !== "other" && (
                <div>
                  <label className="block text-sm font-medium text-zinc-700">
                    Détails complémentaires (optionnel)
                  </label>
                  <textarea
                    value={killDetails}
                    onChange={(e) => setKillDetails(e.target.value)}
                    className="mt-1 block w-full rounded border border-zinc-300 px-3 py-2 text-sm min-h-[80px]"
                    placeholder="Contexte additionnel pour l'analyse..."
                  />
                </div>
              )}
            </div>

            <div className="rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
              <strong>Feedback Loop :</strong> Ces données seront persistées dans{" "}
              <code>metadata</code> et analysées dans{" "}
              <a href={`/projects/${projectSlug}/post-mortem`} className="underline">
                Post-Mortem Logs
              </a>
              .
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleKillWithPostMortem}
                disabled={
                  isKilling ||
                  (killReason === "other" && !killDetails.trim())
                }
                className="flex-1 rounded bg-zinc-800 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isKilling ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Archivage...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Trash2 className="h-4 w-4" />
                    Confirmer l&apos;archivage
                  </span>
                )}
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="flex-1 rounded border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </QuickActionModal>
    </div>
  );
}
