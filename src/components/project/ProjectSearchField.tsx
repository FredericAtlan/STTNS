"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function ProjectSearchField({ className }: { className?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const initial = searchParams.get("q") ?? "";
  const [value, setValue] = useState(initial);

  useEffect(() => {
    setValue(initial);
  }, [initial]);

  const nextHref = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    const qs = params.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }, [pathname, searchParams, value]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      router.replace(nextHref, { scroll: false });
    }, 220);
    return () => window.clearTimeout(t);
  }, [nextHref, router]);

  return (
    <div className={cn("relative w-full max-w-xl", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search projects"
        className="h-11 w-full rounded-full border border-zinc-200 bg-zinc-50 pl-10 pr-10 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-300 focus:bg-white"
      />
      {value.trim() ? (
        <button
          type="button"
          onClick={() => setValue("")}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
