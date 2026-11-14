"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/utils";
import type { FrameworkSection, FrameworkSubsection } from "@/lib/sttns/frameworkContent";
import { MermaidDiagram, SttnsMarkdownRenderer } from "@/components/ui/SttnsMarkdownRenderer";
import { BookOpen, ChevronRight, Layers, Route, Scale } from "lucide-react";

function Callout({
  title,
  body,
  variant = "emerald",
}: {
  title: string;
  body: string;
  variant?: "emerald" | "slate" | "red";
}) {
  const styles = {
    emerald: "border-emerald-500 bg-emerald-50 text-emerald-900",
    slate: "border-slate-400 bg-slate-50 text-slate-800",
    red: "border-red-400 bg-red-50 text-red-900",
  };
  return (
    <div className={cn("rounded-lg border-l-4 px-4 py-3 text-sm leading-relaxed", styles[variant])}>
      <p className="font-bold">{title}</p>
      <div className="mt-1">
        <SttnsMarkdownRenderer content={body} className="space-y-1 text-sm [&_p]:my-0" />
      </div>
    </div>
  );
}

function SubsectionBlock({
  sub,
  projectSlug,
  projectLinks,
}: {
  sub: FrameworkSubsection;
  projectSlug: string;
  projectLinks?: Record<string, { href: string; label: string }>;
}) {
  const link = projectLinks?.[sub.id];

  return (
    <article id={sub.id} className="scroll-mt-24 sttns-card">
      <h4 className="font-display border-b border-slate-100 pb-3 text-lg font-bold text-slate-900">
        {sub.title}
      </h4>
      <div className="mt-4 space-y-3">
        {sub.paragraphs?.map((p, i) => (
          <SttnsMarkdownRenderer
            key={i}
            content={p}
            className="text-sm leading-relaxed text-slate-600"
          />
        ))}
        {sub.mermaidDiagrams?.map((diagram, i) => (
          <figure key={`m-${sub.id}-${i}`} className="space-y-2">
            <MermaidDiagram code={diagram.code} />
            {diagram.caption && (
              <figcaption className="text-center text-xs text-slate-500">{diagram.caption}</figcaption>
            )}
          </figure>
        ))}
        {sub.callouts?.map((c) => (
          <Callout key={c.title} title={c.title} body={c.body} variant={c.variant} />
        ))}
        {sub.bullets && (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
            {sub.bullets.map((b) => (
              <li key={b} className="[&_p]:my-0">
                <SttnsMarkdownRenderer content={b} className="space-y-0 text-sm [&_p]:my-0" />
              </li>
            ))}
          </ul>
        )}
        {sub.table && (
          <div className="rounded-lg border border-slate-200">
            <div className="sttns-scroll-x">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="bg-slate-50 text-xs font-bold uppercase text-slate-600">
                  {sub.table.headers.map((h) => (
                    <th key={h} className="px-3 py-2">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sub.table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-slate-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2 text-slate-600">
                        <SttnsMarkdownRenderer
                          content={cell}
                          className="space-y-0 text-sm [&_p]:my-0"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        )}
        {sub.funnelSteps && (
          <div className="space-y-3">
            {sub.funnelSteps.map((step) => (
              <div
                key={step.number}
                className="flex gap-3 rounded-lg border border-slate-200 border-l-4 border-l-emerald-500 bg-slate-50/50 p-4"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">
                  {step.number}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold text-slate-900">{step.title}</p>
                  <div className="mt-1">
                    <SttnsMarkdownRenderer
                      content={step.body}
                      className="space-y-1 text-sm text-slate-600 [&_p]:my-0"
                    />
                  </div>
                  {step.formula && (
                    <div className="mt-2 rounded bg-white px-3 py-2 text-center">
                      <SttnsMarkdownRenderer
                        content={step.formula}
                        className="space-y-0 text-sm font-semibold [&_p]:my-0"
                      />
                    </div>
                  )}
                  {step.bullets && (
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                      {step.bullets.map((b) => (
                        <li key={b} className="[&_p]:my-0">
                          <SttnsMarkdownRenderer
                            content={b}
                            className="space-y-0 text-sm [&_p]:my-0"
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            ))}
            <p className="text-center text-xs font-extrabold uppercase tracking-widest text-emerald-700">
              Code autorisé pour le sprint
            </p>
          </div>
        )}
        {link && (
          <Link
            href={link.href}
            className="inline-flex items-center gap-1 text-sm font-bold text-sttns-accent hover:underline"
          >
            {link.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </article>
  );
}

const PROJECT_LINKS = (slug: string): Record<string, { href: string; label: string }> => ({
  nsm: { href: `/projects/${slug}/nsm`, label: "North Star & métriques" },
  "why-spine": { href: `/projects/${slug}/why`, label: "Matrice Besoins" },
  "discipline-ve": { href: `/projects/${slug}/portfolio`, label: "Portfolio V/E" },
  "execution-radar": { href: `/projects/${slug}/radar`, label: "Radar hygiène" },
  "systeme-code": { href: `/projects/${slug}/discovery`, label: "Brouillons Epic→Feature→Story" },
  "scoring-ve": { href: `/projects/${slug}/help/scoring`, label: "Aide Scoring V/E" },
  "garde-fous": { href: `/projects/${slug}/radar`, label: "Radar hygiène" },
});

interface Props {
  projectSlug: string;
  projectName: string;
  strategique: FrameworkSection;
  application: FrameworkSection;
  scoring: FrameworkSection;
  fluxPanel: React.ReactNode;
}

export function FrameworkViewer({
  projectSlug,
  projectName,
  strategique,
  application,
  scoring,
  fluxPanel,
}: Props) {
  const [activeTab, setActiveTab] = useState<
    "flux" | "strategique" | "application" | "scoring"
  >("scoring");

  const navItems = [
    { id: "scoring" as const, label: "Scoring Valeur / Effort", icon: Scale },
    { id: "flux" as const, label: "Parcours outil STTNS", icon: Route },
    { id: "strategique" as const, label: "1. Framework stratégique", icon: BookOpen },
    { id: "application" as const, label: `2. Application ${projectName}`, icon: Layers },
  ];

  const links = PROJECT_LINKS(projectSlug);

  const tocSection =
    activeTab === "strategique"
      ? strategique
      : activeTab === "application"
        ? application
        : activeTab === "scoring"
          ? scoring
          : null;

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <aside className="lg:sticky lg:top-6 lg:w-64 lg:shrink-0">
        <nav className="space-y-1 rounded-xl border border-slate-200 bg-white p-2 shadow-sm">
          {navItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setActiveTab(id)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-bold transition",
                activeTab === id
                  ? "bg-emerald-50 text-sttns-accent ring-1 ring-emerald-200"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          ))}
        </nav>
        {tocSection && (
          <ul className="mt-3 hidden space-y-0.5 pl-2 text-xs font-medium text-slate-500 lg:block">
            {tocSection.subsections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="block rounded px-2 py-1 hover:text-sttns-accent">
                  {s.title.split("—")[0].split(":")[0]}
                </a>
              </li>
            ))}
          </ul>
        )}
      </aside>

      <div className="min-w-0 flex-1">
        {activeTab === "flux" && (
          <div>
            <header className="mb-6">
              <h3 className="font-display text-2xl font-extrabold">Parcours outil STTNS</h3>
              <p className="mt-1 text-sm text-sttns-muted">
                Flux recommandé — Matrice Besoins → Brouillons → Portfolio → Cycles → Kanban → Radar.
                Le scoring actif est Valeur / Effort (onglet dédié).
              </p>
            </header>
            {fluxPanel}
            <div className="mt-6 sttns-card border-l-4 border-l-emerald-500 text-sm text-slate-600">
              <p className="font-bold text-slate-800">Suite dans l&apos;app</p>
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                <li>
                  <Link
                    href={`/projects/${projectSlug}/discovery`}
                    className="text-sttns-accent hover:underline"
                  >
                    Brouillons Epic→Feature→Story
                  </Link>{" "}
                  — tableau de réunion pour créer des brouillons Epic / Feature / Story
                </li>
                <li>
                  <Link
                    href={`/projects/${projectSlug}/portfolio`}
                    className="text-sttns-accent hover:underline"
                  >
                    Portfolio
                  </Link>{" "}
                  — priorisation V/E
                </li>
                <li>
                  <Link
                    href={`/projects/${projectSlug}/spine`}
                    className="text-sttns-accent hover:underline"
                  >
                    Arbre
                  </Link>{" "}
                  — Inspecteur Structure
                </li>
              </ol>
            </div>
          </div>
        )}

        {activeTab === "scoring" && (
          <div>
            <header className="mb-6">
              <h3 className="font-display text-2xl font-extrabold">{scoring.title}</h3>
              <p className="mt-1 text-sm text-sttns-muted">{scoring.subtitle}</p>
            </header>
            <div className="space-y-6">
              {scoring.subsections.map((sub) => (
                <SubsectionBlock key={sub.id} sub={sub} projectSlug={projectSlug} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "strategique" && (
          <div>
            <header className="mb-6">
              <h3 className="font-display text-2xl font-extrabold">{strategique.title}</h3>
              <p className="mt-1 text-sm text-sttns-muted">{strategique.subtitle}</p>
            </header>
            <div className="space-y-6">
              {strategique.subsections.map((sub) => (
                <SubsectionBlock key={sub.id} sub={sub} projectSlug={projectSlug} />
              ))}
            </div>
          </div>
        )}

        {activeTab === "application" && (
          <div>
            <header className="mb-6">
              <h3 className="font-display text-2xl font-extrabold">{application.title}</h3>
              <p className="mt-1 text-sm text-sttns-muted">{application.subtitle}</p>
            </header>
            <div className="space-y-6">
              {application.subsections.map((sub) => (
                <SubsectionBlock
                  key={sub.id}
                  sub={sub}
                  projectSlug={projectSlug}
                  projectLinks={links}
                />
              ))}
            </div>
          </div>
        )}

        <p className="mt-10 text-xs text-sttns-muted">
          Scoring V/E = ground truth produit · RICE déprécié · Market Chain / STTNS
        </p>
      </div>
    </div>
  );
}
