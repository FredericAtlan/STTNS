"use client";

import { ExternalLink, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  label?: string;
  hint?: string;
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
  className?: string;
  error?: string | null;
}

function isValidHttpUrl(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function SpineDocLinkField({
  label = "Lien documentation",
  hint = "Notion, Confluence ou toute URL HTTPS — même convention que les tasks.",
  value,
  onChange,
  readOnly = false,
  placeholder = "https://notion.so/…",
  className,
  error,
}: Props) {
  const trimmed = value.trim();
  const showLink = trimmed.length > 0 && isValidHttpUrl(trimmed);
  const showError = error || (trimmed.length > 0 && !isValidHttpUrl(trimmed));

  return (
    <div className={className}>
      <label className="sttns-label">{label}</label>
      {hint && <p className="mt-0.5 text-xs text-muted-foreground">{hint}</p>}

      {readOnly ? (
        trimmed ? (
          <a
            href={trimmed}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-violet-700 hover:text-violet-900 hover:underline"
          >
            <ExternalLink className="h-4 w-4 shrink-0" />
            Ouvrir la documentation
          </a>
        ) : (
          <p className="mt-2 text-sm text-zinc-400 italic">Aucun lien renseigné.</p>
        )
      ) : (
        <div className="mt-1 flex gap-2">
          <div className="relative min-w-0 flex-1">
            <Link2 className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="url"
              value={value}
              onChange={(e) => onChange?.(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "sttns-input pl-9",
                showError && "border-destructive focus:border-destructive focus:ring-destructive"
              )}
            />
          </div>
          {showLink && (
            <a
              href={trimmed}
              target="_blank"
              rel="noopener noreferrer"
              title="Ouvrir la documentation"
              className="sttns-btn-icon text-violet-700"
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          )}
        </div>
      )}

      {showError && (
        <p className="mt-1 text-xs text-red-600">
          {error ?? "URL invalide — utilisez une adresse http:// ou https://."}
        </p>
      )}
    </div>
  );
}

export function isValidDocLinkInput(value: string): boolean {
  return isValidHttpUrl(value);
}
