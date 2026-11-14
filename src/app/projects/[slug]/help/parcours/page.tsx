import { HelpSectionBody } from "@/components/help/HelpSectionBody";
import { getParcoursHelpSection } from "@/lib/sttns/helpPlaybook";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HelpParcoursPage({ params }: Props) {
  const { slug } = await params;
  return (
    <HelpSectionBody
      section={getParcoursHelpSection()}
      chapterSlug="parcours"
      projectSlug={slug}
    />
  );
}
