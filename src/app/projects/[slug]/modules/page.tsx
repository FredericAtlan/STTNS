import { redirect } from "next/navigation";
import { featuresHubPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Redirection vers le hub features. */
export default async function ProjectModulesPage({ params }: Props) {
  const { slug } = await params;
  redirect(featuresHubPath(slug));
}
