"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Clock, Loader2 } from "lucide-react";
import { fetchWorkItemEventsAction } from "@/app/projects/[slug]/work-items/history-actions";
import {
  describeEvent,
  formatEventType,
  type WorkItemEventRow,
} from "@/lib/sttns/workItemEvents";

interface Props {
  workItemId: string;
  defaultOpen?: boolean;
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function WorkItemHistory({ workItemId, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [events, setEvents] = useState<WorkItemEventRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open || loaded) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchWorkItemEventsAction(workItemId).then((result) => {
      if (cancelled) return;
      setLoading(false);
      setLoaded(true);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setEvents(result.events);
    });

    return () => {
      cancelled = true;
    };
  }, [open, loaded, workItemId]);

  return (
    <div className="rounded border border-zinc-200 bg-zinc-50/50">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100/80"
      >
        {open ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />
        )}
        <Clock className="h-4 w-4 text-zinc-500" />
        Historique d&apos;audit
        {loaded && !loading && (
          <span className="ml-auto text-xs font-normal text-zinc-400">
            {events.length} événement{events.length !== 1 ? "s" : ""}
          </span>
        )}
      </button>

      {open && (
        <div className="border-t border-zinc-200 px-4 py-3">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 py-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Chargement…
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 py-2">{error}</p>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="text-sm text-zinc-400 italic py-2">Aucun événement enregistré.</p>
          )}

          {!loading && events.length > 0 && (
            <ol className="relative space-y-4 border-l border-zinc-200 ml-2 pl-4">
              {events.map((event) => (
                <li key={event.id} className="relative">
                  <span className="absolute -left-[1.35rem] top-1.5 h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-white" />
                  <div className="text-xs text-zinc-400">{formatDate(event.created_at)}</div>
                  <div className="text-sm font-medium text-zinc-800">
                    {formatEventType(event.event_type)}
                  </div>
                  <div className="text-sm text-zinc-600">{describeEvent(event)}</div>
                  {event.actor_name && (
                    <div className="text-xs text-zinc-400 mt-0.5">par {event.actor_name}</div>
                  )}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </div>
  );
}
