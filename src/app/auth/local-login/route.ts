import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/security/urls";
import { isLocalLoginEnabled, localLoginEmail, publicRequestUrl } from "@/lib/sttns/localLogin";

export const dynamic = "force-dynamic";
// Next 14 met en cache les fetch (même POST) d'une route GET : chaque entrée doit créer une session neuve.
export const fetchCache = "force-no-store";

/** Ouvre une session sans mot de passe — uniquement en local (voir lib/sttns/localLogin). */
export async function GET(request: NextRequest) {
  const publicUrl = new URL(publicRequestUrl(request.url, request.headers.get("host")));
  if (!isLocalLoginEnabled(publicUrl.href)) {
    return new NextResponse("Not found", { status: 404 });
  }

  const origin = publicUrl.origin;
  const next = safeInternalPath(request.nextUrl.searchParams.get("next"));
  const fail = (message: string) =>
    NextResponse.redirect(`${origin}/login?local=off&error=${encodeURIComponent(message)}`);

  const admin = createServiceClient();
  if (!admin) return fail("Entrée locale : SUPABASE_SERVICE_ROLE_KEY manquante.");

  const email = localLoginEmail();
  const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email });
  if (linkError || !link?.properties?.hashed_token) {
    return fail(`Entrée locale : compte ${email} introuvable (lancer scripts/demo/seed-panier-local.sh).`);
  }

  const response = NextResponse.redirect(`${origin}${next}`);
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    }
  );

  const { error } = await supabase.auth.verifyOtp({ type: "magiclink", token_hash: link.properties.hashed_token });
  if (error) return fail(`Entrée locale : ${error.message}`);
  return response;
}
