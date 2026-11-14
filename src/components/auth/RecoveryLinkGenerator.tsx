"use client";

import { useState } from "react";
import { Loader2, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function RecoveryLinkGenerator({
  className,
  defaultEmail = "",
  compact = false,
}: {
  className?: string;
  defaultEmail?: string;
  compact?: boolean;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [loading, setLoading] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setLink(null);

    const res = await fetch("/api/auth/recovery-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim() }),
    });
    const data = (await res.json()) as { actionLink?: string; error?: string };

    if (!res.ok) {
      setError(data.error ?? "Unable to generate the link.");
    } else {
      setLink(data.actionLink ?? null);
    }
    setLoading(false);
  }

  return (
    <div className={cn(compact ? "rounded-lg border border-zinc-200 bg-zinc-50/80 p-4" : "sttns-card", className)}>
      <div className="mb-2 flex items-center gap-2">
        <Link2 className="h-4 w-4 text-sttns-accent" />
        <h3 className={cn("font-display font-bold", compact && "text-sm")}>
          No-email reset link
        </h3>
      </div>
      <p className="text-sm text-sttns-muted">
        Bypass the Supabase limit (~4 emails/hour). No email is sent — copy the link for the
        user (valid for about 1 hour, <strong>single use</strong>).
      </p>
      <p className="mt-2 text-xs text-amber-800">
        Open the link immediately in the browser — valid for about 1 hour, one-time use.
      </p>

      <form onSubmit={generate} className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="sttns-label">User email</label>
          <input
            type="email"
            required
            className="sttns-input mt-1"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
          />
        </div>
        <button type="submit" disabled={loading} className="sttns-btn-secondary shrink-0">
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Generate link
        </button>
      </form>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {link && (
        <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
          <p className="text-xs font-bold text-emerald-900">Link to share</p>
          <code className="mt-2 block break-all text-xs text-slate-800">{link}</code>
          <button
            type="button"
            className="mt-2 text-xs font-semibold text-sttns-accent hover:underline"
            onClick={() => navigator.clipboard.writeText(link)}
          >
            Copy link
          </button>
        </div>
      )}
    </div>
  );
}
