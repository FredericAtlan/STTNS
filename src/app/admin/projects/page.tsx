import Link from "next/link";
import { fetchAdminProjects } from "@/lib/sttns/adminData";
import { projectHomePath } from "@/lib/sttns/paths";

export default async function AdminProjectsPage() {
  const projects = await fetchAdminProjects();

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-xl font-bold">Projects</h2>
          <p className="mt-1 text-sm text-sttns-muted">
            Admin view — members and invites per project.
          </p>
        </div>
        <Link href="/projects/new" className="sttns-btn-primary text-sm">
          New project
        </Link>
      </header>

      <div className="sttns-card p-0">
        <div className="sttns-scroll-x">
        <table className="w-full min-w-[480px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase text-sttns-muted">
              <th className="px-4 py-3">Project</th>
              <th className="px-4 py-3">Slug</th>
              <th className="px-4 py-3 text-center">Members</th>
              <th className="px-4 py-3 text-center">Invites</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {projects.map((p) => (
              <tr key={p.id} className="border-b border-slate-100">
                <td className="px-4 py-3 font-semibold">{p.name}</td>
                <td className="px-4 py-3 font-mono text-xs">{p.slug}</td>
                <td className="px-4 py-3 text-center">{p.member_count}</td>
                <td className="px-4 py-3 text-center">
                  {p.pending_invites > 0 ? (
                    <span className="font-bold text-amber-700">{p.pending_invites}</span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/projects/${p.slug}/settings?tab=team`}
                      className="text-xs font-semibold text-sttns-accent hover:underline"
                    >
                      Paramètres
                    </Link>
                    <Link
                      href={projectHomePath(p.slug)}
                      className="text-xs font-semibold text-sttns-muted hover:underline"
                    >
                      Open
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
