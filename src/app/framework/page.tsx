import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDefaultProjectSlug } from "@/lib/sttns/access";

export default async function FrameworkRedirectPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const slug = await resolveDefaultProjectSlug(user.id);
  redirect(`/projects/${slug}/framework`);
}
