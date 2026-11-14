"use client";

import Link from "next/link";
import { Bell } from "lucide-react";
import { cn } from "@/lib/utils";

export function TaskBell({ count }: { count: number }) {
  return (
    <Link
      href="/me/tasks"
      className={cn(
        "relative inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 bg-white text-zinc-600 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50",
        count > 0 && "border-amber-300 bg-amber-50"
      )}
      aria-label={`${count} open tasks`}
    >
      <Bell className="h-4 w-4 text-slate-700" />
      {count > 0 && (
        <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
