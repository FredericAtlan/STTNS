"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  Copy,
  Download,
  FolderOpen,
  Loader2,
  MoreHorizontal,
  Save,
  Trash2,
  Upload,
  Network,
} from "lucide-react";
import { SttnsModal } from "@/components/ui/SttnsModal";
import {
  deleteMyDiscoveryDraftAction,
  listMyDiscoveryDraftsAction,
  loadMyDiscoveryDraftAction,
  saveMyDiscoveryDraftAction,
  type DiscoveryCloudDraftSummary,
} from "@/app/projects/[slug]/discovery/actions";
import {
  buildDiscoveryDraftFile,
  discoveryCloudFingerprint,
  discoveryDraftDownloadFilename,
  isDiscoverySessionDirty,
  parseDiscoveryDraftFile,
  serializeDiscoveryDraftFile,
  type DiscoveryDraft,
  type DiscoveryDraftFile,
  type DiscoveryDraftMetadata,
} from "@/lib/sttns/discoveryMatrix";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  drafts: DiscoveryDraft[];
  metadata: DiscoveryDraftMetadata;
  /** Préremplissage auteur — exclu du dirty tant qu'il n'est pas modifié. */
  defaultAuthor?: string;
  /** false tant que sessionStorage n'est pas lu (évite mismatch hydratation). */
  hydrated: boolean;
  busy?: boolean;
  onMetadataChange: (patch: Partial<DiscoveryDraftMetadata>) => void;
  onReplaceSession: (drafts: DiscoveryDraft[], metadata: DiscoveryDraftMetadata) => void;
  onError: (message: string | null) => void;
  onSuccess: (message: string | null) => void;
  /** Ouvre la confirmation Vider (toolbar / menu Session). */
  onRequestClear?: () => void;
  /**
   * Charge l’exemple de liens (Feature→Epic Spine, Story→Feature Spine, chaîne nouvelle).
   * Appelé après confirmation si la session est dirty.
   */
  onLoadLinkExample?: () => void;
}

function formatDisplayDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

function copyTitleFrom(sourceTitle: string): string {
  const base = sourceTitle.trim() || "brouillon";
  if (/^copie de\s+/i.test(base)) return base;
  return `Copie de ${base}`;
}

type SyncState = "local" | "dirty" | "synced";

