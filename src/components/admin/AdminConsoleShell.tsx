"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  FolderKanban,
  Mail,
  Shield,
  ArrowLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/projects", label: "Projects", icon: FolderKanban },
  { href: "/admin/invites", label: "Invites", icon: Mail },
  { href: "/admin/security", label: "Security", icon: Shield },
];

export function AdminConsoleShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-semibold text-sttns-accent hover:underline"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to STTNS
          </Link>
          <h1 className="mt-2 font-display text-2xl font-extrabold sm:text-3xl">
            Admin console
          </h1>
          <p className="mt-1 text-sm text-sttns-muted">
            Users, projects, invites, and platform security.
          </p>
        </div>
      </div>

      <nav className="flex gap-2 overflow-x-auto border-b border-slate-200 pb-1">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-bold transition",
                active
                  ? "border-b-2 border-sttns-accent text-sttns-accent"
                  : "text-sttns-muted hover:text-slate-900"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
