import type { PersonaCatalogHealth } from "@/lib/personas/personaCatalogHealth";
import { cn } from "@/lib/utils";

export type PersonaStatus = "DRAFT" | "READY";

export const PERSONA_STATUS_LABELS: Record<PersonaStatus, string> = {
  DRAFT: "Brouillon",
  READY: "Ready",
};

const PERSONA_STATUS_TONE: Record<PersonaStatus, string> = {
  DRAFT: "border-zinc-200 bg-zinc-100 text-zinc-700",
  READY: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

const HEALTH_TONE: Record<PersonaCatalogHealth["level"], string> = {
  empty: "border-zinc-200 bg-zinc-50 text-zinc-600",
  incomplete: "border-amber-200 bg-amber-50 text-amber-900",
  critical: "border-red-200 bg-red-50 text-red-800",
  warning: "border-amber-200 bg-amber-50 text-amber-900",
  healthy: "border-emerald-200 bg-emerald-50 text-emerald-800",
};

export type PersonaProjectScope = "active" | "reference";

export const PERSONA_SCOPE_LABELS: Record<PersonaProjectScope, string> = {
  active: "Actif",
  reference: "Inactif",
};

const PERSONA_SCOPE_TONE: Record<PersonaProjectScope, string> = {
  active: "border-emerald-200 bg-emerald-50 text-emerald-800",
  reference: "border-zinc-200 bg-zinc-100 text-zinc-600",
};

export function PersonaScopeBadge({ scope }: { scope: PersonaProjectScope }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        PERSONA_SCOPE_TONE[scope]
      )}
    >
      {PERSONA_SCOPE_LABELS[scope]}
    </span>
  );
}

export function PersonaStatusBadge({ status }: { status: PersonaStatus }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        PERSONA_STATUS_TONE[status]
      )}
    >
      {PERSONA_STATUS_LABELS[status]}
    </span>
  );
}

export function PersonaHealthPill({ health }: { health: PersonaCatalogHealth }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        HEALTH_TONE[health.level]
      )}
      title={health.tip}
    >
      {health.label}
    </span>
  );
}
