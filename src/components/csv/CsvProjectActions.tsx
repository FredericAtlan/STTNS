"use client";

import JSZip from "jszip";
import { CsvActionButtons } from "./CsvActionButtons";
import { exportFullProjectAction, importFullProjectAction } from "@/app/projects/csvActions";
import type { ImportMode } from "@/lib/sttns/types";
import { generateCsv, parseCsv } from "@/lib/csv/csvUtils";

type Props = {
  projectId: string;
  projectSlug: string;
};

export function CsvProjectActions({ projectId, projectSlug }: Props) {
  const handleExport = async () => {
    const res = await exportFullProjectAction(projectId);
    if (!res.ok || !res.data || !res.metadata) throw new Error(res.error || "Erreur d'export");
    
    const zip = new JSZip();
    
    // Add metadata manifest
    zip.file("manifest.json", JSON.stringify(res.metadata, null, 2));
    
    for (const [entity, data] of Object.entries(res.data || {})) {
      if (data && data.length > 0) {
        const csvContent = generateCsv(data);
        zip.file(`${entity}.csv`, csvContent);
      }
    }
    
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    const dateStr = new Date().toISOString().split("T")[0];
    link.download = `${res.metadata.projectName.replace(/\s+/g, "_")}_Complet_${dateStr}.zip`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (mode: ImportMode, file: File) => {
    const zip = new JSZip();
    const contents = await zip.loadAsync(file);
    
    const projectData: Record<string, any[]> = {};
    
    for (const [filename, zipEntry] of Object.entries(contents.files)) {
      if (!zipEntry.dir && filename.endsWith(".csv")) {
        const entity = filename.replace(".csv", "");
        const text = await zipEntry.async("text");
        projectData[entity] = parseCsv<any>(text);
      }
    }
    
    if (Object.keys(projectData).length === 0) {
      throw new Error("L'archive ZIP ne contient aucun fichier CSV valide.");
    }
    
    const res = await importFullProjectAction(projectId, mode, projectData);
    if (!res.ok) throw new Error(res.error);
  };

  return (
    <CsvActionButtons
      onExport={handleExport}
      onImport={handleImport}
      entityName="Projet (ZIP)"
      isZip
    />
  );
}