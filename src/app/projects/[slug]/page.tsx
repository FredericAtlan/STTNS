import { redirect } from "next/navigation";
import { projectHomePath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function ProjectIndexRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(projectHomePath(slug));
}
