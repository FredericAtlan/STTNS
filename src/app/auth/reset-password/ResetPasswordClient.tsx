"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/components/ui/PasswordInput";

export default function ResetPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlError = searchParams.get("error");

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(
    urlError ? { type: "err", text: urlError } : null
  );

  useEffect(() => {
    const supabase = createClient();

    async function establishSession() {
      const params = new URLSearchParams(window.location.search);
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (tokenHash && type === "recovery") {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (error) {
          setMessage({ type: "err", text: error.message });
        }
        window.history.replaceState({}, "", window.location.pathname);
      }

      const hash = window.location.hash.replace(/^#/, "");
      if (hash) {
        const hashParams = new URLSearchParams(hash);
        const accessToken = hashParams.get("access_token");
        const refreshToken = hashParams.get("refresh_token");
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) {
            setMessage({ type: "err", text: error.message });
          }
          window.history.replaceState({}, "", window.location.pathname);
        }
      }

      const { data } = await supabase.auth.getSession();
      setHasSession(!!data.session);
      setReady(true);
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setHasSession(!!session);
        setReady(true);
      }
    });

    establishSession();

    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setMessage({ type: "err", text: "Password must be at least 8 characters long." });
      return;
    }
    if (password !== confirm) {
      setMessage({ type: "err", text: "Passwords do not match." });
      return;
    }

    setLoading(true);
    setMessage(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setMessage({ type: "err", text: error.message });
      setLoading(false);
      return;
    }

    setMessage({ type: "ok", text: "Password updated. Redirecting…" });
    setTimeout(() => {
      router.push("/");
      router.refresh();
    }, 1200);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sttns-cream px-4">
      <div className="w-full max-w-md sttns-card">
        <div className="mb-6 text-center">
          <h1 className="font-display text-2xl font-extrabold">New password</h1>
          <p className="mt-2 text-sm text-sttns-muted">
            Choose a password for your STTNS account.
          </p>
        </div>

        {!ready && (
          <p className="flex items-center justify-center gap-2 text-sm text-sttns-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying link…
          </p>
        )}

        {ready && !hasSession && (
          <div className="space-y-4 text-center">
            <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
              {message?.text ??
                "This link is invalid or expired (valid for about 1 hour, single use). Ask an admin for a new link."}
            </p>
            <div className="space-y-2 text-sm">
              <Link href="/login" className="block font-semibold text-sttns-accent hover:underline">
                ← Back to sign in
              </Link>
              <p className="text-xs text-sttns-muted">
                Admin:{" "}
                <Link href="/auth/recovery-link" className="font-semibold text-sttns-accent hover:underline">
                  generate a new no-email link
                </Link>
              </p>
            </div>
          </div>
        )}

        {ready && hasSession && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="sttns-label" htmlFor="password">
                New password
              </label>
              <PasswordInput
                id="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={setPassword}
              />
            </div>
            <div>
              <label className="sttns-label" htmlFor="confirm">
                Confirm password
              </label>
              <PasswordInput
                id="confirm"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirm}
                onChange={setConfirm}
              />
            </div>

            {message && (
              <p
                className={`rounded-lg px-3 py-2 text-sm ${
                  message.type === "ok"
                    ? "bg-emerald-50 text-emerald-800"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </p>
            )}

            <button type="submit" disabled={loading} className="sttns-btn-primary w-full">
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Save password
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
