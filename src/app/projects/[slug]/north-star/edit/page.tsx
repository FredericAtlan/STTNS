import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getProjectBySlug } from "@/lib/sttns/projects";
import { NorthStarMetricsForm } from "@/components/project/NorthStarMetricsForm";
import type { SttnsProjectMetric } from "@/types/sttns";

interface Props {
  params: Promise<{ slug: string }>;
}

export default async function NorthStarEditPage({ params }: Props) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const project = await getProjectBySlug(slug);

  const { data: metrics } = await supabase
    .from("sttns_project_metrics")
    .select("*")
    .eq("project_id", project.id)
    .order("sort_order");

  return (
    <div>
      <header className="mb-8">
        <Link
          href={`/projects/${slug}/nsm`}
          className="text-sm font-semibold text-sttns-accent hover:underline"
        >
          ← NSM
        </Link>
        <h2 className="mt-2 font-display text-3xl font-extrabold">
          Modifier · North Star &amp; Impact Metrics
        </h2>
      </header>
      <NorthStarMetricsForm
        project={project}
        metrics={(metrics ?? []) as SttnsProjectMetric[]}
        projectSlug={slug}
      />
    </div>
  );
}
