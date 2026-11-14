"use client";

import { CsvActionButtons } from "./CsvActionButtons";
import { exportEntityAction, importEntityAction } from "@/app/projects/csvActions";
import type { ImportMode } from "@/lib/sttns/types";
import { generateCsv, parseCsv, downloadCsv } from "@/lib/csv/csvUtils";

type Props = {
  projectId: string;
  entity: "nsm" | "personas" | "pain_points" | "jtbd" | "user_stories" | "epics" | "features";
  entityName: string;
};

export function CsvSectionActions({ projectId, entity, entityName }: Props) {
  const handleExport = async () => {
    const res = await exportEntityAction(projectId, entity);
    if (!res.ok || !res.metadata || !res.data) throw new Error(res.error || "Erreur d'export");
    
    const csvContent = generateCsv(res.data);
    const dateStr = new Date().toISOString().split("T")[0];
    const projectName = res.metadata.projectName.replace(/\s+/g, "_");
    const safeEntityName = entityName.replace(/\s+/g, "_");
    downloadCsv(`${projectName}_${safeEntityName}_${dateStr}.csv`, csvContent);
  };

  const handleImport = async (mode: ImportMode, file: File) => {
    const text = await file.text();
    const rows = parseCsv<any>(text);
    
    if (rows.length === 0) {
      throw new Error("Le fichier CSV est vide ou mal formaté.");
    }
    
    const res = await importEntityAction(projectId, entity, mode, rows);
    if (!res.ok) throw new Error(res.error);
  };

  return (
    <CsvActionButtons
      onExport={handleExport}
      onImport={handleImport}
      entityName={entityName}
    />
  );
}