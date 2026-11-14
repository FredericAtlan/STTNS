import { redirect } from "next/navigation";
import { legacyPersonaRedirectPath } from "@/lib/sttns/legacyPersonasDeprecation";

/**
 * @deprecated Vocabulaire tiers/jobs legacy UI — Étape B : redirect → `/why`.
 * Tables `sttns_persona_*_defs` conservées (pont segment Why).
 */
export default async function LegacyPersonaVocabularyRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(legacyPersonaRedirectPath(slug));
}
