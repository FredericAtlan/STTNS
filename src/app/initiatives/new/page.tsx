import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDefaultProjectSlug } from "@/lib/sttns/access";
import { featuresPath } from "@/lib/sttns/paths";

export default async function GlobalNewInitiativeRedirect() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const slug = await resolveDefaultProjectSlug(user.id);
  redirect(featuresPath(slug, "new"));
}
