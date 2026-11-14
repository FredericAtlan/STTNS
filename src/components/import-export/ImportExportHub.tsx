"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import JSZip from "jszip";
import {
  ArrowDownUp,
  Check,
  Download,
  ExternalLink,
  FileArchive,
  Loader2,
  Upload,
} from "lucide-react";
import {
  exportProjectPackAction,
  importProjectPackAction,
} from "@/app/projects/[slug]/import-export/actions";
import { CsvImportModal } from "@/components/csv/CsvImportModal";
import {
  ALL_EXPORT_ENTITY_KEYS,
  EXPORT_ENTITY_CATALOG,
  type ExportEntityKey,
} from "@/lib/sttns/importExportCatalog";
import { parseSpinePackZip } from "@/lib/sttns/importExportPackParse";
import type { ImportMode } from "@/lib/sttns/types";
import { cn } from "@/lib/utils";

type CountKey = ExportEntityKey | "jtbd_solves" | "feature_context";

type Props = {
  projectId: string;
  projectSlug: string;
  projectName: string;
  canEdit: boolean;
  initialCounts: Partial<Record<CountKey, number>>;
};

const PRESETS: { id: string; label: string; keys: ExportEntityKey[] }[] = [
  { id: "full", label: "Pack complet", keys: [...ALL_EXPORT_ENTITY_KEYS] },
  {
    id: "delivery",
    label: "Livraison Spine",
    keys: ["cycles", "epics", "features", "stories", "tasks"],
  },
  { id: "why", label: "Matrice Besoins", keys: ["why"] },
  { id: "strategy", label: "Stratégie", keys: ["why", "cycles", "epics", "features"] },
];

function countForEntity(
  key: ExportEntityKey,
  counts: Partial<Record<CountKey, number>>
): number | null {
  const n = counts[key];
  return typeof n === "number" ? n : null;
}

