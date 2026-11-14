import { HelpSectionBody } from "@/components/help/HelpSectionBody";
import { getFrameworkHelpSection } from "@/lib/sttns/helpPlaybook";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HelpFrameworkPage({ params }: Props) {
  const { slug } = await params;
  return (
    <HelpSectionBody
      section={getFrameworkHelpSection()}
      chapterSlug="framework"
      projectSlug={slug}
    />
  );
}
