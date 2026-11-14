import { redirect } from "next/navigation";
import { featuresHubPath } from "@/lib/sttns/featuresHub";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function FeaturesArbitrageRedirectPage({ params }: Props) {
  const { slug } = await params;
  redirect(featuresHubPath(slug, "arbitrage"));
}
