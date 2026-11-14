import { redirect } from "next/navigation";
import { featuresHubPath } from "@/lib/sttns/paths";

interface Props {
  params: Promise<{ slug: string; id: string }>;
}

export default async function EditModulePage({ params }: Props) {
  const { slug } = await params;
  redirect(featuresHubPath(slug));
}
