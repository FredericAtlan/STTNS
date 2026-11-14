"use client";

import { useState } from "react";
import { Download, Upload, Loader2 } from "lucide-react";
import { CsvImportModal } from "./CsvImportModal";
import type { ImportMode } from "@/lib/sttns/types";
import { SttnsIconTip } from "@/components/ui/SttnsIconTip";

type Props = {
  onExport: () => Promise<void>;
  onImport: (mode: ImportMode, file: File) => Promise<void>;
  entityName: string;
  isZip?: boolean;
};

export function CsvActionButtons({ onExport, onImport, entityName, isZip = false }: Props) {
  const [isExporting, setIsExporting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch (err: any) {
      alert(`Erreur lors de l'export: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <SttnsIconTip label={`Importer ${entityName}`} placement="bottom">
          <button
            onClick={() => setIsModalOpen(true)}
            className="sttns-btn-icon text-zinc-600 hover:text-zinc-900"
            aria-label={`Importer ${entityName}`}
          >
            <Download className="h-4 w-4" />
          </button>
        </SttnsIconTip>
        <SttnsIconTip label={`Exporter ${entityName}`} placement="bottom">
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="sttns-btn-icon text-zinc-600 hover:text-zinc-900"
            aria-label={`Exporter ${entityName}`}
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
          </button>
        </SttnsIconTip>
      </div>

      <CsvImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={onImport}
        title={`Importer ${entityName}`}
        accept={isZip ? ".zip" : ".csv"}
      />
    </>
  );
}