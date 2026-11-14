import { redirect } from "next/navigation";
import { featuresPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NewInitiativeRedirect({ params }: Props) {
  const { slug } = await params;
  redirect(featuresPath(slug, "new"));
}
