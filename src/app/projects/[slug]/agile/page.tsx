import { redirect } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function AgilePage({ params }: Props) {
  const { slug } = await params;
  redirect(`/projects/${slug}/kanban`);
}
