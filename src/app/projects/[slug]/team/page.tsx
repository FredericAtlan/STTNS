import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

/** @deprecated — équipe regroupée dans Paramètres */
export default async function TeamPage({ params }: Props) {
  const { slug } = await params;
  redirect(`/projects/${slug}/settings?tab=team`);
}
