"use client";

import type { FrameworkCallout, FrameworkSection, FrameworkSubsection } from "@/lib/sttns/frameworkContent";
import { MermaidDiagram, SttnsMarkdownRenderer } from "@/components/ui/SttnsMarkdownRenderer";
import { HelpChapterDownloadButton } from "@/components/help/HelpChapterDownloadButton";
import type { HelpChapterSlug } from "@/lib/sttns/helpPlaybook";
import { cn } from "@/lib/utils";

function HelpCallout({ title, body, variant = "emerald" }: FrameworkCallout) {
  const styles = {
    emerald: "border-emerald-500 bg-emerald-50/80",
    slate: "border-zinc-400 bg-zinc-50",
    red: "border-red-400 bg-red-50/80",
  };

  return (
    <aside
      className={cn(
        "rounded-lg border-l-4 px-4 py-3",
        styles[variant ?? "emerald"]
      )}
    >
      <p className="text-sm font-bold text-zinc-900">{title}</p>
      <div className="mt-1.5">
        <SttnsMarkdownRenderer
          content={body}
          className="space-y-2 text-sm text-zinc-700 [&_p]:my-1"
        />
      </div>
    </aside>
  );
}

function FunnelSteps({ steps }: { steps: NonNullable<FrameworkSubsection["funnelSteps"]> }) {
  return (
    <div className="space-y-3">
      {steps.map((step) => (
        <div
          key={step.number}
          className="flex gap-3 rounded-lg border border-zinc-200 border-l-4 border-l-emerald-500 bg-emerald-50/40 p-4"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-sm font-extrabold text-white">
            {step.number}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display font-bold text-zinc-900">{step.title}</p>
            <div className="mt-1">
              <SttnsMarkdownRenderer
                content={step.body}
                className="space-y-2 text-sm text-zinc-600 [&_p]:my-1"
              />
            </div>
            {step.formula && (
              <div className="mt-2 rounded bg-white px-3 py-2 text-center">
                <SttnsMarkdownRenderer
                  content={step.formula}
                  className="space-y-0 text-sm font-semibold text-zinc-900 [&_p]:my-0"
                />
              </div>
            )}
            {step.bullets && (
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-600">
                {step.bullets.map((b) => (
                  <li key={b} className="[&_p]:my-0">
                    <SttnsMarkdownRenderer
                      content={b}
                      className="space-y-0 text-sm text-zinc-600 [&_p]:my-0"
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
  );
}

function SubsectionBlock({ sub }: { sub: FrameworkSubsection }) {
  return (
    <article id={sub.id} className="scroll-mt-28 space-y-4 border-b border-zinc-100 pb-10 last:border-0">
      <h2 className="font-display text-xl font-bold tracking-tight text-zinc-900">
        {sub.title}
      </h2>

      {sub.paragraphs?.map((p, i) => (
        <SttnsMarkdownRenderer
          key={i}
          content={p}
          className="text-sm leading-relaxed text-zinc-600"
        />
      ))}

      {sub.mermaidDiagrams?.map((diagram, i) => (
        <figure key={`mermaid-${sub.id}-${i}`} className="space-y-2">
          <MermaidDiagram code={diagram.code} />
          {diagram.caption && (
            <figcaption className="text-center text-xs leading-relaxed text-zinc-500">
              {diagram.caption}
            </figcaption>
          )}
        </figure>
      ))}

      {sub.callouts?.map((c) => (
        <HelpCallout key={c.title} {...c} />
      ))}

      {sub.bullets && (
        <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-zinc-600">
          {sub.bullets.map((b) => (
            <li key={b} className="[&_p]:my-0">
              <SttnsMarkdownRenderer
                content={b}
                className="space-y-0 text-sm text-zinc-600 [&_p]:my-0"
              />
            </li>
          ))}
        </ul>
      )}

      {sub.table && (
        <div className="overflow-hidden rounded-lg border border-zinc-200">
          <div className="sttns-scroll-x">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                  {sub.table.headers.map((h) => (
                    <th key={h} className="px-3 py-2.5">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sub.table.rows.map((row, ri) => (
                  <tr key={ri} className="border-t border-zinc-100">
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-2.5 align-top text-zinc-600">
                        <SttnsMarkdownRenderer
                          content={cell}
                          className="space-y-0 text-sm text-zinc-600 [&_p]:my-0 [&_code]:text-xs"
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

      {sub.funnelSteps && <FunnelSteps steps={sub.funnelSteps} />}
    </article>
  );
}

export function HelpSectionBody({
  section,
  chapterSlug,
  projectSlug,
}: {
  section: FrameworkSection;
  chapterSlug: HelpChapterSlug;
  projectSlug?: string;
}) {
  return (
    <div className="space-y-2">
      <header className="mb-8 space-y-2 border-b border-zinc-200 pb-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
            {section.title}
          </h1>
          <HelpChapterDownloadButton
            section={section}
            chapterSlug={chapterSlug}
            projectSlug={projectSlug}
            label
          />
        </div>
        {section.subtitle && (
          <p className="max-w-2xl text-sm leading-relaxed text-zinc-500">{section.subtitle}</p>
        )}
      </header>
      <div className="space-y-2">
        {section.subsections.map((sub) => (
          <SubsectionBlock key={sub.id} sub={sub} />
        ))}
      </div>
    </div>
  );
}
