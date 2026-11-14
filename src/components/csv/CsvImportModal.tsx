"use client";

import { useState, useEffect } from "react";
import { Upload, AlertTriangle } from "lucide-react";
import type { ImportMode } from "@/lib/sttns/types";
import { SttnsModal } from "@/components/ui/SttnsModal";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (mode: ImportMode, file: File) => Promise<void>;
  title: string;
  accept?: string;
  /** Fichier pré-sélectionné (ex. glisser-déposer). */
  initialFile?: File | null;
};

export function CsvImportModal({ isOpen, onClose, onConfirm, title, accept = ".csv", initialFile = null }: Props) {
  const [mode, setMode] = useState<ImportMode>("merge");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && initialFile) setFile(initialFile);
    if (!isOpen) setFile(null);
  }, [isOpen, initialFile]);

  const handleConfirm = async () => {
    if (!file) {
      setError("Veuillez sélectionner un fichier.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(mode, file);
      onClose();
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Une erreur est survenue lors de l'import.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <SttnsModal
      open={isOpen}
      onClose={onClose}
      title={title}
      size="md"
      preventClose={busy}
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="sttns-btn-secondary sttns-btn-md"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => void handleConfirm()}
            disabled={busy || !file}
            className="sttns-btn-primary sttns-btn-md"
          >
            {busy ? (
              "Importation..."
            ) : (
              <>
                <Upload className="h-4 w-4" />
                Importer
              </>
            )}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="sttns-label">Fichier ({accept})</label>
          <input
            type="file"
            accept={accept}
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="sttns-input"
          />
        </div>

        <div>
          <p className="sttns-label">Mode d&apos;import</p>
          <div className="space-y-2">
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="importMode"
                value="merge"
                checked={mode === "merge"}
                onChange={() => setMode("merge")}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-medium text-foreground">
                  Mise à jour / Fusion
                </span>
                <span className="block text-xs text-muted-foreground">
                  Met à jour les éléments existants (par ID), ajoute les nouveaux.
                  (Recommandé)
                </span>
              </div>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-medium text-foreground">
                  Remplacement total
                </span>
                <span className="block text-xs text-destructive">
                  Attention : Efface toutes les données existantes avant d&apos;importer.
                </span>
              </div>
            </label>
            <label className="flex items-start gap-2">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={mode === "append"}
                onChange={() => setMode("append")}
                className="mt-1"
              />
              <div>
                <span className="block text-sm font-medium text-foreground">Ajout simple</span>
                <span className="block text-xs text-muted-foreground">
                  Ajoute tout comme de nouveaux éléments (ignore les IDs du fichier, risque de
                  doublons).
                </span>
              </div>
            </label>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}
      </div>
    </SttnsModal>
  );
}
