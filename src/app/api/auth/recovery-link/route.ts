import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/sttns/auth";

function appOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin
  );
}

/**
 * Platform admin: generate a password recovery link without sending email
 * (bypasses Supabase built-in email rate limit).
 */
export async function POST(request: Request) {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("sttns_profiles")
    .select("platform_role")
    .eq("id", user.id)
    .single();

  if (!isPlatformAdmin(profile)) {
    return NextResponse.json({ error: "Réservé à l'administrateur plateforme." }, { status: 403 });
  }

  const body = (await request.json()) as { email?: string };
  const email = body.email?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!serviceKey || !url) {
    return NextResponse.json(
      { error: "SUPABASE_SERVICE_ROLE_KEY requise pour générer un lien." },
      { status: 503 }
    );
  }

  const origin = appOrigin(request);
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent("/auth/reset-password")}`;

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data, error } = await admin.auth.admin.generateLink({
    type: "recovery",
    email,
    options: { redirectTo },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const actionLink =
    data.properties?.action_link ??
    (data as { action_link?: string }).action_link ??
    null;

  if (!actionLink) {
    return NextResponse.json({ error: "Lien non généré — vérifiez que l'email existe." }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    actionLink,
    message:
      "Lien de réinitialisation généré (aucun email envoyé). Copiez-le et transmettez-le à l'utilisateur — valable ~1 h.",
  });
}