export function DiscoveryDraftManager({
  projectId,
  projectSlug,
  drafts,
  metadata,
  defaultAuthor = "",
  hydrated,
  busy = false,
  onMetadataChange,
  onReplaceSession,
  onError,
  onSuccess,
  onRequestClear,
  onLoadLinkExample,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionMenuRef = useRef<HTMLDivElement>(null);
  const [pendingImport, setPendingImport] = useState<DiscoveryDraftFile | null>(null);
  const [pendingWarnings, setPendingWarnings] = useState<string[]>([]);
  const [pendingCloudLoadId, setPendingCloudLoadId] = useState<string | null>(null);
  const [pendingLinkExample, setPendingLinkExample] = useState(false);
  const [cloudDraftId, setCloudDraftId] = useState<string | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const [cloudBaselineFp, setCloudBaselineFp] = useState<string | null>(null);
  const [cloudBusy, setCloudBusy] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [libraryRows, setLibraryRows] = useState<DiscoveryCloudDraftSummary[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [duplicateOpen, setDuplicateOpen] = useState(false);
  const [duplicateTitle, setDuplicateTitle] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [sessionMenuOpen, setSessionMenuOpen] = useState(false);
  const [conflictOpen, setConflictOpen] = useState(false);
  const [conflictServerUpdatedAt, setConflictServerUpdatedAt] = useState<string | null>(
    null
  );

  const replaceDirty = isDiscoverySessionDirty(drafts, metadata, defaultAuthor);
  const fingerprint = useMemo(
    () => discoveryCloudFingerprint(drafts, metadata),
    [drafts, metadata]
  );

  const syncState: SyncState = !cloudDraftId
    ? "local"
    : cloudBaselineFp != null && fingerprint !== cloudBaselineFp
      ? "dirty"
      : "synced";

  const disabled = busy || !hydrated || cloudBusy;

  const refreshLibrary = useCallback(async () => {
    setLibraryLoading(true);
    try {
      const res = await listMyDiscoveryDraftsAction(projectId);
      if (!res.ok) {
        onError(res.error);
        setLibraryRows([]);
        return;
      }
      setLibraryRows(res.drafts);
    } finally {
      setLibraryLoading(false);
    }
  }, [onError, projectId]);

  useEffect(() => {
    if (!hydrated) return;
    void refreshLibrary();
  }, [hydrated, refreshLibrary]);

  useEffect(() => {
    if (!sessionMenuOpen) return;
    function handlePointer(e: MouseEvent) {
      if (!sessionMenuRef.current?.contains(e.target as Node)) {
        setSessionMenuOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSessionMenuOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [sessionMenuOpen]);

  function markCloudSynced(id: string, updatedAt: string, nextFp?: string) {
    setCloudDraftId(id);
    setCloudUpdatedAt(updatedAt);
    setCloudBaselineFp(nextFp ?? fingerprint);
  }

  function clearCloudLink() {
    setCloudDraftId(null);
    setCloudUpdatedAt(null);
    setCloudBaselineFp(null);
  }

  function touchCreatedAt(patch: Partial<DiscoveryDraftMetadata>) {
    if (metadata.createdAt) {
      onMetadataChange(patch);
      return;
    }
    const touchesContent =
      (patch.title != null && patch.title.trim() !== "") ||
      (patch.author != null && patch.author.trim() !== "") ||
      (patch.comments != null && patch.comments.trim() !== "");
    if (touchesContent) {
      onMetadataChange({ ...patch, createdAt: new Date().toISOString() });
      return;
    }
    onMetadataChange(patch);
  }

  function applyImportedFile(
    file: DiscoveryDraftFile,
    warnings: string[],
    options?: {
      cloudId?: string | null;
      cloudUpdatedAt?: string | null;
      successPrefix?: string;
    }
  ) {
    onReplaceSession(file.content, file.metadata);
    const nextFp = discoveryCloudFingerprint(file.content, file.metadata);
    if (options?.cloudId) {
      setCloudDraftId(options.cloudId);
      setCloudUpdatedAt(options.cloudUpdatedAt ?? null);
      setCloudBaselineFp(nextFp);
    } else {
      clearCloudLink();
    }
    const count = file.content.length;
    const base =
      count === 0
        ? `${options?.successPrefix ?? "Brouillon chargé"} (aucune ligne).`
        : `${options?.successPrefix ?? "Brouillon chargé"} — ${count} ligne${count > 1 ? "s" : ""}.`;
    onSuccess(warnings.length ? `${base} ${warnings.join(" ")}` : base);
    onError(null);
    setPendingImport(null);
    setPendingWarnings([]);
    setPendingCloudLoadId(null);
  }

  function handleExport() {
    onError(null);
    setSessionMenuOpen(false);
    const file = buildDiscoveryDraftFile({
      projectId,
      projectSlug,
      metadata,
      drafts,
    });
    const blob = new Blob([serializeDiscoveryDraftFile(file)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = discoveryDraftDownloadFilename(
      file.metadata,
      projectSlug,
      file.metadata.exportedAt
    );
    a.click();
    URL.revokeObjectURL(url);
    onMetadataChange({
      createdAt: file.metadata.createdAt,
      exportedAt: file.metadata.exportedAt,
    });
    onSuccess(
      `Brouillon exporté (${file.content.length} ligne${file.content.length > 1 ? "s" : ""}).`
    );
  }

  async function handleSaveCloud(options?: { force?: boolean }) {
    onError(null);
    setCloudBusy(true);
    try {
      const res = await saveMyDiscoveryDraftAction({
        projectId,
        projectSlug,
        draftId: cloudDraftId,
        metadata,
        drafts,
        expectedUpdatedAt: options?.force ? null : cloudUpdatedAt,
      });
      if (!res.ok) {
        if ("conflict" in res && res.conflict) {
          setConflictServerUpdatedAt(res.serverUpdatedAt);
          setConflictOpen(true);
          return;
        }
        onError(res.error);
        return;
      }
      setConflictOpen(false);
      setConflictServerUpdatedAt(null);
      const nextTitle =
        metadata.title.trim() ||
        `Brouillon ${new Date().toLocaleString("fr-FR", {
          dateStyle: "short",
          timeStyle: "short",
        })}`;
      if (!metadata.title.trim()) {
        onMetadataChange({
          title: nextTitle,
          createdAt: metadata.createdAt ?? new Date().toISOString(),
        });
        markCloudSynced(
          res.id,
          res.updatedAt,
          discoveryCloudFingerprint(drafts, {
            ...metadata,
            title: nextTitle,
            createdAt: metadata.createdAt ?? new Date().toISOString(),
          })
        );
      } else {
        markCloudSynced(res.id, res.updatedAt);
      }
      onSuccess(
        cloudDraftId
          ? "Brouillon partagé mis à jour — visible par toute l’équipe."
          : "Brouillon partagé enregistré — visible par toute l’équipe."
      );
      await refreshLibrary();
    } finally {
      setCloudBusy(false);
    }
  }

  async function openLibrary() {
    onError(null);
    setSessionMenuOpen(false);
    setLibraryOpen(true);
    await refreshLibrary();
  }

  async function performLoadCloud(
    draftId: string,
    options?: { fork?: boolean; forkTitle?: string }
  ) {
    onError(null);
    setCloudBusy(true);
    try {
      const res = await loadMyDiscoveryDraftAction(projectId, projectSlug, draftId);
      if (!res.ok) {
        onError(res.error);
        return;
      }
      if (options?.fork) {
        const title =
          options.forkTitle?.trim() || copyTitleFrom(res.file.metadata.title);
        applyImportedFile(
          {
            ...res.file,
            metadata: {
              ...res.file.metadata,
              title,
              createdAt: new Date().toISOString(),
              exportedAt: null,
            },
          },
          [],
          {
            cloudId: null,
            successPrefix:
              "Copie chargée (non liée) — « Sauvegarder » créera un nouveau brouillon partagé",
          }
        );
      } else {
        applyImportedFile(res.file, [], {
          cloudId: draftId,
          cloudUpdatedAt: res.updatedAt,
          successPrefix: "Brouillon partagé chargé",
        });
      }
      setLibraryOpen(false);
      setConflictOpen(false);
    } finally {
      setCloudBusy(false);
    }
  }

  function requestLoadCloud(draftId: string) {
    if (!draftId || draftId === cloudDraftId) return;
    if (replaceDirty) {
      setPendingCloudLoadId(draftId);
      return;
    }
    void performLoadCloud(draftId);
  }

  async function handleDeleteCloud(draftId: string) {
    onError(null);
    setCloudBusy(true);
    try {
      const res = await deleteMyDiscoveryDraftAction(projectId, projectSlug, draftId);
      if (!res.ok) {
        onError(res.error);
        return;
      }
      setLibraryRows((prev) => prev.filter((row) => row.id !== draftId));
      if (cloudDraftId === draftId) clearCloudLink();
      onSuccess("Brouillon partagé supprimé.");
    } finally {
      setCloudBusy(false);
    }
  }

  function openDuplicateModal() {
    onError(null);
    setSessionMenuOpen(false);
    setDuplicateTitle(copyTitleFrom(metadata.title));
    setDuplicateOpen(true);
  }

  function confirmDuplicate() {
    const title = duplicateTitle.trim() || copyTitleFrom(metadata.title);
    clearCloudLink();
    onMetadataChange({
      title,
      createdAt: new Date().toISOString(),
      exportedAt: null,
    });
    setDuplicateOpen(false);
    onSuccess(
      "Copie prête — non liée au brouillon source. « Sauvegarder » créera un nouveau brouillon partagé."
    );
    onError(null);
  }

  async function handleFileChosen(fileList: FileList | null) {
    const file = fileList?.[0];
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (!file) return;

    onError(null);
    onSuccess(null);

    let parsedJson: unknown;
    try {
      const text = await file.text();
      parsedJson = JSON.parse(text) as unknown;
    } catch {
      onError("Fichier illisible — JSON attendu (.json).");
      return;
    }

    const result = parseDiscoveryDraftFile(parsedJson, {
      expectedProjectId: projectId,
      expectedProjectSlug: projectSlug,
    });

    if (!result.ok) {
      onError(result.error);
      return;
    }

    if (replaceDirty) {
      setPendingImport(result.file);
      setPendingWarnings(result.warnings);
      return;
    }

    applyImportedFile(result.file, result.warnings, { cloudId: null });
  }

  const selectValue =
    cloudDraftId && libraryRows.some((r) => r.id === cloudDraftId) ? cloudDraftId : "";

  const canDuplicate =
    drafts.length > 0 || Boolean(metadata.title.trim()) || Boolean(cloudDraftId);

  const identityTitle = metadata.title.trim() || "Session locale non liée";
  const identityAuthor = metadata.author.trim() || defaultAuthor.trim() || "—";

  const syncBadgeLabel =
    syncState === "local"
      ? "Session locale"
      : syncState === "dirty"
        ? "Modifications non sauvegardées"
        : "Synchronisé";

  const syncBadgeClass =
    syncState === "local"
      ? "border-border bg-muted text-muted-foreground"
      : syncState === "dirty"
        ? "border-warning/40 bg-warning/15 text-warning animate-pulse"
        : "border-success/40 bg-success/15 text-success";

  return (
    <div className="border-b border-border px-5 py-3">
      {/* Ligne identité compacte — toujours visible */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          className="sttns-btn-ghost sttns-btn-sm shrink-0"
          aria-expanded={detailsOpen}
          title={detailsOpen ? "Replier les détails" : "Afficher les détails"}
          onClick={() => setDetailsOpen((v) => !v)}
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 transition-transform",
              detailsOpen && "rotate-180"
            )}
          />
          <span className="sr-only">
            {detailsOpen ? "Replier les détails" : "Afficher les détails"}
          </span>
        </button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {identityTitle}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {identityAuthor}
            {cloudDraftId ? " · lié" : " · non lié"}
          </p>
        </div>

        <span
          title={syncBadgeLabel}
          aria-label={syncBadgeLabel}
          className={cn(
            "inline-flex shrink-0 items-center rounded-md border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide",
            syncBadgeClass
          )}
        >
          {syncState === "local"
            ? "Local"
            : syncState === "dirty"
              ? "Non sauvé"
              : "Sync"}
        </span>

        <button
          type="button"
          className="sttns-btn-secondary sttns-btn-sm"
          disabled={disabled}
          title={
            cloudDraftId
              ? "Mettre à jour le brouillon partagé (espace projet)"
              : "Enregistrer un nouveau brouillon partagé (espace projet)"
          }
          onClick={() => void handleSaveCloud()}
        >
          {cloudBusy ? (
            <Loader2 className="h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <Save className="h-4 w-4 shrink-0" />
          )}
          {cloudDraftId ? "Mettre à jour" : "Sauvegarder"}
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          className="hidden"
          onChange={(e) => void handleFileChosen(e.target.files)}
        />

        <div ref={sessionMenuRef} className="relative">
          <button
            type="button"
            className="sttns-btn-secondary sttns-btn-sm"
            disabled={disabled}
            aria-expanded={sessionMenuOpen}
            aria-haspopup="menu"
            title="Actions session"
            onClick={() => setSessionMenuOpen((v) => !v)}
          >
            <MoreHorizontal className="h-4 w-4 shrink-0" />
            Session
          </button>
          {sessionMenuOpen ? (
            <div
              role="menu"
              className="absolute right-0 z-40 mt-1 min-w-[12rem] rounded-lg border border-border bg-card py-1 shadow-lg"
            >
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                disabled={disabled}
                onClick={() => {
                  setSessionMenuOpen(false);
                  fileInputRef.current?.click();
                }}
              >
                <Download className="h-4 w-4 shrink-0" />
                Charger fichier
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                disabled={disabled}
                onClick={handleExport}
              >
                <Upload className="h-4 w-4 shrink-0" />
                Exporter
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted disabled:opacity-50"
                disabled={disabled || !canDuplicate}
                onClick={openDuplicateModal}
              >
                <Copy className="h-4 w-4 shrink-0" />
                Créer à partir de
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted disabled:opacity-50"
                disabled={disabled || !onLoadLinkExample}
                onClick={() => {
                  setSessionMenuOpen(false);
                  if (!onLoadLinkExample) return;
                  if (replaceDirty) {
                    setPendingLinkExample(true);
                    return;
                  }
                  onLoadLinkExample();
                }}
              >
                <Network className="h-4 w-4 shrink-0" />
                Exemple de liens
              </button>
              <button
                type="button"
                role="menuitem"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                disabled={disabled}
                onClick={() => void openLibrary()}
              >
                <FolderOpen className="h-4 w-4 shrink-0" />
                Gérer
              </button>
              {onRequestClear ? (
                <>
                  <div
                    className="my-1 border-t border-border"
                    role="separator"
                    aria-hidden
                  />
                  <button
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs font-medium text-destructive hover:bg-destructive/10"
                    disabled={disabled}
                    onClick={() => {
                      setSessionMenuOpen(false);
                      onRequestClear();
                    }}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                    Vider session
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {detailsOpen ? (
        <div className="mt-4 space-y-4">
          <div className="space-y-1.5">
            <label className="sttns-label" htmlFor="discovery-cloud-draft-select">
              Brouillon partagé (projet)
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <select
                id="discovery-cloud-draft-select"
                className="sttns-input max-w-xl"
                disabled={disabled || libraryLoading}
                value={selectValue}
                aria-label="Choisir un brouillon partagé"
                onChange={(e) => {
                  const next = e.target.value;
                  if (!next) return;
                  requestLoadCloud(next);
                }}
              >
                <option value="">
                  {libraryLoading
                    ? "Chargement…"
                    : libraryRows.length === 0
                      ? "Aucun brouillon partagé — Sauvegarder pour en créer"
                      : cloudDraftId
                        ? "— Session liée (choisir un autre) —"
                        : "— Choisir un brouillon partagé —"}
                </option>
                {libraryRows.map((row) => (
                  <option key={row.id} value={row.id}>
                    {row.title}
                    {row.author.trim() ? ` · ${row.author.trim()}` : ""}
                    {` · ${row.lineCount} ligne${row.lineCount > 1 ? "s" : ""}`}
                    {` · maj ${formatDisplayDate(row.updatedAt)}`}
                  </option>
                ))}
              </select>
              {libraryLoading ? (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">
              Liste partagée par toute l’équipe. Choisir charge la session (confirmation si
              brouillon local non sauvegardé). « Créer à partir de » détache la source pour
              un nouvel enregistrement.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="sttns-label" htmlFor="discovery-draft-title">
                Titre
              </label>
              <input
                id="discovery-draft-title"
                className="sttns-input"
                value={metadata.title}
                disabled={disabled}
                placeholder="Ex. Cadrage sprint 12"
                onChange={(e) => touchCreatedAt({ title: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <label className="sttns-label" htmlFor="discovery-draft-author">
                Auteur
              </label>
              <input
                id="discovery-draft-author"
                className="sttns-input"
                value={metadata.author}
                disabled={disabled}
                placeholder="Nom ou email"
                onChange={(e) => touchCreatedAt({ author: e.target.value })}
              />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="sttns-label" htmlFor="discovery-draft-comments">
                Commentaires
              </label>
              <textarea
                id="discovery-draft-comments"
                className="sttns-input min-h-[72px] resize-y"
                value={metadata.comments}
                disabled={disabled}
                placeholder="Contexte de réunion, hypothèses…"
                onChange={(e) => touchCreatedAt({ comments: e.target.value })}
              />
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground sm:col-span-2">
              <span>
                Créé :{" "}
                <span className="font-medium text-foreground">
                  {formatDisplayDate(metadata.createdAt)}
                </span>
              </span>
              <span>
                Dernier export :{" "}
                <span className="font-medium text-foreground">
                  {formatDisplayDate(metadata.exportedAt)}
                </span>
              </span>
            </div>
          </div>
        </div>
      ) : null}

      <SttnsModal
        open={pendingImport != null}
        onClose={() => {
          setPendingImport(null);
          setPendingWarnings([]);
        }}
        title="Remplacer la session en cours ?"
        eyebrow="Draft Manager"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => {
                setPendingImport(null);
                setPendingWarnings([]);
              }}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-primary"
              onClick={() => {
                if (!pendingImport) return;
                applyImportedFile(pendingImport, pendingWarnings, { cloudId: null });
              }}
            >
              Remplacer la session
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          La session actuelle contient{" "}
          <strong className="text-foreground">
            {drafts.length} ligne{drafts.length > 1 ? "s" : ""}
          </strong>
          {metadata.title.trim() ? (
            <>
              {" "}
              (« <span className="text-foreground">{metadata.title.trim()}</span> »)
            </>
          ) : null}
          . Charger ce fichier l&apos;écrasera définitivement (cache navigateur inclus).
        </p>
        {pendingImport && (
          <p className="mt-3 text-sm text-foreground">
            Fichier :{" "}
            <strong>
              {pendingImport.metadata.title.trim() || "Sans titre"}
            </strong>{" "}
            — {pendingImport.content.length} ligne
            {pendingImport.content.length > 1 ? "s" : ""}.
          </p>
        )}
        {pendingWarnings.length > 0 && (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-warning">
            {pendingWarnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        )}
      </SttnsModal>

      <SttnsModal
        open={pendingLinkExample}
        onClose={() => setPendingLinkExample(false)}
        title="Remplacer par l’exemple de liens ?"
        eyebrow="Démo Discovery"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setPendingLinkExample(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-primary"
              onClick={() => {
                setPendingLinkExample(false);
                onLoadLinkExample?.();
              }}
            >
              Charger l’exemple
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          La session actuelle (
          <strong className="text-foreground">
            {drafts.length} ligne{drafts.length !== 1 ? "s" : ""}
          </strong>
          ) sera remplacée par 5 lignes d’exemple : Feature reliée à un Epic Spine,
          Story reliée à une Feature Spine, puis une nouvelle chaîne Epic → Feature → Story.
        </p>
      </SttnsModal>

      <SttnsModal
        open={pendingCloudLoadId != null}
        onClose={() => setPendingCloudLoadId(null)}
        title="Remplacer la session en cours ?"
        eyebrow="Brouillon partagé"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setPendingCloudLoadId(null)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-primary"
              disabled={cloudBusy || !pendingCloudLoadId}
              onClick={() => {
                if (!pendingCloudLoadId) return;
                const id = pendingCloudLoadId;
                setPendingCloudLoadId(null);
                void performLoadCloud(id);
              }}
            >
              Charger le brouillon
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          La session actuelle contient{" "}
          <strong className="text-foreground">
            {drafts.length} ligne{drafts.length > 1 ? "s" : ""}
          </strong>
          {metadata.title.trim() ? (
            <>
              {" "}
              (« <span className="text-foreground">{metadata.title.trim()}</span> »)
            </>
          ) : null}
          . Charger un brouillon partagé l&apos;écrasera (cache navigateur inclus).
        </p>
        {pendingCloudLoadId ? (
          <p className="mt-3 text-sm text-foreground">
            Brouillon :{" "}
            <strong>
              {libraryRows.find((r) => r.id === pendingCloudLoadId)?.title ?? "Sans titre"}
            </strong>
          </p>
        ) : null}
      </SttnsModal>

      <SttnsModal
        open={conflictOpen}
        onClose={() => setConflictOpen(false)}
        title="Conflit de sauvegarde"
        eyebrow="Brouillon partagé"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              disabled={cloudBusy || !cloudDraftId}
              onClick={() => {
                if (!cloudDraftId) return;
                setConflictOpen(false);
                void performLoadCloud(cloudDraftId);
              }}
            >
              Recharger
            </button>
            <button
              type="button"
              className="sttns-btn-primary"
              disabled={cloudBusy}
              onClick={() => void handleSaveCloud({ force: true })}
            >
              Écraser
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          Une version plus récente existe sur le serveur
          {conflictServerUpdatedAt
            ? ` (maj ${formatDisplayDate(conflictServerUpdatedAt)})`
            : ""}
          . Écraser remplace le cloud avec votre session locale ; Recharger ignore vos
          modifications non sauvegardées.
        </p>
      </SttnsModal>

      <SttnsModal
        open={duplicateOpen}
        onClose={() => setDuplicateOpen(false)}
        title="Créer à partir de ce brouillon"
        eyebrow="Nouvel enregistrement partagé"
        size="md"
        footer={
          <>
            <button
              type="button"
              className="sttns-btn-secondary"
              onClick={() => setDuplicateOpen(false)}
            >
              Annuler
            </button>
            <button
              type="button"
              className="sttns-btn-primary"
              onClick={confirmDuplicate}
            >
              Dupliquer la session
            </button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-muted-foreground">
          La session courante reste en mémoire, détachée du brouillon partagé source.
          « Sauvegarder » créera une <strong className="text-foreground">nouvelle</strong>{" "}
          entrée dans l’espace projet (sans écraser la source).
        </p>
        <div className="mt-4 space-y-1.5">
          <label className="sttns-label" htmlFor="discovery-duplicate-title">
            Titre du nouveau brouillon
          </label>
          <input
            id="discovery-duplicate-title"
            className="sttns-input"
            value={duplicateTitle}
            autoFocus
            placeholder="Copie de…"
            onChange={(e) => setDuplicateTitle(e.target.value)}
          />
        </div>
      </SttnsModal>

      <SttnsModal
        open={libraryOpen}
        onClose={() => setLibraryOpen(false)}
        title="Brouillons partagés"
        eyebrow="Espace projet"
        size="md"
        footer={
          <button
            type="button"
            className="sttns-btn-secondary"
            onClick={() => setLibraryOpen(false)}
          >
            Fermer
          </button>
        }
      >
        <p className="mb-3 text-sm text-muted-foreground">
          Visibles par tous les membres du projet. La finalisation Spine reste séparée.
        </p>
        {libraryLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Chargement…
          </div>
        ) : libraryRows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Aucun brouillon partagé. Utilisez <strong>Sauvegarder</strong> pour en créer un.
          </p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border">
            {libraryRows.map((row) => (
              <li
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-foreground">{row.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {row.lineCount} ligne{row.lineCount > 1 ? "s" : ""}
                    {row.author.trim() ? ` · ${row.author.trim()}` : ""} · maj{" "}
                    {formatDisplayDate(row.updatedAt)}
                    {cloudDraftId === row.id ? " · ouvert" : ""}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    className="sttns-btn-secondary sttns-btn-sm"
                    disabled={cloudBusy}
                    title="Charger une copie détachée pour un nouvel enregistrement"
                    onClick={() =>
                      void performLoadCloud(row.id, {
                        fork: true,
                        forkTitle: copyTitleFrom(row.title),
                      })
                    }
                  >
                    <Copy className="h-4 w-4 shrink-0" />
                    Créer à partir de
                  </button>
                  <button
                    type="button"
                    className="sttns-btn-primary sttns-btn-sm"
                    disabled={cloudBusy}
                    onClick={() => requestLoadCloud(row.id)}
                  >
                    Ouvrir
                  </button>
                  <button
                    type="button"
                    className="sttns-btn-ghost sttns-btn-sm text-destructive"
                    disabled={cloudBusy}
                    title="Supprimer"
                    aria-label={`Supprimer ${row.title}`}
                    onClick={() => void handleDeleteCloud(row.id)}
                  >
                    <Trash2 className="h-4 w-4 shrink-0" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SttnsModal>
    </div>
  );
}
