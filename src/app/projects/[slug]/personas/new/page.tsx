import { redirect } from "next/navigation";
import { legacyPersonaRedirectPath } from "@/lib/sttns/legacyPersonasDeprecation";

/**
 * @deprecated Création legacy DRAFT — Étape B : redirect → `/why?tab=persona`.
 */
export default async function LegacyPersonaNewRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(legacyPersonaRedirectPath(slug, "new"));
}
