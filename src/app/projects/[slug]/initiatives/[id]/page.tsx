import { redirect } from "next/navigation";
import { featuresPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ edit?: string; from?: string }>;
}

export default async function InitiativeDetailRedirect({ params, searchParams }: Props) {
  const { slug, id } = await params;
  const { edit, from } = await searchParams;
  const q = new URLSearchParams();
  if (edit) q.set("edit", edit);
  if (from) q.set("from", from);
  const qs = q.toString();
  redirect(`${featuresPath(slug, id)}${qs ? `?${qs}` : ""}`);
}
