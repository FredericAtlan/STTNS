"use client";

import { useState, useEffect } from "react";
import { LogOut, ChevronLeft, ChevronRight } from "lucide-react";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { cn } from "@/lib/utils";

interface SidebarProps {
  email: string | null;
  signOut: () => void;
  pathname: string;
  slug?: string;
  isProject: boolean;
}

export function Sidebar({
  email,
  signOut,
  pathname,
  slug,
  isProject,
}: SidebarProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const savedExpanded = localStorage.getItem("sttns_sidebar_expanded");
    if (savedExpanded !== null) {
      setIsExpanded(savedExpanded === "true");
    }
  }, []);

  useEffect(() => {
    function syncFromStorage(e: StorageEvent) {
      if (e.key !== "sttns_sidebar_expanded" || e.newValue == null) return;
      setIsExpanded(e.newValue === "true");
    }
    function syncFromCustom(e: Event) {
      const detail = (e as CustomEvent<{ expanded?: boolean }>).detail;
      if (typeof detail?.expanded === "boolean") {
        setIsExpanded(detail.expanded);
      }
    }
    window.addEventListener("storage", syncFromStorage);
    window.addEventListener("sttns:sidebar-expanded", syncFromCustom);
    return () => {
      window.removeEventListener("storage", syncFromStorage);
      window.removeEventListener("sttns:sidebar-expanded", syncFromCustom);
    };
  }, []);

  useEffect(() => {
    const width = isExpanded
      ? "var(--sttns-sidebar-w-expanded)"
      : "var(--sttns-sidebar-w-collapsed)";
    document.documentElement.style.setProperty("--sttns-sidebar-w", width);
  }, [isExpanded]);

  const toggleExpanded = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    localStorage.setItem("sttns_sidebar_expanded", String(newExpanded));
    window.dispatchEvent(
      new CustomEvent("sttns:sidebar-expanded", { detail: { expanded: newExpanded } })
    );
  };

  return (
    <aside
      className={cn(
        "fixed bottom-0 left-0 top-[var(--sttns-header-h)] z-40 hidden flex-col border-r border-border bg-card lg:flex transition-all duration-300 ease-in-out",
        isExpanded ? "w-[var(--sttns-sidebar-w-expanded)]" : "w-[var(--sttns-sidebar-w-collapsed)]"
      )}
    >
      <div className="border-b border-border px-2 py-2">
        <div className={cn("w-full flex items-center", isExpanded ? "justify-end" : "justify-center")}>
          <button
            type="button"
            onClick={toggleExpanded}
            className="sttns-btn-icon sttns-btn-ghost sttns-btn-md"
            title={isExpanded ? "Replier la barre latérale" : "Déplier la barre latérale"}
          >
            {isExpanded ? (
              <ChevronLeft className="h-5 w-5" strokeWidth={2.25} />
            ) : (
              <ChevronRight className="h-5 w-5" strokeWidth={2.25} />
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col min-h-0">
        <ProjectSidebar
          pathname={pathname}
          slug={slug}
          isProject={isProject}
          compact={!isExpanded}
        />
      </div>

      <div className="border-t border-border p-2 flex flex-col">
        {isExpanded ? (
          <div className="flex flex-col gap-1.5">
            <p className="truncate text-[10px] text-muted-foreground">{email}</p>
            <button
              type="button"
              onClick={signOut}
              className="sttns-btn-ghost sttns-btn-sm justify-start text-muted-foreground hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <button
              type="button"
              onClick={signOut}
              className="sttns-btn-icon sttns-btn-ghost sttns-btn-md hover:text-destructive"
              title="Déconnexion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
