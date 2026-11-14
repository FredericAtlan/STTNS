import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDefaultProjectSlug } from "@/lib/sttns/access";

/** Raccourci global → Hub Aide du projet courant */
export default async function HelpRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = await resolveDefaultProjectSlug(user.id);
  redirect(`/projects/${slug}/help`);
}
