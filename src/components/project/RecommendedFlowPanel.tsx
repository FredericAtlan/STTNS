import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { featuresPath } from "@/lib/sttns/paths";
import { SttnsContextHelp } from "@/components/ui/SttnsContextHelp";
import { PAGE_CONTEXT_HELP } from "@/lib/sttns/sttnsContext";

interface FlowStep {
  id: string;
  title: string;
  description: string;
  done: boolean;
  href: string;
  cta: string;
}

interface Props {
  projectSlug: string;
  personaCount: number;
  storyCount: number;
  storiesWithSprint: number;
  initiativesLinked: number;
  initiativeTotal: number;
}

export function RecommendedFlowPanel({
  projectSlug,
  personaCount,
  storyCount,
  storiesWithSprint,
  initiativesLinked,
  initiativeTotal,
}: Props) {
  const base = `/projects/${projectSlug}`;

  const steps: FlowStep[] = [
    {
      id: "personas",
      title: "1. Matrice Besoins",
      description: "Personas, Pain Points et JTBD — fondation Spine (Why).",
      done: personaCount >= 3,
      href: `${base}/why`,
      cta: personaCount >= 3 ? "Voir Matrice Besoins" : "Créer dans Matrice Besoins",
    },
    {
      id: "stories",
      title: "2. User stories",
      description: "Cross-persona narrative scenario + sprint format (+ optional steps).",
      done: storyCount >= 3 && storiesWithSprint >= 3,
      href: `${base}/user-stories`,
      cta: storyCount >= 3 ? "View stories" : "Create a user story",
    },
    {
      id: "features",
      title: "3. Features",
      description: "Feature sheets linked to a persona and user story — steps 3 to 6.",
      done: initiativesLinked >= Math.min(3, initiativeTotal),
      href: featuresPath(projectSlug, "arbitrage"),
      cta: "Open arbitration matrix",
    },
  ];

  const completedCount = steps.filter((s) => s.done).length;
  const allDone = completedCount === steps.length;

  return (
    <section className="mb-8 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-widest text-sttns-accent">
            STTNS product journey
          </p>
          <h3 className="font-display text-xl font-extrabold">Recommended flow</h3>
          <div className="mt-1 flex items-center gap-1.5">
            <p className="text-sm text-sttns-muted">Personas → User stories → Features</p>
            <SttnsContextHelp {...PAGE_CONTEXT_HELP.recommendedFlow} />
          </div>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-bold ${
            allDone ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
          }`}
        >
          {completedCount}/{steps.length} steps
        </span>
      </div>

      <ol className="mt-5 space-y-3">
        {steps.map((step, index) => (
          <li
            key={step.id}
            className={`flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center sm:justify-between ${
              step.done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-200 bg-slate-50/50"
            }`}
          >
            <div className="flex gap-3">
              {step.done ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" aria-hidden />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
              )}
              <div>
                <p className="font-display font-bold text-slate-900">{step.title}</p>
                <p className="text-sm text-slate-600">{step.description}</p>
                {step.id === "personas" && personaCount > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {personaCount} persona{personaCount !== 1 ? "s" : ""} recorded
                  </p>
                )}
                {step.id === "stories" && storyCount > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {storyCount} stories · {storiesWithSprint} with sprint format
                  </p>
                )}
                {step.id === "features" && initiativeTotal > 0 && (
                  <p className="mt-1 text-xs font-semibold text-emerald-700">
                    {initiativesLinked}/{initiativeTotal} features linked to persona + story
                  </p>
                )}
              </div>
            </div>
            <Link
              href={step.href}
              className="inline-flex shrink-0 items-center gap-1 text-sm font-bold text-sttns-accent hover:underline"
            >
              {step.cta}
              {index < steps.length - 1 && !step.done && (
                <ArrowRight className="h-3.5 w-3.5" />
              )}
            </Link>
          </li>
        ))}
      </ol>

      {allDone && (
        <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          MarketChain scenario ready: the committee can arbitrate features via the
          arbitration matrix and modules.
        </p>
      )}
    </section>
  );
}
