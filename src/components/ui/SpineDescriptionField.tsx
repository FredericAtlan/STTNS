"use client";

import { useState } from "react";
import { Eye, FileText } from "lucide-react";
import { SpineRichText } from "@/components/ui/SpineRichText";
import { cn } from "@/lib/utils";

type DescriptionView = "raw" | "preview";

interface Props {
  label?: string;
  hint?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  emptyMessage?: string;
}

function ViewToggle({
  view,
  onViewChange,
  className,
}: {
  view: DescriptionView;
  onViewChange: (view: DescriptionView) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5",
        className
      )}
      role="group"
      aria-label="Mode d'affichage de la description"
    >
      <button
        type="button"
        onClick={() => onViewChange("raw")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "raw"
            ? "bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-200"
            : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <FileText className="h-3.5 w-3.5" />
        Texte
      </button>
      <button
        type="button"
        onClick={() => onViewChange("preview")}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
          view === "preview"
            ? "bg-white text-emerald-800 shadow-sm ring-1 ring-zinc-200"
            : "text-zinc-500 hover:text-zinc-700"
        )}
      >
        <Eye className="h-3.5 w-3.5" />
        Aperçu
      </button>
    </div>
  );
}

export function SpineDescriptionField({
  label,
  hint,
  value,
  onChange,
  readOnly = false,
  placeholder,
  className,
  emptyMessage = "Aucune description.",
}: Props) {
  const [view, setView] = useState<DescriptionView>(readOnly ? "preview" : "raw");
  const hasContent = value.trim().length > 0;
  const editable = !readOnly && onChange;

  return (
    <div className={className}>
      {(label || hint || hasContent || editable) && (
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            {label && <label className="sttns-label mb-0">{label}</label>}
            {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}
          </div>
          {(hasContent || editable) && (
            <ViewToggle view={view} onViewChange={setView} className="shrink-0" />
          )}
        </div>
      )}

      <div className={label || hint ? "mt-2" : undefined}>
        {view === "raw" ? (
          editable ? (
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              className="sttns-input min-h-[120px] font-mono"
              placeholder={placeholder}
            />
          ) : hasContent ? (
            <pre className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-700 whitespace-pre-wrap font-mono overflow-x-auto">
              {value}
            </pre>
          ) : (
            <p className="text-sm text-zinc-400 italic">{emptyMessage}</p>
          )
        ) : hasContent ? (
          <div className="rounded border border-zinc-200 bg-white px-3 py-2">
            <SpineRichText content={value} />
          </div>
        ) : (
          <p className="text-sm text-zinc-400 italic">{emptyMessage}</p>
        )}
      </div>
    </div>
  );
}

/** Lecture seule avec bascule Texte / Aperçu — fiches détail, en-têtes. */
export function SpineDescriptionViewer({
  content,
  className,
}: {
  content: string;
  className?: string;
}) {
  if (!content.trim()) return null;

  return (
    <SpineDescriptionField
      value={content}
      readOnly
      className={className}
    />
  );
}
