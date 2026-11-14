"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { authErrorMessage, isEmailRateLimitError } from "@/lib/sttns/authErrors";
import { SttnsLogo } from "@/components/brand/SttnsLogo";
import { PasswordInput } from "@/components/ui/PasswordInput";

type AuthMode = "login" | "signup" | "forgot";

function resetRedirectUrl() {
  if (typeof window === "undefined") return "http://localhost:3001/auth/callback?next=/auth/reset-password";
  return `${window.location.origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err" | "info"; text: string } | null>(
    null
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const supabase = createClient();

    if (mode === "forgot") {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: resetRedirectUrl(),
      });
      if (error) {
        setMessage({
          type: isEmailRateLimitError(error.message) ? "info" : "err",
          text: authErrorMessage(error.message),
        });
      } else {
        setMessage({
          type: "ok",
          text: "If the account exists, an email has been sent. Check your inbox and spam folder, then follow the link to choose a new password.",
        });
      }
      setLoading(false);
      return;
    }

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({ email, password });
      if (error) {
        setMessage({ type: "err", text: authErrorMessage(error.message) });
      } else {
        setMessage({
          type: "ok",
          text: "Account created — you can sign in now.",
        });
        setMode("login");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setMessage({ type: "err", text: authErrorMessage(error.message) });
      } else {
        router.push("/");
        router.refresh();
      }
    }
    setLoading(false);
  }

  const title =
    mode === "forgot"
      ? "Forgot password"
      : mode === "signup"
        ? "Create an account"
        : "Sign in";

  return (
    <div className="flex min-h-screen items-center justify-center bg-sttns-cream px-4">
      <div className="w-full max-w-md sttns-card">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <SttnsLogo size={56} />
          </div>
          <h1 className="font-display text-2xl font-extrabold">
            Straight To The{" "}
            <span className="text-sttns-accent">North Star</span>
          </h1>
          <p className="mt-2 text-sm text-sttns-muted">{title}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="sttns-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              className="sttns-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="sttns-label" htmlFor="password">
                Password
              </label>
              <PasswordInput
                id="password"
                required
                minLength={6}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={setPassword}
              />
              {mode === "signup" && (
                <p className="mt-1 text-xs text-sttns-muted">Minimum 6 characters.</p>
              )}
            </div>
          )}

          {mode === "login" && (
            <div className="text-right">
              <button
                type="button"
                className="text-xs font-semibold text-sttns-accent hover:underline"
                onClick={() => {
                  setMode("forgot");
                  setMessage(null);
                }}
              >
                Forgot password?
              </button>
            </div>
          )}

          {message && (
            <p
              className={`rounded-lg px-3 py-2 text-sm ${
                message.type === "err"
                  ? "bg-red-50 text-red-700"
                  : message.type === "ok"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-amber-50 text-amber-800"
              }`}
            >
              {message.text}
            </p>
          )}

          <button type="submit" disabled={loading} className="sttns-btn-primary w-full">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {mode === "forgot"
              ? "Send reset link"
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <div className="mt-4 space-y-2 text-center text-sm">
          {mode === "forgot" ? (
            <button
              type="button"
              className="text-sttns-accent hover:underline"
              onClick={() => {
                setMode("login");
                setMessage(null);
              }}
            >
              ← Back to sign in
            </button>
          ) : (
            <button
              type="button"
              className="text-sttns-accent hover:underline"
              onClick={() => {
                setMode(mode === "login" ? "signup" : "login");
                setMessage(null);
              }}
            >
              {mode === "login"
                ? "First time here? Create a team account"
                : "Already have an account? Sign in"}
            </button>
          )}
        </div>

        {mode === "forgot" && (
          <div className="mt-4 space-y-3">
            <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
              <p>
                <strong>Supabase limit:</strong> about 4 auth emails/hour on the free plan. If you
                hit the limit, wait 1 hour or use the no-email link (admin).
              </p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 p-3 text-sm">
              <p className="font-semibold text-emerald-900">Facilitator / platform admin</p>
              <p className="mt-1 text-xs text-emerald-800">
                Generate a reset link <strong>without email</strong> to unblock a teammate.
              </p>
              <Link
                href={`/auth/recovery-link${email.trim() ? `?email=${encodeURIComponent(email.trim())}` : ""}`}
                className="mt-2 inline-flex text-xs font-bold text-sttns-accent hover:underline"
              >
                Open the no-email reset tool →
              </Link>
              <p className="mt-2 text-[10px] text-sttns-muted">
                Admin sign-in required — you will be redirected after sign-in.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
