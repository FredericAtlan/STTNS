import { HelpSectionBody } from "@/components/help/HelpSectionBody";
import { getScoringHelpSection } from "@/lib/sttns/helpPlaybook";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HelpScoringPage({ params }: Props) {
  const { slug } = await params;
  return (
    <HelpSectionBody
      section={getScoringHelpSection()}
      chapterSlug="scoring"
      projectSlug={slug}
    />
  );
}
