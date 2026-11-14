import Link from "next/link";
import { featuresHubPath } from "@/lib/sttns/paths";
import { cn } from "@/lib/utils";
import { ArrowRight, Check } from "lucide-react";

export type ProductJourneyStep =
  | "epic"
  | "stories"
  | "features"
  | "cockpit"
  | "delivered";

const STEPS: {
  id: ProductJourneyStep;
  title: string;
  subtitle: string;
}[] = [
  {
    id: "epic",
    title: "Epic",
    subtitle: "Objectif métier · persona · Brouillon → Prête",
  },
  {
    id: "stories",
    title: "User stories",
    subtitle: "Rattachées à l'epic · validées comité",
  },
  {
    id: "features",
    title: "Features BUILD",
    subtitle: "Liées à une story · arbitrage CEO",
  },
  {
    id: "cockpit",
    title: "Cockpit",
    subtitle: "File · assignation · démarrer le dev",
  },
  {
    id: "delivered",
    title: "Livraison",
    subtitle: "Sprint · test · déployé",
  },
];

interface Props {
  projectSlug: string;
  activeStep: ProductJourneyStep;
  /** Étapes déjà accomplies (avant activeStep) */
  completedSteps?: ProductJourneyStep[];
  nextAction?: {
    label: string;
    href: string;
  };
  className?: string;
}

export function ProductJourneyRail({
  projectSlug,
  activeStep,
  completedSteps = [],
  nextAction,
  className,
}: Props) {
  const activeIndex = STEPS.findIndex((s) => s.id === activeStep);
  const doneSet = new Set(completedSteps);

  return (
    <section
      className={cn(
        "rounded-2xl border border-emerald-200/70 bg-gradient-to-br from-emerald-50/80 to-white p-4 shadow-sm",
        className
      )}
      aria-label="Parcours produit Epic vers livraison"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-800">
          Le chemin STTNS
        </p>
        <Link
          href={`/projects/${projectSlug}/kanban`}
          className="text-[11px] font-semibold text-emerald-800 hover:underline"
        >
          Voir le kanban →
        </Link>
      </div>

      <ol className="grid gap-2 sm:grid-cols-5">
        {STEPS.map((step, index) => {
          const isActive = step.id === activeStep;
          const isDone = doneSet.has(step.id) || index < activeIndex;
          const isFuture = index > activeIndex && !isDone;

          return (
            <li
              key={step.id}
              className={cn(
                "relative rounded-xl border px-3 py-2.5 transition",
                isActive && "border-emerald-400 bg-white ring-2 ring-emerald-200/80",
                isDone && !isActive && "border-emerald-200/60 bg-emerald-50/50",
                isFuture && "border-zinc-200/80 bg-white/60 opacity-80"
              )}
            >
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                    isDone && "bg-emerald-600 text-white",
                    isActive && !isDone && "bg-emerald-100 text-emerald-900 ring-2 ring-emerald-500",
                    isFuture && "bg-zinc-100 text-zinc-500"
                  )}
                >
                  {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <div className="min-w-0">
                  <p
                    className={cn(
                      "text-xs font-bold",
                      isActive ? "text-emerald-900" : "text-zinc-800"
                    )}
                  >
                    {step.title}
                    {isActive && (
                      <span className="ml-1.5 rounded bg-emerald-700 px-1.5 py-px text-[9px] font-bold uppercase tracking-wide text-white">
                        Ici
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-[10px] leading-snug text-zinc-500">{step.subtitle}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {nextAction && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-200/60 bg-white/90 px-4 py-3">
          <p className="text-sm text-zinc-700">
            <span className="font-semibold text-zinc-900">Prochaine action :</span>{" "}
            {nextAction.label}
          </p>
          <Link href={nextAction.href} className="sttns-btn-primary text-sm">
            Continuer
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <p className="mt-3 text-[11px] leading-relaxed text-zinc-500">
        L&apos;epic seule ne livre rien : elle regroupe des stories. Les features BUILD passent
        le comité puis entrent dans le{" "}
        <Link href={`/projects/${projectSlug}/kanban`} className="font-semibold text-emerald-800 hover:underline">
          Kanban
        </Link>
        . Démarrer le dev déclenche la cascade story → sprint → epic en cours.
      </p>
    </section>
  );
}

/** Liens rapides selon l'étape courante (fallback). */
export function defaultJourneyNextAction(
  projectSlug: string,
  step: ProductJourneyStep,
  epicId?: string
): { label: string; href: string } | undefined {
  switch (step) {
    case "epic":
      return epicId
        ? {
            label: "Rattacher ou créer une user story sur cette epic",
            href: `/projects/${projectSlug}/user-stories/new?epicId=${epicId}`,
          }
        : {
            label: "Enregistrer l'epic puis ouvrir sa fiche pour lier des stories",
            href: `/projects/${projectSlug}/epics/new`,
          };
    case "stories":
      return {
        label: "Créer une feature BUILD liée à une story validée",
        href: `/projects/${projectSlug}/features/new`,
      };
    case "features":
      return {
        label: "Passer par la Control Room jusqu'à décision BUILD actée",
        href: featuresHubPath(projectSlug, "arbitrage"),
      };
    case "cockpit":
      return {
        label: "Ordonner la file et démarrer le développement",
        href: `/projects/${projectSlug}/kanban`,
      };
    default:
      return undefined;
  }
}
