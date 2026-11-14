import { redirect } from "next/navigation";
import { legacyPersonaRedirectPath } from "@/lib/sttns/legacyPersonasDeprecation";

/**
 * @deprecated Fiche persona DRAFT/READY — Étape B : redirect → `/why`.
 * L’UUID legacy n’est pas mappé vers Spine ici (Étape A).
 */
export default async function LegacyPersonaDetailRedirect({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const { slug } = await params;
  redirect(legacyPersonaRedirectPath(slug));
}
