"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, ChevronDown, ChevronUp, RefreshCcw, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import {
  computeHealthCopilot,
  copilotHrefFor,
  copilotShouldSurface,
  type HealthCopilotIndicator,
  type HealthCopilotSeverity,
  type HealthCopilotSnapshot,
} from "@/lib/sttns/healthCopilot";
import type {
  AnomalyContextLinkRow,
  AnomalyWorkItemLinkRow,
  AnomalyWorkItemRow,
} from "@/lib/sttns/radarAnomalies";
import { cn } from "@/lib/utils";

type Props = {
  projectSlug: string;
};

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "ready"; snapshot: HealthCopilotSnapshot }
  | { status: "error"; message: string };

const DISMISS_KEY_PREFIX = "sttns:health-copilot:dismissed:";

/**
 * KF4 — Health Copilot temps réel.
 *
 * Barre sticky bas-droite affichée uniquement dans le contexte projet, hors
 * `/radar` (redondance). Compteurs déterministes basés sur `healthCopilot.ts`.
 * Chaque compteur est un deep-link vers la surface Spine concernée.
 */
export function HealthCopilotBar({ projectSlug }: Props) {
  const pathname = usePathname();
  const [state, setState] = useState<State>({ status: "idle" });
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const dismissKey = `${DISMISS_KEY_PREFIX}${projectSlug}`;

  useEffect(() => {
    if (typeof window === "undefined") return;
    setDismissed(window.sessionStorage.getItem(dismissKey) === "1");
  }, [dismissKey]);

  const load = useCallback(async () => {
    setState({ status: "loading" });
    const supabase = createClient();
    try {
      const { data: project, error: projectError } = await supabase
        .from("sttns_projects")
        .select("id, settings")
        .eq("slug", projectSlug)
        .single();
      if (projectError || !project) {
        setState({ status: "error", message: projectError?.message ?? "Projet introuvable." });
        return;
      }

      const workflow = parseProjectWorkflowSettings(project.settings);

      const { data: workItemRows, error: workItemsError } = await supabase
        .from("sttns_work_items")
        .select("id, title, type, status, parent_id, updated_at, metadata")
        .eq("project_id", project.id)
        .is("archived_at", null);
      if (workItemsError) {
        setState({ status: "error", message: workItemsError.message });
        return;
      }

      const workItems: AnomalyWorkItemRow[] = (workItemRows ?? []).map((r) => ({
        id: r.id,
        title: r.title,
        type: r.type as AnomalyWorkItemRow["type"],
        status: r.status,
        parent_id: r.parent_id,
        updated_at: r.updated_at,
        metadata: r.metadata,
      }));

      const featureIds = workItems.filter((r) => r.type === "feature").map((r) => r.id);
      const jtbdIds = workItems.filter((r) => r.type === "job").map((r) => r.id);

      const [contextLinksRes, workItemLinksRes] = await Promise.all([
        featureIds.length > 0
          ? supabase
              .from("sttns_context_links")
              .select("work_item_id, context_type, context_id")
              .in("work_item_id", featureIds)
              .eq("context_type", "job")
          : Promise.resolve({ data: [], error: null as null }),
        jtbdIds.length > 0
          ? supabase
              .from("sttns_work_item_links")
              .select("source_id, type")
              .in("source_id", jtbdIds)
              .eq("type", "solves")
          : Promise.resolve({ data: [], error: null as null }),
      ]);

      const contextLinks: AnomalyContextLinkRow[] = (contextLinksRes.data ?? []).map(
        (r: { work_item_id: string; context_type: string; context_id: string }) => ({
          work_item_id: r.work_item_id,
          context_type: r.context_type,
          context_id: r.context_id,
        })
      );
      const workItemLinks: AnomalyWorkItemLinkRow[] = (workItemLinksRes.data ?? []).map(
        (r: { source_id: string; type: string }) => ({
          source_id: r.source_id,
          type: r.type,
        })
      );

      const snapshot = computeHealthCopilot({
        workItems,
        contextLinks,
        workItemLinks,
        stagnationDays: workflow.stagnationDays,
        wipLimit: workflow.wipLimit,
      });
      setState({ status: "ready", snapshot });
    } catch (err) {
      setState({
        status: "error",
        message: err instanceof Error ? err.message : "Copilot indisponible.",
      });
    }
  }, [projectSlug]);

  useEffect(() => {
    void load();
  }, [load, pathname]);

  const isRadarPage = useMemo(() => pathname?.includes("/radar"), [pathname]);

  const dismiss = () => {
    setDismissed(true);
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(dismissKey, "1");
    }
  };

  const undismiss = () => {
    setDismissed(false);
    if (typeof window !== "undefined") {
      window.sessionStorage.removeItem(dismissKey);
    }
  };

  if (!projectSlug) return null;
  if (isRadarPage) return null;
  if (state.status !== "ready") return null;

  const surface = copilotShouldSurface(state.snapshot);
  if (!surface) return null;

  if (dismissed) {
    return (
      <div className="fixed bottom-4 right-4 z-40">
        <button
          type="button"
          onClick={undismiss}
          className="sttns-btn-ghost sttns-btn-sm shadow-elevated"
          aria-label="Rouvrir Health Copilot"
        >
          <Activity className="h-3.5 w-3.5" />
          Copilot
        </button>
      </div>
    );
  }

  return (
    <aside
      role="complementary"
      aria-label="Copilot santé Spine"
      className={cn(
        "fixed bottom-3 right-3 z-40 w-[min(100vw-1.5rem,22rem)] overflow-hidden rounded-xl border bg-card shadow-elevated",
        severityBorder(state.snapshot.worstSeverity)
      )}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <Activity className={cn("h-4 w-4", severityText(state.snapshot.worstSeverity))} aria-hidden />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Copilot santé Spine
            </p>
            <p className="truncate text-xs font-semibold text-foreground">
              {state.snapshot.total > 0
                ? `${state.snapshot.total} signal${state.snapshot.total > 1 ? "s" : ""} à traiter`
                : "WIP à surveiller"}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            aria-label={expanded ? "Réduire le Copilot" : "Développer le Copilot"}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => void load()}
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            aria-label="Recalculer les signaux"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-sm"
            aria-label="Masquer jusqu'à la prochaine session"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      <ul className="grid grid-cols-2 gap-1 p-2">
        {state.snapshot.indicators.map((indicator) => (
          <CopilotChip
            key={indicator.kind}
            indicator={indicator}
            projectSlug={projectSlug}
          />
        ))}
      </ul>

      {expanded && (
        <div className="border-t border-border bg-muted/40 p-3">
          <ul className="space-y-2 text-xs text-muted-foreground">
            {state.snapshot.indicators.map((indicator) => (
              <li key={`${indicator.kind}-detail`} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-foreground">
                    {indicator.longLabel}
                  </p>
                  <p className="truncate">
                    {indicator.count > 0
                      ? `${indicator.count} · ${severityLabel(indicator.severity)}`
                      : "Aucun signal"}
                  </p>
                </div>
                <Link
                  href={copilotHrefFor(indicator, projectSlug)}
                  className="sttns-btn-ghost sttns-btn-sm shrink-0"
                >
                  {indicator.ctaLabel}
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[10px] text-muted-foreground">
            Règles déterministes — pas d&apos;API LLM. Alimenté par la même source
            que le Radar d&apos;Hygiène.
          </p>
        </div>
      )}
    </aside>
  );
}

function CopilotChip({
  indicator,
  projectSlug,
}: {
  indicator: HealthCopilotIndicator;
  projectSlug: string;
}) {
  return (
    <Link
      href={copilotHrefFor(indicator, projectSlug)}
      className={cn(
        "group flex flex-col rounded-md border px-2.5 py-2 transition-colors",
        severityChip(indicator.severity)
      )}
      title={`${indicator.longLabel} — ${indicator.ctaLabel}`}
    >
      <span className="text-[10px] font-semibold uppercase tracking-wide">
        {indicator.label}
      </span>
      <span className="mt-0.5 flex items-baseline gap-1">
        <span className="text-lg font-bold tabular-nums leading-none">
          {indicator.count}
        </span>
      </span>
    </Link>
  );
}

function severityBorder(severity: HealthCopilotSeverity): string {
  switch (severity) {
    case "critical":
      return "border-destructive/40";
    case "warning":
      return "border-warning/40";
    case "info":
      return "border-info/30";
    case "ok":
    default:
      return "border-border";
  }
}

function severityText(severity: HealthCopilotSeverity): string {
  switch (severity) {
    case "critical":
      return "text-destructive";
    case "warning":
      return "text-warning";
    case "info":
      return "text-info";
    case "ok":
    default:
      return "text-muted-foreground";
  }
}

function severityChip(severity: HealthCopilotSeverity): string {
  switch (severity) {
    case "critical":
      return "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/15";
    case "warning":
      return "border-warning/30 bg-warning/10 text-warning hover:bg-warning/15";
    case "info":
      return "border-info/20 bg-info/10 text-info hover:bg-info/15";
    case "ok":
    default:
      return "border-border bg-muted text-muted-foreground hover:bg-muted/80";
  }
}

function severityLabel(severity: HealthCopilotSeverity): string {
  switch (severity) {
    case "critical":
      return "Critique";
    case "warning":
      return "À traiter";
    case "info":
      return "Info";
    case "ok":
    default:
      return "OK";
  }
}
