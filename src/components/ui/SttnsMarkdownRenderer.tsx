"use client";

import { useEffect, useId, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";

export function MermaidDiagram({ code, compact = false }: { code: string; compact?: boolean }) {
  const reactId = useId().replace(/:/g, "");
  const renderSeq = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const renderId = `sttns-mermaid-${reactId}-${++renderSeq.current}`;

    async function renderDiagram() {
      if (!containerRef.current || !code.trim()) return;
      setError(null);
      containerRef.current.innerHTML = "";

      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "base",
          // "strict" : Mermaid assainit les libellés et désactive les clics/scripts (contenu saisi par les utilisateurs).
          securityLevel: "strict",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
          themeVariables: {
            primaryColor: "#d1fae5",
            primaryTextColor: "#064e3b",
            primaryBorderColor: "#059669",
            secondaryColor: "#fef3c7",
            secondaryTextColor: "#78350f",
            secondaryBorderColor: "#d97706",
            tertiaryColor: "#f1f5f9",
            tertiaryTextColor: "#334155",
            tertiaryBorderColor: "#94a3b8",
            lineColor: "#64748b",
            textColor: "#334155",
            mainBkg: "#ecfdf5",
            nodeBorder: "#059669",
            clusterBkg: "#f8fafc",
            clusterBorder: "#cbd5e1",
            titleColor: "#0f172a",
            edgeLabelBackground: "#ffffff",
          },
        });

        const { svg } = await mermaid.render(renderId, code.trim());
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Diagramme Mermaid invalide");
        }
      }
    }

    void renderDiagram();
    return () => {
      cancelled = true;
    };
  }, [code, reactId]);

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
        <p className="font-semibold">Erreur Mermaid</p>
        <p className="mt-1 text-xs">{error}</p>
        <pre className="mt-3 overflow-x-auto rounded-lg bg-white p-3 font-mono text-[11px] text-zinc-700">
          {code}
        </pre>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        "overflow-x-auto rounded-xl border border-emerald-100/80 bg-emerald-50/30 [&_svg]:mx-auto [&_svg]:max-w-full",
        compact ? "my-0 p-2" : "my-4 p-4"
      )}
    />
  );
}

type Props = {
  content: string;
  className?: string;
  emptyMessage?: string;
};

export function SttnsMarkdownRenderer({
  content,
  className,
  emptyMessage = "Aucune spécification renseignée.",
}: Props) {
  const trimmed = content.trim();

  if (!trimmed) {
    return <p className="text-sm text-zinc-500">{emptyMessage}</p>;
  }

  return (
    <div
      className={cn(
        "sttns-markdown space-y-4 text-sm leading-relaxed text-zinc-700",
        "[&_h1]:font-display [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-zinc-900",
        "[&_h2]:font-display [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-zinc-900",
        "[&_h3]:font-display [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-900",
        "[&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5",
        "[&_ol]:list-decimal [&_ol]:space-y-1 [&_ol]:pl-5",
        "[&_a]:font-semibold [&_a]:text-emerald-700 [&_a]:underline",
        "[&_blockquote]:border-l-4 [&_blockquote]:border-zinc-200 [&_blockquote]:pl-4 [&_blockquote]:italic",
        "[&_pre:not(.mermaid)]:overflow-x-auto [&_pre:not(.mermaid)]:rounded-xl [&_pre:not(.mermaid)]:border [&_pre:not(.mermaid)]:border-zinc-200 [&_pre:not(.mermaid)]:bg-zinc-950 [&_pre:not(.mermaid)]:p-4 [&_pre:not(.mermaid)]:font-mono [&_pre:not(.mermaid)]:text-[13px] [&_pre:not(.mermaid)]:text-zinc-100",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName ?? "");
            const language = match?.[1];
            const raw = String(children).replace(/\n$/, "");

            if (language === "mermaid") {
              return <MermaidDiagram code={raw} />;
            }

            const isBlock = codeClassName?.includes("language-");
            if (isBlock) {
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            }

            return (
              <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-[13px]" {...props}>
                {children}
              </code>
            );
          },
        }}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
