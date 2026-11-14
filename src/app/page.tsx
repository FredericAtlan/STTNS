import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowUpRight, Plus } from "lucide-react";
import { SttnsButton, SttnsCard } from "@/components/layout/sttns-ui";
import { ProjectModeBadgeFromSettings } from "@/components/settings/ShapeUpModeBadge";
import { createClient } from "@/lib/supabase/server";
import { getAllProjects, getArchivedProjects } from "@/lib/sttns/projects";
import { projectHomePath } from "@/lib/sttns/paths";
import { unstable_noStore as noStore } from "next/cache";

export default async function GlobalDashboardPage({
  searchParams,
}: {
  searchParams?: { q?: string | string[] };
}) {
  noStore();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const rawQuery = searchParams?.q;
  const query = Array.isArray(rawQuery) ? rawQuery[0] : rawQuery;
  const normalizedQuery = query?.trim().toLowerCase() ?? "";

  const [projects, archivedProjects] = await Promise.all([
    getAllProjects(),
    getArchivedProjects(),
  ]);

  const visibleRows = projects.filter((project) => {
    if (!normalizedQuery) return true;
    const haystack = [
      project.name,
      project.slug,
      project.nsm_label ?? "",
    ]
      .join(" ")
      .toLowerCase();
    return haystack.includes(normalizedQuery);
  });

  return (
    <div className="sttns-page-stack max-w-5xl">
      <section className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-200/80 pb-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold tracking-tight text-zinc-900">
            Tous les projets
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
            Portefeuille des projets actifs. Les projets
            archivés ({archivedProjects.length}) restent accessibles via le menu Projet en haut.
          </p>
        </div>
        <SttnsButton href="/projects/new" variant="primary">
          <Plus className="h-4 w-4" />
          Nouveau projet
        </SttnsButton>
      </section>

      <section className="space-y-4">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-zinc-800">Projets actifs</h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {visibleRows.length} affiché{visibleRows.length > 1 ? "s" : ""} sur {projects.length}
            </p>
          </div>
        </div>

        {projects.length === 0 ? (
          <SttnsCard className="border-dashed p-8 text-center text-sm text-zinc-500">
            Aucun projet actif — créez le premier.
          </SttnsCard>
        ) : visibleRows.length === 0 ? (
          <SttnsCard className="border-dashed p-8 text-center text-sm text-zinc-500">
            Aucun projet ne correspond à « {query} ».
          </SttnsCard>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {visibleRows.map((project) => (
              <Link
                key={project.id}
                href={projectHomePath(project.slug)}
                className="group rounded-lg border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="truncate font-display text-base font-semibold text-zinc-900 group-hover:text-emerald-800">
                        {project.name}
                      </h3>
                      <ProjectModeBadgeFromSettings settings={project.settings} compact />
                    </div>
                    {project.nsm_label && (
                      <p className="mt-1 line-clamp-2 text-xs text-zinc-500">{project.nsm_label}</p>
                    )}
                  </div>
                  <ArrowUpRight className="mt-0.5 h-4 w-4 shrink-0 text-zinc-300 group-hover:text-emerald-700" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
