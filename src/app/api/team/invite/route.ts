import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isPlatformAdmin } from "@/lib/sttns/auth";
import { isProjectCeoAdmin } from "@/lib/sttns/access";
import { sanitizeInviteRoles } from "@/lib/sttns/invites";

function appOrigin(request: Request) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    new URL(request.url).origin
  );
}

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

  const body = (await request.json()) as {
    email?: string;
    projectId?: string;
    projectName?: string;
    roles?: string[];
  };

  const email = body.email?.trim().toLowerCase();
  const projectId = body.projectId;
  const roles = sanitizeInviteRoles(body.roles ?? ["expert"]);

  if (!email) {
    return NextResponse.json({ error: "Email requis" }, { status: 400 });
  }
  if (!projectId) {
    return NextResponse.json({ error: "projectId requis" }, { status: 400 });
  }

  const canInvite =
    isPlatformAdmin(profile) || (await isProjectCeoAdmin(projectId, user.id));
  if (!canInvite) {
    return NextResponse.json(
      { error: "Réservé au CEO du projet ou à l'administrateur plateforme." },
      { status: 403 }
    );
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origin = appOrigin(request);
  const redirectTo = `${origin}/auth/callback`;

  await supabase
    .from("sttns_project_invites")
    .update({ status: "cancelled" })
    .eq("project_id", projectId)
    .eq("email", email)
    .eq("status", "pending");

  const { error: inviteRowErr } = await supabase.from("sttns_project_invites").insert({
    project_id: projectId,
    email,
    roles,
    invited_by: user.id,
    status: "pending",
  });

  if (inviteRowErr) {
    return NextResponse.json({ error: inviteRowErr.message }, { status: 500 });
  }

  if (!serviceKey || !url) {
    return NextResponse.json({
      fallback: true,
      message: `Invitation enregistrée pour ${email} (${roles.join(", ")}). Partagez ${origin}/login — service_role absent pour l'email automatique.`,
    });
  }

  const admin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: listData } = await admin.auth.admin.listUsers({ perPage: 1000 });
  const authUser = listData.users.find((u) => u.email?.toLowerCase() === email);

  if (authUser) {
    await admin.rpc("sttns_apply_pending_invites", {
      p_user_id: authUser.id,
      p_email: email,
    });

    const invited = !authUser.email_confirmed_at;
    return NextResponse.json({
      ok: true,
      alreadyExists: true,
      message: invited
        ? `${email} invité — rôles ${roles.join(", ")} seront appliqués à l'activation du compte.`
        : `${email} ajouté au projet avec rôles : ${roles.join(", ")}.`,
    });
  }

  const { data, error } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo,
    data: {
      invited_to: body.projectName ?? "STTNS",
      project_id: projectId,
      invite_roles: roles,
    },
  });

  if (error) {
    return NextResponse.json({
      fallback: true,
      error: error.message,
      message: `Invitation DB enregistrée (${roles.join(", ")}). Email Supabase : ${error.message}. Redirect : ${redirectTo}`,
    });
  }

  return NextResponse.json({
    ok: true,
    userId: data.user?.id,
    redirectTo,
    message:
      `Invitation envoyée à ${email} — rôles ${roles.join(", ")} appliqués automatiquement à l'inscription. ` +
      `Vérifiez les spams si besoin.`,
  });
}