export function ImportExportHub({
  projectId,
  projectSlug,
  projectName,
  canEdit,
  initialCounts,
}: Props) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<ExportEntityKey>>(
    () => new Set(ALL_EXPORT_ENTITY_KEYS)
  );
  const [exporting, setExporting] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [status, setStatus] = useState<{ tone: "ok" | "err"; message: string } | null>(null);
  const [lastManifest, setLastManifest] = useState<string | null>(null);
  const [dropFile, setDropFile] = useState<File | null>(null);

  const selectedList = useMemo(() => Array.from(selected), [selected]);

  const toggle = (key: ExportEntityKey) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyPreset = (keys: ExportEntityKey[]) => {
    setSelected(new Set(keys));
  };

  const handleExport = async () => {
    if (selectedList.length === 0) {
      setStatus({ tone: "err", message: "Sélectionnez au moins un objet à exporter." });
      return;
    }
    setExporting(true);
    setStatus(null);
    try {
      const res = await exportProjectPackAction(projectId, selectedList);
      if (!res.ok) throw new Error(res.error);

      const zip = new JSZip();
      for (const [path, content] of Object.entries(res.files)) {
        zip.file(path, content);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const dateStr = new Date().toISOString().split("T")[0];
      const safeName = projectName.replace(/\s+/g, "_");
      link.download = `${safeName}_STTNS_Spine_${dateStr}.zip`;
      link.click();
      URL.revokeObjectURL(url);

      setLastManifest(
        `${res.manifest.entities.length} domaines · ${res.manifest.files.length} fichiers · ${res.manifest.exportDate.slice(0, 10)}`
      );
      setStatus({ tone: "ok", message: "Archive générée — téléchargement lancé." });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Export impossible.";
      setStatus({ tone: "err", message });
    } finally {
      setExporting(false);
    }
  };

  const runImport = useCallback(
    async (mode: ImportMode, file: File) => {
      if (!canEdit) {
        throw new Error("Accès lecture seule — import réservé aux éditeurs du projet.");
      }
      const pack = await parseSpinePackZip(file);
      const res = await importProjectPackAction(projectId, projectSlug, mode, pack);
      if (!res.ok) throw new Error(res.error);
      setStatus({
        tone: "ok",
        message:
          mode === "replace"
            ? "Import terminé (remplacement appliqué là où le pack contenait des données)."
            : "Import terminé — fusion avec le projet.",
      });
      router.refresh();
    },
    [canEdit, projectId, projectSlug, router]
  );

  const onDrop = (file: File) => {
    if (!canEdit) return;
    if (!file.name.toLowerCase().endsWith(".zip")) {
      setStatus({ tone: "err", message: "Déposez une archive .zip STTNS." });
      return;
    }
    setDropFile(file);
    setImportOpen(true);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_minmax(280px,340px)]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Objets du projet</h2>
            <p className="text-xs text-muted-foreground">
              Cochez ce que l&apos;archive doit contenir. Les liaisons suivent les UUID (
              <code className="text-[11px]">parent_id</code>, contexte JTBD, solves).
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="sttns-btn-secondary sttns-btn-sm"
              onClick={() => applyPreset(ALL_EXPORT_ENTITY_KEYS)}
            >
              Tout
            </button>
            <button
              type="button"
              className="sttns-btn-secondary sttns-btn-sm"
              onClick={() => setSelected(new Set())}
            >
              Aucun
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => applyPreset(p.keys)}
              className="rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground transition hover:border-zinc-400"
            >
              {p.label}
            </button>
          ))}
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {EXPORT_ENTITY_CATALOG.map((entry) => {
            const checked = selected.has(entry.key);
            const count = countForEntity(entry.key, initialCounts);
            const surfaceHref = `/projects/${projectSlug}${entry.surface}`;

            return (
              <li key={entry.key}>
                <label
                  className={cn(
                    "sttns-card flex cursor-pointer gap-3 p-4 transition",
                    checked ? "ring-1 ring-zinc-400/80" : "opacity-90 hover:opacity-100"
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 shrink-0 accent-zinc-900"
                    checked={checked}
                    onChange={() => toggle(entry.key)}
                  />
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">{entry.label}</span>
                      {count != null && (
                        <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 text-[11px] tabular-nums text-muted-foreground">
                          {count}
                        </span>
                      )}
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">
                      {entry.description}
                    </p>
                    <Link
                      href={surfaceHref}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 hover:text-zinc-900"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Ouvrir la page
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </label>
              </li>
            );
          })}
        </ul>

        <p className="text-xs text-muted-foreground">
          Export / import ciblés par surface :{" "}
          <Link href={`/projects/${projectSlug}/why`} className="font-medium underline-offset-2 hover:underline">
            Matrice Besoins
          </Link>
          {" · "}
          <Link
            href={`/projects/${projectSlug}/discovery`}
            className="font-medium underline-offset-2 hover:underline"
          >
            Sessions Discovery (JSON)
          </Link>
        </p>
      </section>

      <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
        <div className="sttns-card space-y-4 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <ArrowDownUp className="h-4 w-4 text-zinc-600" />
            Actions
          </div>

          <button
            type="button"
            disabled={exporting || selectedList.length === 0}
            onClick={() => void handleExport()}
            className="sttns-btn-primary sttns-btn-md flex w-full items-center justify-center gap-2"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Exporter la sélection ({selectedList.length})
          </button>

          {canEdit ? (
            <>
              <button
                type="button"
                onClick={() => setImportOpen(true)}
                className="sttns-btn-secondary sttns-btn-md flex w-full items-center justify-center gap-2"
              >
                <Upload className="h-4 w-4" />
                Importer une archive
              </button>

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const file = e.dataTransfer.files?.[0];
                  if (file) void onDrop(file);
                }}
                className={cn(
                  "rounded-lg border border-dashed px-4 py-8 text-center text-xs transition",
                  dragOver
                    ? "border-zinc-500 bg-zinc-50"
                    : "border-border text-muted-foreground"
                )}
              >
                <FileArchive className="mx-auto mb-2 h-6 w-6 text-zinc-400" />
                Glissez un pack <strong className="font-medium">.zip</strong> ici
                <br />
                <span className="text-[11px]">Format STTNS Spine v2 ou ZIP Matrice Besoins</span>
              </div>
            </>
          ) : (
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Rôle lecteur : export autorisé, import désactivé.
            </p>
          )}

          {status && (
            <div
              className={cn(
                "flex items-start gap-2 rounded-md px-3 py-2 text-xs",
                status.tone === "ok"
                  ? "bg-emerald-50 text-emerald-900"
                  : "bg-destructive/10 text-destructive"
              )}
            >
              {status.tone === "ok" && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
              {status.message}
            </div>
          )}

          {lastManifest && (
            <p className="text-[11px] text-muted-foreground">Dernier export : {lastManifest}</p>
          )}
        </div>

        <div className="sttns-card space-y-2 p-4 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Bonnes pratiques</p>
          <ul className="list-inside list-disc space-y-1 leading-relaxed">
            <li>Conservez les colonnes <code className="text-[10px]">id</code> pour préserver les liens.</li>
            <li>Ordre conseillé à l&apos;import : cycles → Why → epics → features → stories → tasks.</li>
            <li>Le mode fusion met à jour par UUID ; remplacement efface les domaines concernés.</li>
          </ul>
        </div>
      </aside>

      <CsvImportModal
        isOpen={importOpen}
        onClose={() => {
          setImportOpen(false);
          setDropFile(null);
        }}
        onConfirm={runImport}
        title="Importer un pack STTNS"
        accept=".zip"
        initialFile={dropFile}
      />
    </div>
  );
}
