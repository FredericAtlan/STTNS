import { redirect } from "next/navigation";
import { projectHomePath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

/** Redirige vers la Matrice Besoins. */
export default async function ProjectSummaryRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(projectHomePath(slug));
}
