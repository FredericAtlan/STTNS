import type { ProjectSettingsAuditRow } from "@/lib/sttns/projectSettingsAudit";

const FIELD_LABELS: Record<string, string> = {
  name: "Nom du projet",
  description: "Description",
  workflow_settings: "Règles du workflow",
  member_add: "Ajout membre",
  member_invite: "Invitation",
  member_invite_cancel: "Invitation retirée",
  member_project_role: "Rôle squad",
  archive: "Archivage",
};

export function ProjectSettingsAuditPanel({
  entries,
}: {
  entries: ProjectSettingsAuditRow[];
}) {
  return (
    <section className="sttns-card space-y-3">
      <div>
        <h3 className="text-sm font-semibold text-zinc-900">Historique des paramètres</h3>
        <p className="mt-1 text-xs text-zinc-500">
          Journal des changements Général, Workflow et Équipe.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-zinc-500">Aucune modification enregistrée pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-zinc-100 border border-zinc-100 rounded-lg overflow-hidden">
          {entries.map((entry) => (
            <li key={entry.id} className="px-4 py-3 text-sm bg-white">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-zinc-900">
                  {FIELD_LABELS[entry.field_name] ?? entry.field_name}
                </span>
                <time className="text-xs text-zinc-400">
                  {new Date(entry.created_at).toLocaleString("fr-FR")}
                </time>
              </div>
              <p className="mt-1 text-xs text-zinc-500">
                Par {entry.profile?.full_name ?? entry.profile?.email ?? "—"}
              </p>
              {(entry.old_value || entry.new_value) && (
                <p className="mt-1 text-xs text-zinc-600 font-mono break-all">
                  {entry.old_value ? `${entry.old_value} → ` : ""}
                  {entry.new_value ?? "—"}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
