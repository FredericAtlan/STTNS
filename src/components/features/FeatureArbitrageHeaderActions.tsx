"use client";

import Link from "next/link";
import { Bell, Download } from "lucide-react";
import { cn } from "@/lib/utils";

export function FeatureArbitrageHeaderActions({
  ceoFinalizeTaskCount = 0,
}: {
  ceoFinalizeTaskCount?: number;
}) {
  function handleExport() {
    window.dispatchEvent(new Event("feature-arbitrage-export-csv"));
  }

  return (
    <div className="flex items-center gap-2">
      {ceoFinalizeTaskCount > 0 && (
        <Link
          href="/me/tasks"
          className={cn(
            "relative inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300 bg-amber-50 px-3 text-sm font-semibold text-amber-950 shadow-sm transition hover:bg-amber-100"
          )}
          aria-label={`${ceoFinalizeTaskCount} validation${ceoFinalizeTaskCount > 1 ? "s" : ""} CEO en attente`}
        >
          <Bell className="h-4 w-4" aria-hidden />
          <span className="hidden sm:inline">Confirmer</span>
          <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white">
            {ceoFinalizeTaskCount > 99 ? "99+" : ceoFinalizeTaskCount}
          </span>
        </Link>
      )}
      <button type="button" onClick={handleExport} className="sttns-btn-secondary text-sm">
        <Download className="h-4 w-4" />
        Export CSV
      </button>
    </div>
  );
}
