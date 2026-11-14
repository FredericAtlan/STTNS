import { cn } from "@/lib/utils";
import type { SimplifiedModeVariant } from "@/lib/sttns/projectExecutionMode";
import { getSimplifiedModeVariant } from "@/lib/sttns/projectExecutionMode";
import { parseProjectWorkflowSettings } from "@/lib/sttns/projectSettingsSchema";

type Props = {
  variant: SimplifiedModeVariant;
  className?: string;
  /** Version compacte pour la barre d'en-tête */
  compact?: boolean;
};

const VARIANTS: Record<
  SimplifiedModeVariant,
  { compactLabel: string; fullLabel: string; title: string; className: string }
> = {
  shape_up: {
    compactLabel: "Shape Up",
    fullLabel: "Mode Shape Up",
    title: "Gestion simplifiée complète : features en exécution et epic lié à chaque cycle",
    className: "border-blue-200/80 bg-blue-50/90 text-blue-800/90",
  },
  feature_only: {
    compactLabel: "Features",
    fullLabel: "Exécution features",
    title: "Kanban et backlog au niveau feature — sans stories ni tâches",
    className: "border-emerald-200/80 bg-emerald-50/90 text-emerald-800/90",
  },
  epic_cycle: {
    compactLabel: "Epic=Cycle",
    fullLabel: "Epic = Cycle",
    title: "Chaque cycle crée ou lie automatiquement un epic — stories conservées",
    className: "border-amber-200/80 bg-amber-50/90 text-amber-800/90",
  },
};

/** Badge discret selon la variante de gestion simplifiée active. */
export function ShapeUpModeBadge({ variant, className, compact = false }: Props) {
  const config = VARIANTS[variant];

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-medium",
        config.className,
        compact
          ? "px-1.5 py-0.5 text-[9px] tracking-wide"
          : "px-2 py-0.5 text-[10px] tracking-wide",
        className
      )}
      role="status"
      title={config.title}
    >
      {compact ? config.compactLabel : config.fullLabel}
    </span>
  );
}

/** Résout le badge à partir du JSONB `sttns_projects.settings`. */
export function ProjectModeBadgeFromSettings({
  settings,
  className,
  compact = false,
}: {
  settings?: Record<string, unknown> | null;
  className?: string;
  compact?: boolean;
}) {
  const variant = getSimplifiedModeVariant(parseProjectWorkflowSettings(settings));
  if (!variant) return null;
  return <ShapeUpModeBadge variant={variant} className={className} compact={compact} />;
}
