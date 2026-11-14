import { redirect } from "next/navigation";
import { featuresHubPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NewModulePage({ params }: Props) {
  const { slug } = await params;
  redirect(featuresHubPath(slug));
}
