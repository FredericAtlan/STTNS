import { redirect } from "next/navigation";
import { legacyPersonaRedirectPath } from "@/lib/sttns/legacyPersonasDeprecation";

/**
 * @deprecated Catalogue DRAFT/READY — Étape B : redirect permanent → Matrice Besoins `/why`.
 * Tables `sttns_personas` conservées (FK aval).
 */
export default async function LegacyPersonasIndexRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(legacyPersonaRedirectPath(slug));
}
