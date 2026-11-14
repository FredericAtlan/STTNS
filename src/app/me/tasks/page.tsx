import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { fetchOpenTasks, taskTargetPath } from "@/lib/sttns/tasks";
import { resolveDefaultProjectSlug } from "@/lib/sttns/access";
import type { SttnsUserTask } from "@/types/sttns";
import { ChevronRight } from "lucide-react";

export default async function MyTasksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const tasks = (await fetchOpenTasks(user.id, 50)) as SttnsUserTask[];
  const fallbackSlug = await resolveDefaultProjectSlug(user.id);

  return (
    <div>
      <header className="mb-8">
        <Link href="/me" className="text-sm font-semibold text-sttns-accent hover:underline">
          ← My account
        </Link>
        <h2 className="mt-2 font-display text-3xl font-extrabold">My tasks</h2>
        <p className="mt-1 text-sm text-sttns-muted">
          Reviews and decisions waiting for you across projects.
        </p>
      </header>

      <ul className="space-y-3">
        {tasks.map((t) => {
          const slug = t.project?.slug ?? fallbackSlug;
          const href = taskTargetPath(slug, t.asset_type, t.asset_id, t.task_type);
          return (
            <li key={t.id}>
              <Link
                href={href}
                className="sttns-card flex items-center justify-between gap-3 transition hover:border-emerald-300"
              >
                <div>
                  <p className="text-xs font-bold uppercase text-sttns-muted">
                    {t.project?.name ?? "Project"}
                  </p>
                  <p className="font-semibold text-slate-900">{t.title}</p>
                  <p className="text-xs text-sttns-muted">{t.task_type.replace(/_/g, " ")}</p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-sttns-muted" />
              </Link>
            </li>
          );
        })}
        {tasks.length === 0 && (
          <li className="sttns-card text-center text-sm text-sttns-muted">
            No open tasks — you&apos;re all caught up.
          </li>
        )}
      </ul>
    </div>
  );
}
