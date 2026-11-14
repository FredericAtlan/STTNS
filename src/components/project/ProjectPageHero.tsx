import type { ReactNode } from "react";
import { SttnsPageHero } from "@/components/layout/sttns-ui";
import type { SttnsContextHelpContent } from "@/lib/sttns/sttnsContext";

type ProjectPageHeroProps = {
  /** Fil d’Ariane court — ex. `Projet · {slug}` (une seule fois, au-dessus du H1). */
  eyebrow?: string;
  /** Titre de page unique (H1). Ne pas le répéter dans une carte enfant. */
  title: ReactNode;
  /** Une phrase de rôle — sous le H1, pas un second titre. */
  description?: ReactNode;
  /** Aide « ? » collée au H1 uniquement (pas de second help dans le corps). */
  contextHelp?: SttnsContextHelpContent;
  actions?: ReactNode;
  children?: ReactNode;
  count?: number | string;
};

export function ProjectPageHero(props: ProjectPageHeroProps) {
  return <SttnsPageHero {...props} />;
}
