"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, LayoutDashboard, Trash2 } from "lucide-react";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import type { SttnsProject } from "@/types/sttns";
import type { ProjectSquadMemberPreview } from "@/lib/sttns/projectMembers";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { deleteProjectAction } from "@/app/projects/actions";
import { ProjectSquadStrip } from "@/components/project/ProjectSquadStrip";
import { projectHomePath } from "@/lib/sttns/paths";
import { useRouter } from "next/navigation";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";
import { getSimplifiedModeVariant } from "@/lib/sttns/projectExecutionMode";
import { ShapeUpModeBadge } from "@/components/settings/ShapeUpModeBadge";

function projectSimplifiedMode(project: SttnsProject) {
  return getSimplifiedModeVariant(parseProjectWorkflowSettings(project.settings));
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-3 py-1 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
      {children}
    </p>
  );
}

export function ProjectSwitcher({
  projects,
  archivedProjects = [],
  currentSlug,
  compact = false,
  variant = "default",
  squadPreviewsByProjectId = {},
}: {
  projects: SttnsProject[];
  archivedProjects?: SttnsProject[];
  currentSlug?: string;
  compact?: boolean;
  /** `header` : bouton compact pour la barre d'en-tête globale. */
  variant?: "default" | "header";
  squadPreviewsByProjectId?: Record<string, ProjectSquadMemberPreview[]>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const isAllProjects = pathname === "/";
  const current = [...projects, ...archivedProjects].find((p) => p.slug === currentSlug);
  const currentSimplifiedMode = current ? projectSimplifiedMode(current) : null;

  async function handleDelete(e: React.MouseEvent, projectId: string, projectName: string) {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm(`Supprimer définitivement le projet "${projectName}" ? Cette action est irréversible.`)) {
      return;
    }

    setIsDeleting(projectId);
    const res = await deleteProjectAction(projectId);
    setIsDeleting(null);

    if (!res.ok) {
      alert(`Erreur lors de la suppression : ${res.error}`);
    } else {
      setOpen(false);
      router.push("/");
      router.refresh();
    }
  }

  function projectHref(slug: string) {
    if (currentSlug && pathname.includes(`/projects/${currentSlug}`)) {
      return pathname.replace(`/projects/${currentSlug}`, `/projects/${slug}`);
    }
    return projectHomePath(slug);
  }

  const buttonLabel = isAllProjects
    ? "Tous les projets"
    : (current?.name ?? projects[0]?.name ?? "Projet");

  const initials = isAllProjects
    ? "∗"
    : (current?.name?.slice(0, 1).toUpperCase() ?? "P");

  const squadStrip =
    !isAllProjects && current?.id ? (
      <ProjectSquadStrip
        projectId={current.id}
        members={squadPreviewsByProjectId[current.id]}
        compact={variant === "header"}
        className="shrink-0"
      />
    ) : null;

  function renderMenu(className: string) {
    return (
      <ul className={className}>
        <li>
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-emerald-50",
              isAllProjects && "bg-emerald-50 font-bold text-sttns-accent"
            )}
          >
            <LayoutDashboard className="h-3.5 w-3.5 shrink-0" />
            Tous les projets
          </Link>
        </li>

        {projects.length > 0 && (
          <li className="border-t border-slate-100">
            <SectionLabel>Projets</SectionLabel>
          </li>
        )}
        {projects.map((p) => {
          const mode = projectSimplifiedMode(p);
          return (
            <li key={p.id}>
              <Link
                href={projectHref(p.slug)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center justify-between gap-2 px-3 py-1.5 text-xs hover:bg-emerald-50",
                  !isAllProjects &&
                    p.slug === currentSlug &&
                    "bg-emerald-50 font-bold text-sttns-accent"
                )}
              >
                <span className="min-w-0 truncate">{p.name}</span>
                {mode && <ShapeUpModeBadge variant={mode} compact />}
              </Link>
            </li>
          );
        })}

        <li className="border-t border-slate-100">
          <Link
            href="/projects/new"
            onClick={() => setOpen(false)}
            className="block px-3 py-1.5 text-xs font-semibold text-sttns-accent hover:bg-emerald-50"
          >
            + Nouveau projet
          </Link>
        </li>

        {archivedProjects.length > 0 && (
          <li className="border-t border-slate-100">
            <SectionLabel>Projets archivés</SectionLabel>
          </li>
        )}
        {archivedProjects.map((p) => {
          const mode = projectSimplifiedMode(p);
          return (
            <li key={p.id} className="group/item flex items-center justify-between hover:bg-emerald-50">
              <Link
                href={projectHref(p.slug)}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex min-w-0 flex-1 items-center justify-between gap-2 px-3 py-1.5 text-xs text-zinc-500",
                  !isAllProjects &&
                    p.slug === currentSlug &&
                    "bg-emerald-50 font-semibold text-sttns-accent"
                )}
              >
                <span className="min-w-0 truncate">{p.name}</span>
                {mode && <ShapeUpModeBadge variant={mode} compact />}
              </Link>
            <button
              type="button"
              disabled={isDeleting === p.id}
              onClick={(e) => handleDelete(e, p.id, p.name)}
              className="mr-2 hidden p-1 text-zinc-400 hover:text-red-600 group-hover/item:block"
              title="Supprimer définitivement"
            >
              <Trash2 className={cn("h-3 w-3", isDeleting === p.id && "animate-pulse")} />
            </button>
            </li>
          );
        })}
      </ul>
    );
  }

  if (compact) {
    return (
      <div className="relative flex justify-center">
        <SttnsIconTip label={buttonLabel} placement="right">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-label={buttonLabel}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-zinc-200 bg-zinc-50 text-sm font-bold text-emerald-800 transition-colors hover:border-zinc-300 hover:bg-white"
          >
            {isAllProjects ? <LayoutDashboard className="h-4 w-4" /> : initials}
          </button>
        </SttnsIconTip>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            {renderMenu(
              "absolute left-full top-0 z-20 ml-2 max-h-72 w-56 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
            )}
          </>
        )}
      </div>
    );
  }

  const menuZ = variant === "header" ? "z-[60]" : "z-20";
  const overlayZ = variant === "header" ? "z-[55]" : "z-10";

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        variant === "header" && "max-w-[min(100%,36rem)]"
      )}
    >
      <div className="relative min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className={cn(
            "flex w-full min-w-0 items-center gap-2 rounded-lg border border-zinc-200 text-left text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300",
            variant === "header"
              ? "min-w-[120px] bg-white px-2.5 py-1.5 shadow-sm"
              : "bg-zinc-50 px-2.5 py-2 hover:bg-white"
          )}
        >
          <span className="min-w-0 flex-1 truncate">{buttonLabel}</span>
          <ChevronDown className={cn("h-3.5 w-3.5 shrink-0 transition", open && "rotate-180")} />
        </button>
        {open && (
          <>
            <div className={cn("fixed inset-0", overlayZ)} onClick={() => setOpen(false)} />
            {renderMenu(
              cn(
                "absolute left-0 mt-1 max-h-72 overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg",
                variant === "header" ? "w-56" : "right-0 left-auto min-w-[14rem]",
                menuZ
              )
            )}
          </>
        )}
      </div>
      {currentSimplifiedMode && !isAllProjects && (
        <ShapeUpModeBadge variant={currentSimplifiedMode} compact className="hidden sm:inline-flex" />
      )}
      {squadStrip}
    </div>
  );
}
