import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { isLocalLoginEnabled } from "@/lib/sttns/localLogin";

export const dynamic = "force-dynamic";

/**
 * En local (STTNS_LOCAL_LOGIN=1 + Supabase et requête sur localhost) : pas d'écran de mot de passe,
 * entrée directe. `/login?local=off` affiche quand même l'écran normal.
 */
export default function LoginLayout({ children }: { children: React.ReactNode }) {
  const raw = headers().get("x-sttns-url");
  if (raw) {
    const url = new URL(raw);
    if (isLocalLoginEnabled(url.href) && url.searchParams.get("local") !== "off") {
      const next = url.searchParams.get("next");
      redirect(`/auth/local-login${next ? `?next=${encodeURIComponent(next)}` : ""}`);
    }
  }
  return children;
}
