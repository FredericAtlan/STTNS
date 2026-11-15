"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, Menu, Shield, X, Star, User, Settings } from "lucide-react";
import { TaskBell } from "@/components/layout/TaskBell";
import { SttnsLogo } from "@/components/brand/SttnsLogo";
import { ProjectSidebar } from "@/components/layout/ProjectSidebar";
import { ProjectSwitcher } from "@/components/project/ProjectSwitcher";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";
import { STTNS_BRAINSTORMING_ENABLED } from "@/lib/sttns/productFlags";
import { STTNS_APP_VERSION_LABEL } from "@/lib/sttns/productVersion";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useMemo, useState } from "react";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { CommandChordProvider } from "@/components/ui/CommandChordProvider";
import { HealthCopilotBar } from "@/components/copilot/HealthCopilotBar";
import { Sidebar } from "@/components/layout/Sidebar";
import { memberInitialsFromNames } from "@/lib/sttns/memberDisplay";
import type { SttnsProfile, SttnsProject } from "@/types/sttns";
import type { ProjectSquadMemberPreview } from "@/lib/sttns/projectMembers";

const RESERVED_PROJECT_SEGMENTS = new Set(["new"]);

export function AppShell({
  children,
  projects = [],
  archivedProjects = [],
  openTaskCount = 0,
  isPlatformAdmin = false,
  userProfile,
  projectRoles,
  squadPreviewsByProjectId = {},
}: {
  children: React.ReactNode;
  projects?: SttnsProject[];
  archivedProjects?: SttnsProject[];
  currentProjectSlug?: string;
  openTaskCount?: number;
  isPlatformAdmin?: boolean;
  userProfile?: SttnsProfile | null;
  projectRoles?: Map<string, string>;
  projectValidationModes?: Map<string, SttnsProject["validation_mode"]>;
  squadPreviewsByProjectId?: Record<string, ProjectSquadMemberPreview[]>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const isAuthPage = pathname.startsWith("/login") || pathname.startsWith("/auth");

  const slugMatch = pathname.match(/^\/projects\/([^/]+)/);
  const rawSlug = slugMatch?.[1];
  const slug = rawSlug && !RESERVED_PROJECT_SEGMENTS.has(rawSlug) ? rawSlug : undefined;
  const isProject = !!slug;
  const projectSlugs = useMemo(() => new Set(projects.map((p) => p.slug)), [projects]);

  const userDisplayName = useMemo(() => {
    return userProfile?.full_name || userProfile?.email?.split("@")[0] || email?.split("@")[0] || "User";
  }, [userProfile, email]);

  const accountEmail = userProfile?.email ?? email ?? "account@sttns.app";
  const accountInitials = useMemo(
    () => memberInitialsFromNames(userProfile?.full_name ?? null, accountEmail),
    [userProfile?.full_name, accountEmail]
  );
  const accountAvatarUrl = userProfile?.avatar_url?.trim() || null;

  useEffect(() => {
    createClient().auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
    });
  }, [pathname]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  /** Nettoie les anciens pièges Mode Zen (localStorage + attributs body). */
  useEffect(() => {
    try {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key?.startsWith("sttns:zen:")) keys.push(key);
      }
      for (const key of keys) window.localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
    document.body.style.overflow = "";
    document.body.removeAttribute("data-sttns-zen");
  }, []);

  async function signOut() {
    await createClient().auth.signOut();
    router.push("/login?local=off"); // en local, ne pas rouvrir aussitôt une session
    router.refresh();
  }

  if (isAuthPage) return <>{children}</>;

  const switcherSlug = slug ?? (projectSlugs.has(rawSlug ?? "") ? rawSlug : undefined);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-card/90 backdrop-blur">
        <div className="flex h-[var(--sttns-header-h)] items-center justify-between gap-2 px-3 sm:px-4 lg:px-5">
          <div className="flex min-w-0 flex-1 items-center gap-2 sm:gap-3">
            <button
              type="button"
              className="sttns-btn-icon sttns-btn-md lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" strokeWidth={2.25} />
            </button>

            <Link
              href="/"
              className="flex shrink-0 items-center gap-2.5 transition hover:opacity-90"
            >
              <SttnsLogo size={32} />
              <div className="hidden items-center gap-2 sm:flex">
                <span className="font-semibold tracking-tight text-foreground sm:text-sm md:text-base">
                  Straight to the North Star
                </span>
                <span className="hidden text-[10px] font-mono font-medium tracking-wide text-muted-foreground rounded-md border border-border bg-muted px-1.5 py-0.5 sm:inline-block">
                  {STTNS_APP_VERSION_LABEL}
                </span>
              </div>
            </Link>

            <span className="hidden text-border sm:inline">|</span>

            {(projects.length > 0 || archivedProjects.length > 0) && (
              <div className="hidden min-w-0 sm:block">
                <ProjectSwitcher
                  projects={projects}
                  archivedProjects={archivedProjects}
                  currentSlug={switcherSlug}
                  variant="header"
                  squadPreviewsByProjectId={squadPreviewsByProjectId}
                />
              </div>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {isProject && slug && (
              <button
                type="button"
                onClick={() => window.dispatchEvent(new CustomEvent("sttns:open-command-palette"))}
                className="sttns-btn-ghost sttns-btn-sm hidden sm:inline-flex"
                aria-label="Ouvrir la palette de commandes (Cmd+K ou Ctrl+K)"
              >
                <span className="hidden md:inline">Palette</span>
                <span>⌘K</span>
              </button>
            )}
            <TaskBell count={openTaskCount} />
            {isPlatformAdmin && (
              <SttnsIconTip label="Administration plateforme" placement="bottom">
                <Link
                  href="/admin"
                  className={cn(
                    "sttns-btn-icon",
                    pathname.startsWith("/admin") && "border-primary/40 bg-primary/10 text-primary"
                  )}
                  aria-label="Admin"
                >
                  <Shield className="h-4 w-4" />
                </Link>
              </SttnsIconTip>
            )}
            <details className="relative">
              <summary className="flex list-none cursor-pointer items-center gap-2 rounded-full border border-border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-sm transition-colors hover:border-border hover:bg-muted">
                <span className="flex h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                  {accountAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={accountAvatarUrl}
                      alt={userDisplayName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    accountInitials
                  )}
                </span>
                <span className="hidden max-w-[140px] truncate sm:block">{userDisplayName}</span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-border bg-card shadow-elevated">
                <div className="border-b border-border px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {accountAvatarUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={accountAvatarUrl}
                          alt={userDisplayName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        accountInitials
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-foreground">{userDisplayName}</p>
                      <p className="truncate text-xs text-muted-foreground">{accountEmail}</p>
                    </div>
                  </div>
                </div>
                <div className="p-2">
                  <Link
                    href="/settings/profile"
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                  >
                    <User className="h-4 w-4 text-muted-foreground" />
                    Profil
                  </Link>
                  {isPlatformAdmin && (
                    <Link
                      href="/admin"
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-muted"
                    >
                      <Settings className="h-4 w-4 text-muted-foreground" />
                      Console Admin
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={signOut}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-destructive hover:bg-destructive/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Se déconnecter
                  </button>
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <Sidebar
        email={email}
        signOut={signOut}
        pathname={pathname}
        slug={slug}
        isProject={isProject}
      />

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-zinc-950/40"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-[min(100%,20rem)] flex-col border-r border-border bg-card shadow-elevated">
            <div className="flex items-center justify-between border-b border-border px-4 py-4">
              <Link href="/" className="flex items-center gap-2.5" onClick={() => setMobileOpen(false)}>
                <SttnsLogo size={32} />
                <span className="text-sm font-semibold text-foreground">Straight to the North Star</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close"
                className="sttns-btn-icon sttns-btn-ghost sttns-btn-md"
              >
                <X className="h-5 w-5" strokeWidth={2.25} />
              </button>
            </div>
            <div className="border-b border-border px-4 py-3">
              {(projects.length > 0 || archivedProjects.length > 0) && (
                <div className="mb-3">
                  <ProjectSwitcher
                    projects={projects}
                    archivedProjects={archivedProjects}
                    currentSlug={switcherSlug}
                    squadPreviewsByProjectId={squadPreviewsByProjectId}
                  />
                </div>
              )}
              {STTNS_BRAINSTORMING_ENABLED && (
                <div
                  className={
                    projects.length > 0 || archivedProjects.length > 0
                      ? "border-t border-border pt-3"
                      : ""
                  }
                >
                  <Link
                    href="/brainstorming"
                    onClick={() => setMobileOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition-colors",
                      pathname.startsWith("/brainstorming")
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Star className="h-4 w-4" />
                    Brainstorming
                  </Link>
                </div>
              )}
            </div>
            <ProjectSidebar
              pathname={pathname}
              slug={slug}
              isProject={isProject}
              onNavigate={() => setMobileOpen(false)}
              compact={false}
            />
          </aside>
        </div>
      )}

      <div className="min-w-0 lg:pl-[var(--sttns-sidebar-w)]">
        <main
          className="min-w-0 max-w-full"
          style={{ padding: "var(--sttns-space-page)" }}
        >
          {children}
        </main>
      </div>

      {isProject && slug && (
        <>
          <CommandPalette projectSlug={slug} />
          <CommandChordProvider projectSlug={slug} />
          <HealthCopilotBar projectSlug={slug} />
        </>
      )}
    </div>
  );
}
