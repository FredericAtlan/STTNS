/**
 * @deprecated Shell pages catalogue Personas — routes redirigées vers `/why` (Étape B).
 */
import type { ReactNode } from "react";
import Link from "next/link";
import { ProjectPageHero } from "@/components/project/ProjectPageHero";
import { PersonaSummaryBlock } from "@/components/personas/PersonaSummaryBlock";
import { InlineEditableTitle } from "@/components/ui/InlineEditableTitle";
import { renamePersonaAction } from "@/app/projects/[slug]/personas/actions";

interface Props {
  projectId: string;
  personaId: string;
  projectSlug: string;
  title: string;
  /** Sous-titre ou badges sous le titre (fiche édition). */
  subtitle?: ReactNode;
  /** Résumé profil — visible sous les badges sur la fiche. */
  summary?: string | null;
  backHref: string;
  backLabel?: string;
  beforeForm?: ReactNode;
  readOnly?: boolean;
  children: ReactNode;
}

/** Enveloppe commune création + édition persona (hero, aide immersive, formulaire). */
export function PersonaPageShell({
  projectId,
  personaId,
  projectSlug,
  title,
  subtitle,
  summary,
  backHref,
  backLabel = "← Personas",
  beforeForm,
  readOnly,
  children,
}: Props) {
  return (
    <>
      <div className="space-y-8">
        <ProjectPageHero
          eyebrow={`Projet · ${projectSlug}`}
          title={
            personaId ? (
              <InlineEditableTitle
                initialTitle={title}
                readOnly={readOnly}
                onSave={renamePersonaAction.bind(null, personaId, projectId, projectSlug)}
              />
            ) : (
              title
            )
          }
          actions={
            <Link href={backHref} className="sttns-btn-secondary">
              {backLabel}
            </Link>
          }
        />

        {subtitle && <div className="-mt-4 flex flex-wrap items-center gap-2">{subtitle}</div>}

        {summary?.trim() && <PersonaSummaryBlock text={summary} className="-mt-2" />}

        {beforeForm}

        {children}
      </div>
    </>
  );
}
