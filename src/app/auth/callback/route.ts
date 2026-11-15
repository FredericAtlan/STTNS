import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { applyPendingInvitesForUser } from "@/lib/sttns/invites";
import { safeInternalPath } from "@/lib/security/urls";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const safeNext = safeInternalPath(searchParams.get("next"));

  if (!code) {
    return NextResponse.redirect(
      `${origin}/login?error=${encodeURIComponent("Lien de connexion incomplet — regénérez le lien.")}`
    );
  }

  const redirectUrl = `${origin}${safeNext}`;
  let response = NextResponse.redirect(redirectUrl);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return NextResponse.redirect(
      `${origin}/auth/reset-password?error=${encodeURIComponent(
        "Lien expiré ou déjà utilisé. Demandez un nouveau lien à l'admin."
      )}`
    );
  }

  const user = data.user;
  if (user?.email && safeNext !== "/auth/reset-password") {
    await applyPendingInvitesForUser(user.id, user.email);
  }

  return response;
}
