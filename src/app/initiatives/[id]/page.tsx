import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { resolveDefaultProjectSlug } from "@/lib/sttns/access";
import { featuresPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string; from?: string }>;
}

export default async function GlobalInitiativeDetailRedirect({ params, searchParams }: Props) {
  const { id } = await params;
  const { edit, from } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const slug = await resolveDefaultProjectSlug(user.id);
  const q = new URLSearchParams();
  if (edit) q.set("edit", edit);
  if (from) q.set("from", from);
  const qs = q.toString();
  redirect(`${featuresPath(slug, id)}${qs ? `?${qs}` : ""}`);
}
