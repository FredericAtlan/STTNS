"use client";

import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { cn } from "@/lib/utils";
import { MermaidDiagram } from "@/components/ui/SttnsMarkdownRenderer";

interface Props {
  content: string;
  className?: string;
}

export function SpineRichText({ content, className }: Props) {
  const trimmed = content.trim();
  if (!trimmed) return null;

  return (
    <div
      className={cn(
        "prose prose-sm dark:prose-invert prose-zinc max-w-none",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
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
              <code {...props}>{children}</code>
            );
          },
        }}
      >
        {trimmed}
      </ReactMarkdown>
    </div>
  );
}
