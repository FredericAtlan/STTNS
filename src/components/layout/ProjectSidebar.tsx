"use client";

import { useState, useEffect } from "react";
import { SttnsPhaseDivider, SttnsSidebarLink } from "@/components/layout/sttns-ui";
import { projectNavLinkActive } from "@/lib/sttns/projectNav";
import { NAV_VOCAB, PHASE_VOCAB, iconSizeClass } from "@/lib/sttns/iconVocabulary";
import { createClient } from "@/lib/supabase/client";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { isFeatureExecutionMode } from "@/lib/sttns/projectExecutionMode";
import {
  computeRadarAnomalyCounts,
  type AnomalyContextLinkRow,
  type AnomalyWorkItemLinkRow,
  type AnomalyWorkItemRow,
} from "@/lib/sttns/radarAnomalies";

type NavItem = { href: string; vocabKey: keyof typeof NAV_VOCAB };

type NavSection = {
  id: keyof typeof PHASE_VOCAB;
  items: NavItem[];
};

function projectSections(slug: string, featureExecutionMode: boolean): NavSection[] {
  const base = `/projects/${slug}`;
  const deliveryItems: NavItem[] = featureExecutionMode
    ? [{ href: `${base}/kanban`, vocabKey: "kanbanBoard" }]
    : [
        { href: `${base}/user-stories`, vocabKey: "storyBacklog" },
        { href: `${base}/kanban`, vocabKey: "kanbanBoard" },
      ];

  return [
    {
      id: "productSpace",
      items: [
        { href: `${base}/why`, vocabKey: "needsMatrix" },
        { href: `${base}/discovery`, vocabKey: "discoveryMatrix" },
        { href: `${base}/portfolio`, vocabKey: "portfolioStrategic" },
        { href: `${base}/cycles`, vocabKey: "cyclesSprints" },
        { href: `${base}/spine`, vocabKey: "spineTree" },
        { href: `${base}/mindmap`, vocabKey: "mindMap" },
      ],
    },
    {
      id: "deliverySpace",
      items: deliveryItems,
    },
    {
      id: "controlCenter",
      items: [
        { href: `${base}/radar`, vocabKey: "hygieneRadar" },
        { href: `${base}/import-export`, vocabKey: "importExport" },
        { href: `${base}/settings`, vocabKey: "projectSettings" },
      ],
    },
    {
      id: "helpSpace",
      items: [{ href: `${base}/help`, vocabKey: "help" }],
    },
  ];
}

export function ProjectSidebar({
  pathname,
  slug,
  isProject,
  onNavigate,
  compact = false,
}: {
  pathname: string;
  slug?: string;
  isProject: boolean;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const [hasAnomalies, setHasAnomalies] = useState(false);
  const [featureExecutionMode, setFeatureExecutionMode] = useState(false);
  const sections = slug && isProject ? projectSections(slug, featureExecutionMode) : [];

  useEffect(() => {
    if (!slug) return;
    const supabase = createClient();
    
    async function checkAnomalies() {
      try {
        const { data: project } = await supabase
          .from("sttns_projects")
          .select("id, settings")
          .eq("slug", slug)
          .single();

        if (!project) return;

        const workflow = parseProjectWorkflowSettings(project.settings);
        setFeatureExecutionMode(isFeatureExecutionMode(workflow));

        const projectId = project.id;

        const { data: workItemRows } = await supabase
          .from("sttns_work_items")
          .select("id, title, type, status, parent_id, updated_at, metadata")
          .eq("project_id", projectId)
          .is("archived_at", null);

        const workItems: AnomalyWorkItemRow[] = (workItemRows ?? []).map((r) => ({
          id: r.id,
          title: r.title,
          type: r.type as AnomalyWorkItemRow["type"],
          status: r.status,
          parent_id: r.parent_id,
          updated_at: r.updated_at,
          metadata: r.metadata,
        }));

        const featureIds = workItems
          .filter((r) => r.type === "feature")
          .map((r) => r.id);

        const { data: contextLinkRows } =
          featureIds.length > 0
            ? await supabase
                .from("sttns_context_links")
                .select("work_item_id, context_type, context_id")
                .in("work_item_id", featureIds)
                .eq("context_type", "job")
            : { data: [] };

        const contextLinks: AnomalyContextLinkRow[] = (contextLinkRows ?? []).map(
          (r) => ({
            work_item_id: r.work_item_id,
            context_type: r.context_type,
            context_id: r.context_id,
          })
        );

        const jtbdIds = workItems
          .filter((r) => r.type === "job")
          .map((r) => r.id);

        const { data: solveRows } =
          jtbdIds.length > 0
            ? await supabase
                .from("sttns_work_item_links")
                .select("source_id, type")
                .in("source_id", jtbdIds)
                .eq("type", "solves")
            : { data: [] };

        const workItemLinks: AnomalyWorkItemLinkRow[] = (solveRows ?? []).map(
          (r) => ({ source_id: r.source_id, type: r.type })
        );

        const counts = computeRadarAnomalyCounts({
          workItems,
          contextLinks,
          workItemLinks,
          stagnationDays: workflow.stagnationDays,
        });

        setHasAnomalies(counts.total > 0);
      } catch (err) {
        console.error("Error checking anomalies:", err);
      }
    }
    
    checkAnomalies();
  }, [slug]);

  function renderItem(item: NavItem) {
    const vocab = NAV_VOCAB[item.vocabKey];
    const Icon = vocab.icon;
    const href = item.vocabKey === "hygieneRadar" && hasAnomalies
      ? `${item.href}?clean=true`
      : item.href;

    return (
      <SttnsSidebarLink
        key={item.href}
        href={href}
        label={vocab.label}
        icon={
          <div className="relative">
            <Icon className={iconSizeClass("md")} />
            {item.vocabKey === "hygieneRadar" && hasAnomalies && (
              <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5 rounded-full bg-red-500 ring-1 ring-white animate-pulse" />
            )}
          </div>
        }
        active={slug ? projectNavLinkActive(pathname, item.href, slug) : false}
        onClick={onNavigate}
        compact={compact}
      />
    );
  }

  return (
    <nav className="flex-1 space-y-0.5 overflow-y-auto p-1.5">
      {sections.map((section) => {
        const phase = PHASE_VOCAB[section.id];
        const PhaseIcon = phase.icon;
        const showDivider = section.id === "helpSpace";

        return (
          <div key={section.id} className="space-y-1">
            {showDivider && (
              <SttnsPhaseDivider
                icon={<PhaseIcon className={iconSizeClass("md")} />}
                label={phase.label}
                compact={compact}
              />
            )}
            {section.items.map(renderItem)}
          </div>
        );
      })}
    </nav>
  );
}
