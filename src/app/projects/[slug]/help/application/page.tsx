import { HelpSectionBody } from "@/components/help/HelpSectionBody";
import { getApplicationHelpSection } from "@/lib/sttns/helpPlaybook";
import { getProjectBySlug } from "@/lib/sttns/projects";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function HelpApplicationPage({ params }: Props) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug);

  return (
    <HelpSectionBody
      section={getApplicationHelpSection(project.name)}
      chapterSlug="application"
      projectSlug={slug}
    />
  );
}
